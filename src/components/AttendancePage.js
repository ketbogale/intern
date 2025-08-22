import React, { useState, useRef, useEffect } from 'react';
import './AttendancePage.css';

const AttendancePage = ({ user, onLogout }) => {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const successAudioRef = useRef(null);
  const errorAudioRef = useRef(null);

  useEffect(() => {
    // Focus on input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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

    setIsLoading(true);
    setMessage('');
    setStudent(null);

    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      // Refocus input for next scan
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
      onLogout(); // Logout anyway
    }
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <div className="header-left">
          <div className="logo-section">
            <img src="/images/salale_university_logo.png" alt="Salale University" />
            <h1 className="brand-name">Meal Attendance System</h1>
          </div>
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
              <form onSubmit={handleSubmit}>
                <label htmlFor="studentId">Student ID (Manual or Scan Barcode):</label>
                <input
                  ref={inputRef}
                  type="text"
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter ID"
                  autoComplete="off"
                  required
                />
                <button type="submit" className="check-btn" disabled={isLoading}>
                  {isLoading ? 'Checking...' : 'Check Attendance'}
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
