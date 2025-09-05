import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Navbar, Badge } from 'react-bootstrap';
import './AttendancePage.css';

const AttendancePage = ({ user, onLogout }) => {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mealWindowBlocked, setMealWindowBlocked] = useState(true);
  const [nextMealInfo, setNextMealInfo] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [mealWindows, setMealWindows] = useState({});
  const inputRef = useRef(null);
  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  // API base URL from environment or fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || '';

  // Fetch meal windows from server
  const fetchMealWindows = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meal-windows`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.mealWindows) {
          setMealWindows(data.mealWindows);
        } else {
          console.error('Invalid API response structure:', data);
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching meal windows:', error);
    }
  };

  // Meal window timing logic (strict start → end only)
  const checkMealWindow = useCallback(() => {
    console.log('🔄 Checking meal window status...');
    console.log('📊 Meal windows from database:', mealWindows);
    
    if (Object.keys(mealWindows).length === 0) {
      console.log('⏳ No meal windows loaded - blocking input');
      setMealWindowBlocked(true);
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    console.log(`🕐 Current time: ${Math.floor(currentMinutes/60)}:${(currentMinutes%60).toString().padStart(2,'0')} (${currentMinutes} minutes)`);

    const mealWindowsInMinutes = {};
    Object.entries(mealWindows).forEach(([mealType, config]) => {
      console.log(`📋 Processing ${mealType}:`, config);
      if (config.enabled) {
        const [startHour, startMinute] = config.startTime.split(':').map(Number);
        const [endHour, endMinute] = config.endTime.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        mealWindowsInMinutes[mealType] = {
          start: startTime,
          end: endTime
        };
        
        console.log(`📋 ${mealType}: ${config.startTime}-${config.endTime} → ${startTime}-${endTime} minutes`);
      } else {
        console.log(`❌ ${mealType} is disabled`);
      }
    });

    let isInMealWindow = false;
    let nextMealType = '';
    let timeUntilOpen = null;

    // Check if in any valid meal window
    for (const [mealType, window] of Object.entries(mealWindowsInMinutes)) {
      console.log(`🔍 Checking ${mealType}: current=${currentMinutes}, start=${window.start}, end=${window.end}`);
      if (currentMinutes >= window.start && currentMinutes <= window.end) {
        isInMealWindow = true;
        console.log(`✅ Currently in ${mealType} window - INPUT ENABLED`);
        break;
      }
    }
    
    console.log(`📊 Final result: isInMealWindow=${isInMealWindow}, will block input=${!isInMealWindow}`);

    if (!isInMealWindow) {
      // Find next meal window
      const sortedWindows = Object.entries(mealWindowsInMinutes)
        .sort(([, a], [, b]) => a.start - b.start);

      for (const [meal, window] of sortedWindows) {
        if (currentMinutes < window.start) {
          nextMealType = meal;
          timeUntilOpen = window.start - currentMinutes;
          break;
        }
      }

      // If no meal left today, use first tomorrow
      if (!nextMealType && sortedWindows.length > 0) {
        const [firstMeal, firstWindow] = sortedWindows[0];
        nextMealType = firstMeal;
        timeUntilOpen = firstWindow.start + (24 * 60) - currentMinutes;
      }
    }

    setMealWindowBlocked(!isInMealWindow);

    if (timeUntilOpen) {
      setCountdownSeconds(timeUntilOpen * 60);

      const hours = Math.floor(timeUntilOpen / 60);
      const minutes = timeUntilOpen % 60;

      const nextWindowTime = new Date();
      nextWindowTime.setMinutes(nextWindowTime.getMinutes() + timeUntilOpen);
      const timeString = nextWindowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let timeText;
      if (hours > 0) {
        timeText = `${hours}h ${minutes}m (${timeString})`;
      } else {
        timeText = `${minutes}m (${timeString})`;
      }

      setNextMealInfo(
        `${nextMealType.charAt(0).toUpperCase() + nextMealType.slice(1)} window opens in ${timeText}`
      );
    } else {
      setCountdownSeconds(0);
      setNextMealInfo('');
    }
  }, [mealWindows]);

  // Initial load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    fetchMealWindows();
  }, []);

  // Re-check whenever meal windows change with more responsive timing
  useEffect(() => {
    if (Object.keys(mealWindows).length > 0) {
      checkMealWindow();
      const interval = setInterval(checkMealWindow, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    }
  }, [mealWindows, checkMealWindow]);

  // Periodic refresh of meal windows (every 5 minutes)
  useEffect(() => {
    const refreshInterval = setInterval(fetchMealWindows, 300000); // 5 minutes
    return () => clearInterval(refreshInterval);
  }, []);

  // Countdown timer in seconds
  useEffect(() => {
    if (countdownSeconds > 0) {
      const interval = setInterval(() => {
        setCountdownSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdownSeconds]);

  const playSound = (isSuccess, retryCount = 0) => {
    try {
      const audio = isSuccess ? successAudioRef.current : errorAudioRef.current;
      if (audio) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Audio playback failed:', error);
            // Retry once after a short delay
            if (retryCount < 1) {
              setTimeout(() => playSound(isSuccess, retryCount + 1), 500);
            }
          });
        }
      }
    } catch (error) {
      console.log('Audio playback failed:', error);
      // Retry once after a short delay
      if (retryCount < 1) {
        setTimeout(() => playSound(isSuccess, retryCount + 1), 500);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    if (mealWindowBlocked) {
      setMessage(`❌ Attendance blocked: ${nextMealInfo || 'Meal window closed'}`);
      playSound(false);
      return;
    }

    setIsLoading(true);
    setMessage('');
    setStudent(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: studentId.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStudent(data.student);
        setStatus(data.status);

        switch (data.status) {
          case 'allowed':
            setMessage('✅ Meal allowed! Welcome!');
            playSound(true);
            break;
          case 'already_used':
            setMessage('❌ Meal already used for this period');
            playSound(false);
            break;
          case 'invalid':
            setMessage('❌ Student ID not found');
            playSound(false);
            break;
          case 'blocked':
            setMessage(`❌ ${data.message || 'Meal window is closed'}`);
            playSound(false);
            break;
          case 'error':
            setMessage(`❌ ${data.message || 'System error occurred'}`);
            playSound(false);
            break;
          default:
            setMessage('❌ Unknown status');
            playSound(false);
        }
      } else {
        setMessage('❌ System error. Please try again.');
        playSound(false);
      }
    } catch (error) {
      setMessage('❌ Network error. Please check connection.');
      playSound(false);
    } finally {
      setIsLoading(false);
      setStudentId('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST' });
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  };

  return (
    <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #0f1419 0%, #1e2a3a 100%)'}}>
      {/* Header */}
      <Navbar className="attendance-navbar">
        <Navbar.Brand className="navbar-brand-custom">
          <img 
            src="/images/salale_university_logo.png" 
            alt="Salale University"
          />
          <h1 className="navbar-title">Salale University</h1>
        </Navbar.Brand>
        <Button 
          onClick={handleLogout}
          className="logout-button ms-auto d-flex align-items-center gap-1"
        >
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </Button>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="py-2">
        <Row className="">
          <Col lg={5} className="mb-2 card-spacing-left">
            <Card className="shadow border-0 attendance-input-card">
              <Card.Body>
                {/* Meal Window Warning */}
                {mealWindowBlocked && nextMealInfo && (
                  <Alert variant="warning" className="d-flex align-items-center mb-2 py-1">
                    <i className="fas fa-clock me-2 small"></i>
                    <div className="flex-grow-1">
                      <div className="fw-semibold" style={{fontSize: '0.8rem'}}>{nextMealInfo}</div>
                      {countdownSeconds > 0 && (
                        <Badge bg="success" className="px-2 py-1 mt-1" style={{fontSize: '0.7rem'}}>
                          {countdownSeconds >= 3600
                            ? `${Math.floor(countdownSeconds / 3600)}h ${Math.floor((countdownSeconds % 3600) / 60)}m`
                            : countdownSeconds >= 60
                            ? `${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60}s`
                            : `${countdownSeconds}s`}
                        </Badge>
                      )}
                    </div>
                  </Alert>
                )}

                {/* Input Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-1">
                    <Form.Label className="text-light fw-semibold" style={{fontSize: '0.85rem', marginBottom: '0.25rem'}}>Student ID (Manual or Scan Barcode):</Form.Label>
                    <Form.Control
                      ref={inputRef}
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder={mealWindowBlocked ? "Meal window closed" : "Enter ID"}
                      autoComplete="off"
                      disabled={mealWindowBlocked}
                      required
                      style={{
                        background: 'rgba(44, 62, 80, 0.6)',
                        border: '1px solid rgba(149, 165, 166, 0.3)',
                        color: '#ecf0f1',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.9rem'
                      }}
                    />
                  </Form.Group>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="w-100"
                    disabled={isLoading || mealWindowBlocked}
                    style={{
                      background: mealWindowBlocked ? '#bdc3c7' : 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                      border: 'none',
                      padding: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    {mealWindowBlocked ? 'Meal Window Closed' : isLoading ? 'Checking...' : 'Check Attendance'}
                  </Button>
                </Form>

                {/* Message */}
                {message && (
                  <Alert 
                    variant={status === 'allowed' ? 'success' : 'danger'} 
                    className="mt-3 text-center fw-semibold py-3 message-fade-in mb-0"
                    style={{fontSize: '0.8rem'}}
                  >
                    {message}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Student Information */}
          <Col lg={5} className="card-spacing-right">
            {student && (
              <Card className="shadow border-0 student-info-card">
                <Card.Body className="p-2">
                  <div 
                    className={`status-message-enhanced message-fade-in ${
                      status === 'allowed' ? 'status-allowed' :
                      status === 'already_used' ? 'status-already-used' :
                      'status-denied'
                    }`}
                  >
                    {status === 'allowed' ? '✅ ALLOWED' :
                     status === 'already_used' ? '⚠️ ALREADY USED' :
                     '❌ DENIED'}
                  </div>
                  
                  <Row>
                    <Col md={5}>
                      <div className="text-light">
                        <div className="mb-1" style={{fontSize: '0.8rem'}}>
                          <strong className="text-info">Name:</strong> {student.name}
                        </div>
                        <div className="mb-1" style={{fontSize: '0.8rem'}}>
                          <strong className="text-info">ID:</strong> {student.id}
                        </div>
                        <div className="mb-1" style={{fontSize: '0.8rem'}}>
                          <strong className="text-info">Program:</strong> {student.department}
                        </div>
                      </div>
                    </Col>
                    <Col md={7} className="text-center">
                      <img
                        src={student.photoUrl || '/images/default-student.png'}
                        alt="Student Photo"
                        className="img-fluid rounded"
                        style={{
                          width: '180px',
                          height: '180px',
                          objectFit: 'cover',
                          border: '2px solid #74b9ff'
                        }}
                        onError={(e) => {
                          e.target.src = '/images/default-student.png';
                        }}
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>

      {/* Audio elements */}
      <audio ref={successAudioRef} preload="auto">
        <source src="/sounds/success.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={errorAudioRef} preload="auto">
        <source src="/sounds/error.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default AttendancePage;
