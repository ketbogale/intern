import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // Fetch meal windows from database
  const fetchMealWindows = useCallback(async () => {
    try {
      const response = await fetch('/api/meal-windows');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.mealWindows) {
          setMealWindows(data.mealWindows);
        }
      }
    } catch (error) {
      // Error fetching meal windows - fail silently
    }
  }, []);

  // Meal window timing logic (strict start → end only)
  const checkMealWindow = useCallback(() => {
    
    if (Object.keys(mealWindows).length === 0) {
      setMealWindowBlocked(true);
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const mealWindowsInMinutes = {};
    Object.entries(mealWindows).forEach(([mealType, config]) => {
      if (config.enabled) {
        const [startHour, startMinute] = config.startTime.split(':').map(Number);
        const [endHour, endMinute] = config.endTime.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        mealWindowsInMinutes[mealType] = {
          start: startTime,
          end: endTime
        };
      }
    });

    let isInMealWindow = false;
    let nextMealType = '';
    let timeUntilOpen = null;

    // Check if in any valid meal window
    for (const [, window] of Object.entries(mealWindowsInMinutes)) {
      if (currentMinutes >= window.start && currentMinutes <= window.end) {
        isInMealWindow = true;
        break;
      }
    }

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

  // Initial load and focus management
  useEffect(() => {
    fetchMealWindows();
  }, [fetchMealWindows]);

  // Auto-focus input when component mounts or becomes visible
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !mealWindowBlocked) {
        inputRef.current.focus();
      }
    };

    // Focus immediately
    focusInput();

    // Also focus when window regains focus (coming from another page)
    window.addEventListener('focus', focusInput);
    
    return () => {
      window.removeEventListener('focus', focusInput);
    };
  }, [mealWindowBlocked]);

  // Re-check whenever meal windows change with more responsive timing
  useEffect(() => {
    if (Object.keys(mealWindows).length > 0) {
      // Check meal window status every second
      const interval = setInterval(checkMealWindow, 1000);
      return () => clearInterval(interval);
    }
  }, [mealWindows, checkMealWindow]);

  // Periodic refresh of meal windows (every 5 minutes)
  useEffect(() => {
    const refreshInterval = setInterval(fetchMealWindows, 300000); // 5 minutes
    return () => clearInterval(refreshInterval);
  }, [fetchMealWindows]);

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
            setMessage('✅ Attendance recorded successfully!');
            playSound(true);
            setStudentId('');
            // Clear message after 2.5 seconds
            setTimeout(() => {
              setMessage('');
            }, 2500);
            break;
          case 'already_used':
            setMessage('❌ Meal already used for this period');
            playSound(false);
            setStudentId('');
            setTimeout(() => setMessage(''), 2500);
            break;
          case 'invalid':
            setMessage('❌ Student ID not found');
            playSound(false);
            setStudentId('');
            setTimeout(() => setMessage(''), 2500);
            break;
          case 'blocked':
            setMessage(`❌ ${data.message || 'Meal window is closed'}`);
            playSound(false);
            setStudentId('');
            setTimeout(() => setMessage(''), 2500);
            break;
          case 'error':
            setMessage(`❌ ${data.message || 'System error occurred'}`);
            playSound(false);
            setStudentId('');
            setTimeout(() => setMessage(''), 2500);
            break;
          default:
            setMessage('❌ Unknown status');
            playSound(false);
            setStudentId('');
            setTimeout(() => setMessage(''), 2500);
        }
      } else {
        setMessage('❌ System error. Please try again.');
        playSound(false);
        setStudentId('');
        setTimeout(() => setMessage(''), 2500);
      }
    } catch (error) {
      setMessage('❌ Network error. Please check connection.');
      playSound(false);
      setStudentId('');
      setTimeout(() => setMessage(''), 2500);
    } finally {
      setIsLoading(false);
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
      <Navbar bg="dark" variant="dark" className="px-4 shadow-sm" style={{background: 'rgba(30, 42, 58, 0.95) !important', backdropFilter: 'blur(10px)'}}>
        <Navbar.Brand className="d-flex align-items-center">
          <img 
            src="/images/salale_university_logo.png" 
            width="50" 
            height="50" 
            className="me-3" 
            alt="Salale University"
          />
          <h1 className="h4 mb-0 text-light">Salale University</h1>
        </Navbar.Brand>
        <Button 
          onClick={handleLogout}
          variant="outline-light"
          size="sm"
          className="ms-auto py-1 px-2"
          style={{
            '--bs-btn-hover-bg': 'rgba(220, 53, 69, 0.2)',
            '--bs-btn-hover-border-color': 'rgba(220, 53, 69, 0.5)',
            transition: 'all 0.3s ease'
          }}
        >
          <i className="fas fa-sign-out-alt me-1"></i>
          Logout
        </Button>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="py-2">
        <Row className="">
          <Col lg={5} className="mb-2 card-spacing-left">
            <Card className="shadow-lg border-0 bg-gradient" style={{background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', borderRadius: '1rem', height: 'fit-content'}}>
              <Card.Body>
                {/* Meal Window Warning */}
                {mealWindowBlocked && nextMealInfo && (
                  <Alert variant="warning" className="meal-window-alert d-flex align-items-center mb-2">
                    <i className="fas fa-clock me-3"></i>
                    <div className="flex-grow-1">
                      <div className="meal-window-text">{nextMealInfo}</div>
                      {countdownSeconds > 0 && (
                        <div className="d-flex align-items-center mt-2">
                          <Badge className="countdown-badge me-2">
                            {countdownSeconds >= 3600
                              ? `${Math.floor(countdownSeconds / 3600)}h ${Math.floor((countdownSeconds % 3600) / 60)}m`
                              : countdownSeconds >= 60
                              ? `${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60}s`
                              : `${countdownSeconds}s`}
                          </Badge>
                          <span className="text-muted fw-semibold">remaining</span>
                        </div>
                      )}
                    </div>
                  </Alert>
                )}

                {/* Input Form */}
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-1">
                    <Form.Label className="text-light fw-semibold mb-2">Student ID (Manual or Scan Barcode):</Form.Label>
                    <Form.Control
                      ref={inputRef}
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder={mealWindowBlocked ? "Meal window closed" : "Enter ID"}
                      autoComplete="off"
                      disabled={mealWindowBlocked}
                      required
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
              <Card className="shadow-lg border-0 bg-gradient" style={{background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', borderRadius: '1rem', minHeight: '400px'}}>
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
                    <Col md={4} className="text-center mb-3">
                      {student.photoUrl ? (
                        <>
                          <img 
                            src={student.photoUrl} 
                            alt={student.name}
                            className="student-photo"
                            style={{
                              width: '200px',
                              height: '220px',
                              objectFit: 'cover',
                              borderRadius: '0',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                          <div 
                            className="student-photo-placeholder rounded-circle border border-light align-items-center justify-content-center"
                            style={{
                              width: '120px',
                              height: '120px',
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              display: 'none',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                            }}
                          >
                            <i className="fas fa-user text-light" style={{fontSize: '3rem', opacity: 0.7}}></i>
                          </div>
                        </>
                      ) : (
                        <div 
                          className="student-photo-placeholder rounded-circle border border-light d-flex align-items-center justify-content-center"
                          style={{
                            width: '120px',
                            height: '120px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                          }}
                        >
                          <i className="fas fa-user text-light" style={{fontSize: '3rem', opacity: 0.7}}></i>
                        </div>
                      )}
                    </Col>
                    <Col md={8}>
                      <div className="text-light">
                        <div className="student-info-text mb-3">
                          <span className="student-info-label">Name:</span>
                          <span className="student-info-value">{student.name}</span>
                        </div>
                        <div className="student-info-text mb-3">
                          <span className="student-info-label">ID:</span>
                          <span className="student-info-value">{student.id}</span>
                        </div>
                        <div className="student-info-text mb-3">
                          <span className="student-info-label">Program:</span>
                          <span className="student-info-value">{student.department}</span>
                        </div>
                      </div>
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
