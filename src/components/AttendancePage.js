import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  // Fetch meal windows from server
  const fetchMealWindows = async () => {
    try {
      const response = await fetch('/api/meal-windows');
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

  // Re-check whenever meal windows change
  useEffect(() => {
    if (Object.keys(mealWindows).length > 0) {
      checkMealWindow();
      const interval = setInterval(checkMealWindow, 60000);
      return () => clearInterval(interval);
    }
  }, [mealWindows, checkMealWindow]);

  // Countdown timer in seconds
  useEffect(() => {
    if (countdownSeconds > 0) {
      const interval = setInterval(() => {
        setCountdownSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [countdownSeconds]);

  const playSound = (isSuccess) => {
    try {
      if (isSuccess && successAudioRef.current) {
        successAudioRef.current.play();
      } else if (!isSuccess && errorAudioRef.current) {
        errorAudioRef.current.play();
      }
    } catch (error) {
      console.log('Audio playback failed:', error);
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
      const response = await fetch('/api/attendance', {
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
      await fetch('/api/logout', { method: 'POST' });
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
      onLogout();
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-left">
          <img src="/images/salale_university_logo.png" alt="Salale University" />
          <h1>Salale University</h1>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>

      <div className="attendance-content">
        <div className="attendance-layout">
          {/* Left side: Input form */}
          <div className="input-section">
            <div className="input-card">
              {mealWindowBlocked && nextMealInfo && (
                <div className="meal-window-warning">
                  <i className="fas fa-clock"></i>
                  <div className="countdown-info">
                    <span>{nextMealInfo}</span>
                    {countdownSeconds > 0 && (
                      <div className="countdown-timer">
                        <span className="countdown-number">
                          {countdownSeconds >= 3600
                            ? `${Math.floor(countdownSeconds / 3600)}h ${Math.floor((countdownSeconds % 3600) / 60)}m`
                            : countdownSeconds >= 60
                            ? `${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60}s`
                            : `${countdownSeconds}s`}
                        </span>
                        <span className="countdown-label">remaining</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <label htmlFor="studentId">Student ID (Manual or Scan Barcode):</label>
                <input
                  ref={inputRef}
                  type="text"
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder={mealWindowBlocked ? "Meal window closed" : "Enter ID"}
                  autoComplete="off"
                  disabled={mealWindowBlocked}
                  required
                />
                <button type="submit" className="check-btn" disabled={isLoading || mealWindowBlocked}>
                  {mealWindowBlocked ? 'Meal Window Closed' : isLoading ? 'Checking...' : 'Check Attendance'}
                </button>
              </form>

              {message && (
                <div className={`attendance-message ${status}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Right side: Student information */}
          <div className="result-section">
            {student && (
              <div className="student-card">
                <div className={`status-message ${status}`}>
                  {status === 'allowed' ? '✅ ALLOWED' :
                   status === 'already_used' ? '❌ ALREADY USED' :
                   '❌ DENIED'}
                </div>
                <div className="student-info-row">
                  <div className="student-details">
                    <div><strong>Name:</strong> {student.name}</div>
                    <div><strong>ID Number:</strong> {student.id}</div>
                    <div><strong>Program:</strong> {student.department}</div>
                  </div>
                  <div className="student-photo">
                    <img
                      src={student.photoUrl || '/images/default-student.png'}
                      alt="Student Photo"
                      onError={(e) => {
                        e.target.src = '/images/default-student.png';
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
