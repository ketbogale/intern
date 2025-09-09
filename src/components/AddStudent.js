import React, { useState } from 'react';
import './EmailChangeVerification.css';

const AddStudent = () => {
  const [studentData, setStudentData] = useState({
    id: '',
    name: '',
    department: '',
    photoUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!studentData.id.trim() || !studentData.name.trim()) {
      setMessage('Please fill in both Student ID and Name - these fields are required.');
      setSuccess(false);
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      
      const response = await fetch('/api/students/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setMessage('✅ Student added successfully!');
        // Clear form after successful submission
        setTimeout(() => {
          setStudentData({
            id: '',
            name: '',
            department: '',
            photoUrl: ''
          });
          setMessage('');
          setSuccess(false);
        }, 2500);
      } else {
        setSuccess(false);
        setMessage('❌ ' + (data.error || 'Failed to register student. Please check the information and try again.'));
        setTimeout(() => setMessage(''), 2500);
      }
    } catch (error) {
      setSuccess(false);
      setMessage('🌐 Network error occurred. Please check your internet connection and try again.');
      setTimeout(() => setMessage(''), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card" style={{ maxWidth: '450px' }}>
        <div className="email-verification-header">
          <h1>Add New Student</h1>
        </div>
        
        <div className="email-verification-content">
          {message && (
            <div className={`result-section ${success ? 'success' : 'error'}`}>
              <div className="result-message">
                <p>{message}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleAddStudent} className="form-section">
            <div className="form-group">
              <label>Student ID</label>
              <input
                type="text"
                value={studentData.id}
                onChange={(e) => setStudentData({...studentData, id: e.target.value})}
                placeholder="Enter student ID"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={studentData.name}
                onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                placeholder="Enter student name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={studentData.department}
                onChange={(e) => setStudentData({...studentData, department: e.target.value})}
                placeholder="Enter department (optional)"
              />
            </div>
            
            <div className="form-group">
              <label>Photo Path</label>
              <input
                type="text"
                value={studentData.photoUrl}
                onChange={(e) => setStudentData({...studentData, photoUrl: e.target.value})}
                placeholder="e.g., /public/images/student.jpg (optional)"
              />
            </div>
            
            <div className="form-actions" style={{ justifyContent: 'center', gap: '12px' }}>
              <button 
                type="button" 
                onClick={handleBackToDashboard}
                style={{
                  flex: '1',
                  padding: '16px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4b5563';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6b7280';
                }}
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                disabled={loading || !studentData.id.trim() || !studentData.name.trim()}
                style={{
                  flex: '1',
                  padding: '16px 24px',
                  backgroundColor: loading || !studentData.id.trim() || !studentData.name.trim() ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading || !studentData.id.trim() || !studentData.name.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onMouseEnter={(e) => {
                  if (!loading && studentData.id.trim() && studentData.name.trim()) {
                    e.target.style.backgroundColor = '#059669';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && studentData.id.trim() && studentData.name.trim()) {
                    e.target.style.backgroundColor = '#10b981';
                  }
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '8px'
                    }}></div>
                    Registering...
                  </>
                ) : (
                  'Register Student'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;
