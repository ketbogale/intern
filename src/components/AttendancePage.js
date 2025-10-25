import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Form, Button, Navbar, Modal } from 'react-bootstrap';
import BarcodeScanner from './BarcodeScanner';
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
  const [barcodeScanningEnabled, setBarcodeScanningEnabled] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  
  const [targetTime, setTargetTime] = useState(null);
  const inputRef = useRef(null);
  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  // API base URL - use relative URLs for security
  const API_BASE_URL = '';

  

  // Fetch meal windows from database
  const fetchMealWindows = useCallback(async () => {
    try {
      const response = await fetch('/api/meal-windows');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.mealWindows) {
          setMealWindows(data.mealWindows);
          // Immediately re-evaluate the window using freshly fetched DB config
          setTimeout(() => {
            try { checkMealWindow(); } catch {}
          }, 0);
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
      // Calculate the exact target time when the window opens
      const nextWindowTime = new Date();
      nextWindowTime.setMinutes(nextWindowTime.getMinutes() + timeUntilOpen);
      setTargetTime(nextWindowTime);
      
      const timeString = nextWindowTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Set the meal info without time duration (countdown badge will show the time)
      setNextMealInfo(
        `${nextMealType.charAt(0).toUpperCase() + nextMealType.slice(1)} window opens at ${timeString}`
      );
    } else {
      setTargetTime(null);
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

  // Stable countdown timer based on target time
  useEffect(() => {
    if (!targetTime) {
      setCountdownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const timeDiff = targetTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setCountdownSeconds(0);
        setTargetTime(null);
      } else {
        setCountdownSeconds(Math.ceil(timeDiff / 1000));
      }
    };

    // Update immediately
    updateCountdown();

    // Then update every second
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const playSound = useCallback((isSuccess, retryCount = 0) => {
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
  }, []);

  // Extract attendance processing logic for reuse
  const processAttendance = useCallback(async (idToProcess) => {
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
        body: JSON.stringify({ studentId: idToProcess }),
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
            setTimeout(() => setMessage(''), 2500);
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
  }, [mealWindowBlocked, nextMealInfo, API_BASE_URL, playSound]);

  // Handle barcode scan - automatically process scanned student ID
  const handleBarcodeScan = useCallback(async (scannedId) => {
    if (!scannedId.trim() || isLoading) return;
    setBarcodeScanningEnabled(false);
    // Mirror manual submit: reuse shared attendance logic
    setStudentId(scannedId.trim());
    try {
      await processAttendance(scannedId.trim());
    } finally {
      // Re-enable barcode scanning after a short delay to avoid double reads
      setTimeout(() => setBarcodeScanningEnabled(true), 1000);
    }
  }, [isLoading, processAttendance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId.trim()) return;

    // Use the extracted processAttendance function
    await processAttendance(studentId.trim());
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const idToReport = (student && student.id) || studentId.trim();
    if (!idToReport) {
      setReportMessage('⚠️ Please scan or enter a student ID before reporting.');
      return;
    }
    if (!reportReason.trim()) {
      setReportMessage('⚠️ Please provide a brief reason.');
      return;
    }
    try {
      setReportSubmitting(true);
      setReportMessage('');
      const payload = {
        studentId: idToReport,
        studentName: student?.name || '',
        department: student?.department || '',
        reason: reportReason.trim(),
        reporter: 'attendance_operator'
      };
      console.log('[Report] Submitting payload', payload);
      const resp = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      let data;
      const text = await resp.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.warn('[Report] Failed to parse JSON response, raw:', text);
        data = { success: false, message: text || 'Unexpected response' };
      }
      console.log('[Report] Response status', resp.status, 'data', data);
      if (resp.ok && data && data.success) {
        setReportMessage('✅ Report submitted to admin');
        setReportReason('');
        // Keep success message visible briefly, then close modal gracefully
        setTimeout(() => {
          setShowReportForm(false);
          setReportMessage('');
        }, 2000);
      } else {
        setReportMessage(`❌ ${data.message || 'Failed to submit report'}`);
        // Do not auto-clear error; let user read and close
      }
    } catch (err) {
      console.error('[Report] Network error', err);
      setReportMessage('🌐 Network error. Please try again.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore network errors on logout
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-vh-100 app-light-bg attendance-page">
      {/* Header */}
      <Navbar className="px-4 shadow-sm mint-header">
        <Navbar.Brand className="d-flex align-items-center">
          <img 
            src="/images/salale_university_logo.png" 
            width="50" 
            height="50" 
            className="me-3" 
            alt="Salale University"
          />
          <h1 className="h4 mb-0 text-dark">Salale University</h1>
        </Navbar.Brand>
        <Navbar.Text className="ms-auto">
          <span
            onClick={handleLogout}
            className="text-dark fw-semibold d-inline-flex align-items-center"
            style={{ cursor: 'pointer', fontSize: '0.95rem' }}
          >
            <i className="fas fa-sign-out-alt me-1"></i>
            Log out
          </span>
        </Navbar.Text>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="py-3">
        {/* Status Banner */}
        <div className={`status-banner ${mealWindowBlocked ? 'denied' : (status === 'allowed' ? 'allowed' : (status ? 'denied' : ''))}`}>
          {mealWindowBlocked && nextMealInfo ? (
            <>
              {nextMealInfo}
              {countdownSeconds > 0 && (
                <span className="ms-2">
                  ({`${Math.floor(countdownSeconds / 3600)}h ${Math.floor((countdownSeconds % 3600) / 60)}minutes`})
                </span>
              )}
            </>
          ) : (
            <>
              {status === 'allowed' && 'Allowed'}
              {status === 'already_used' && 'Already Used'}
              {status === 'blocked' && 'Denied'}
              {status === 'invalid' && 'Not Found'}
            </>
          )}
        </div>

        {/* Two Column Layout */}
        <Row className="g-4 align-items-start mt-2">
          {/* Left: Input + Labels */}
          <Col lg={5} md={5} className="left-pane">
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold mb-2">Enter ID</Form.Label>
                <Form.Control
                  ref={inputRef}
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder={mealWindowBlocked ? "Meal window closed" : "Enter ID"}
                  autoComplete="off"
                  disabled={mealWindowBlocked}
                  required
                  className="simple-input"
                />
              </Form.Group>
            </Form>

            <div className="simple-info">
              <div className="simple-row"><span className="simple-label">ID:</span> <span className="simple-value">{student?.id || ''}</span></div>
              <div className="simple-row"><span className="simple-label">Name:</span> <span className="simple-value">{student?.name || ''}</span></div>
              <div className="simple-row"><span className="simple-label">Department:</span> <span className="simple-value">{student?.department || ''}</span></div>
            </div>
          </Col>

          {/* Right: Large Photo with top-right Report overlay (works for photo and placeholder) */}
          <Col lg={7} md={12} className="right-pane">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '360px', height: '360px' }}>
                {student?.id && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="py-0 px-1"
                    onClick={() => setShowReportForm(true)}
                    disabled={isLoading}
                    title="Report this student to admin"
                    style={{ position: 'absolute', top: 3, right: 4, zIndex: 2, fontSize: '11px', lineHeight: 1.1, borderRadius: '8px', transform: 'scale(0.85)', transformOrigin: 'top right' }}
                  >
                    <i className="fas fa-flag me-1" style={{ fontSize: '0.75rem' }}></i>Report
                  </Button>
                )}
                {student?.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student?.name || 'Student photo'}
                    style={{ width: '360px', height: '360px', borderRadius: 0, objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div 
                    className="student-photo-placeholder border border-light d-flex align-items-center justify-content-center"
                    style={{ width: '360px', height: '360px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 0 }}
                  >
                    <i className="fas fa-user text-muted" style={{fontSize: '3rem', opacity: 0.5}}></i>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Report Modal */}
      <Modal 
        show={showReportForm}
        onHide={() => { setShowReportForm(false); setReportMessage(''); }}
        centered
      >
        <div style={{background: 'rgba(52, 73, 94, 0.95)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px'}}>
          <Modal.Header closeButton style={{borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent'}}>
            <Modal.Title style={{color: 'white'}}>
              <i className="fas fa-flag me-2"></i>
              Report Student to Admin
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{background: 'transparent'}}>
            <Form onSubmit={handleSubmitReport}>
              <Form.Group className="mb-3">
                <Form.Label style={{color: 'rgba(255,255,255,0.9)'}}>
                  Reason (max 1000 characters)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  maxLength={1000}
                  placeholder="Describe the issue briefly so the admin can follow up."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                />
              </Form.Group>
              {reportMessage && (
                <div className={`modal-message ${reportMessage.startsWith('✅') ? 'success' : 'error'}`} style={{ marginBottom: 10 }}>
                  {reportMessage}
                </div>
              )}
              <div className="d-flex justify-content-end gap-2">
                <Button
                  type="button"
                  variant="light"
                  onClick={() => { setShowReportForm(false); setReportMessage(''); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={reportSubmitting}>
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </div>
      </Modal>

      {/* Barcode Scanner Component */}
      <BarcodeScanner
        onScan={handleBarcodeScan}
        isEnabled={barcodeScanningEnabled && !mealWindowBlocked && !isLoading}
        minLength={3}
        maxLength={20}
        timeout={300}
      />

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
