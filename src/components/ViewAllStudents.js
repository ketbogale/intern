import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './EmailChangeVerification.css';

// Add CSS animations for the modal
const modalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

// Inject styles into document head
if (!document.getElementById('modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'modal-styles';
  styleSheet.textContent = modalStyles;
  document.head.appendChild(styleSheet);
}

const ViewAllStudents = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchAllStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search query
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/students/all');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setStudents(data.students);
        setFilteredStudents(data.students);
      } else {
        setError(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };


  return (
    <div className="email-verification-container">
      <div className="email-verification-card" style={{ maxWidth: '1000px', width: '95%' }}>
        <div className="email-verification-header">
          <h1>👥 All Students</h1>
          <p>Complete list of registered students in the system</p>
        </div>

        <div className="email-verification-content">
        {/* Search Bar */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e2e8f0';
            }}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            fontSize: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Loading students...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="result-section error">
            <p className="result-message">{error}</p>
          </div>
        )}

        {/* Students List */}
        {!loading && !error && (
          <>
            <div style={{
              marginBottom: '16px',
              color: '#6b7280',
              fontSize: '14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Showing {filteredStudents.length} of {students.length} students
            </div>

            <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              {filteredStudents.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280',
                  fontSize: '16px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  {searchQuery ? 'No students found matching your search.' : 'No students registered yet.'}
                </div>
              ) : (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Photo
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Student ID
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Name
                      </th>
                      <th style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Department
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length > 0 ? (
                        filteredStudents.map((student, index) => (
                        <tr key={student._id || index} style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                        <td style={{ padding: '12px 16px' }}>
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #e2e8f0',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                              }}
                              onClick={() => setSelectedPhoto({
                                url: student.photoUrl,
                                name: student.name,
                                id: student.id
                              })}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#f3f4f6',
                            display: student.photoUrl ? 'none' : 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#6b7280'
                          }}>
                            {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151'
                        }}>
                          {student.id}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#374151'
                        }}>
                          {student.name}
                        </td>
                        <td style={{
                          padding: '12px 16px',
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          {student.department || 'N/A'}
                        </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{
                          textAlign: 'center',
                          padding: '40px',
                          color: '#6b7280',
                          fontSize: '16px',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}>
                          {searchQuery ? 'No students found matching your search.' : 'No students registered yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => setSelectedPhoto(null)}
          >
            <div 
              style={{
                position: 'relative',
                maxWidth: '90vw',
                maxHeight: '90vh',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                animation: 'slideIn 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }}
              >
                ×
              </button>
              
              {/* Student Info */}
              <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                <h3 style={{ margin: '0 0 4px 0', color: '#374151' }}>
                  {selectedPhoto.name}
                </h3>
                <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                  ID: {selectedPhoto.id}
                </p>
              </div>
              
              {/* Photo */}
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.name}
                style={{
                  maxWidth: '400px',
                  maxHeight: '400px',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '8px',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="form-actions" style={{ justifyContent: 'center' }}>
          <button 
            type="button" 
            onClick={handleBackToDashboard}
            style={{
              width: '100%',
              padding: '16px 24px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#10b981';
            }}
          >
            Back to Dashboard
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAllStudents;
