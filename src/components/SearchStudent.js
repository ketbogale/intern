import React, { useState, useRef, useEffect } from 'react';
import './EmailChangeVerification.css';
import './SearchStudent.css';

const SearchStudent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentData, setEditStudentData] = useState({
    name: '',
    studentId: '',
    department: '',
    photoUrl: ''
  });
  const [editStudentMessage, setEditStudentMessage] = useState('');
  const [editStudentLoading, setEditStudentLoading] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [convertingStudent, setConvertingStudent] = useState(null);
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [conversionLoading, setConversionLoading] = useState(false);
  const [conversionMessage, setConversionMessage] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    window.searchTimeout = setTimeout(() => {
      handleStudentSearch(value);
    }, 500);
  };

  const handleStudentSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setSearchMessage('');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchMessage('');
      
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.students || []);
        if (data.students.length === 0) {
          setSearchMessage('No students found matching your search.');
          setTimeout(() => setSearchMessage(''), 2500);
        }
      } else {
        setSearchMessage('Search failed: ' + (data.message || 'No results found'));
        setSearchResults([]);
        setTimeout(() => setSearchMessage(''), 2500);
      }
    } catch (error) {
      setSearchMessage('Network error occurred. Please try again.');
      setSearchResults([]);
      setTimeout(() => setSearchMessage(''), 2500);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditStudentData({
      name: student.name || '',
      studentId: student.id || student.studentId || '',
      department: student.department || '',
      photoUrl: student.photoUrl || ''
    });
    setEditStudentMessage('');
    setShowEditStudentModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    
    try {
      setEditStudentLoading(true);
      setEditStudentMessage('');
      
      const response = await fetch(`/api/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editStudentData)
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        setEditStudentMessage('❌ Server error: API endpoint returned HTML instead of JSON. Check backend configuration.');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setEditStudentMessage('Student updated successfully!');
        setTimeout(() => {
          setEditStudentMessage('');
          setShowEditStudentModal(false);
          handleStudentSearch(searchQuery);
        }, 1500);
      } else {
        setEditStudentMessage('Update failed: ' + (data.message || 'Unknown error'));
        setTimeout(() => setEditStudentMessage(''), 2500);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      if (error.message.includes('Unexpected token')) {
        setEditStudentMessage('❌ Server error: API endpoint returned HTML instead of JSON. Check backend configuration.');
      } else {
        setEditStudentMessage('Network error occurred. Please try again.');
      }
      setTimeout(() => setEditStudentMessage(''), 2500);
    } finally {
      setEditStudentLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      });

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        alert('Server error: API endpoint not found. Please check if the backend is running.');
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setRefreshMessage('Student deleted successfully!');
        setTimeout(() => setRefreshMessage(''), 2500);
        handleStudentSearch(searchQuery);
      } else {
        setRefreshMessage('Delete failed: ' + (data.message || 'Unknown error'));
        setTimeout(() => setRefreshMessage(''), 2500);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      if (error.message.includes('Unexpected token')) {
        setRefreshMessage('Server error: API endpoint returned HTML instead of JSON. Check backend configuration.');
      } else {
        setRefreshMessage('Network error occurred. Please try again.');
      }
      setTimeout(() => setRefreshMessage(''), 2500);
    }
  };

  const handleConvertToCostSharing = (student) => {
    setConvertingStudent(student);
    setBankAccountNumber('');
    setConversionMessage('');
    setShowConversionModal(true);
  };

  const handleConfirmConversion = async () => {
    if (!bankAccountNumber || bankAccountNumber.length !== 13) {
      setConversionMessage('❌ Please enter a valid 13-digit National Bank of Ethiopia account number');
      setTimeout(() => setConversionMessage(''), 3000);
      return;
    }

    try {
      setConversionLoading(true);
      setConversionMessage('');

      const response = await fetch('/api/student-conversion/to-cost-sharing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: convertingStudent.id || convertingStudent.studentId,
          bankAccountNumber: bankAccountNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        setConversionMessage('✅ Student successfully converted to cost-sharing with bank account!');
        setTimeout(() => {
          setShowConversionModal(false);
          setConversionMessage('');
          setBankAccountNumber('');
          setRefreshMessage('Student converted to cost-sharing successfully!');
          handleStudentSearch(searchQuery); // Refresh search results
        }, 2000);
      } else {
        setConversionMessage('❌ ' + (data.message || 'Failed to convert student'));
        setTimeout(() => setConversionMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error converting student:', error);
      setConversionMessage('❌ Network error occurred. Please try again.');
      setTimeout(() => setConversionMessage(''), 3000);
    } finally {
      setConversionLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    window.location.href = '/dashboard?section=students';
  };

  return (
    <div className="email-verification-container">
      <div className="email-verification-card" style={{ maxWidth: '900px' }}>
        <div className="email-verification-header">
          <h1>🔍 Search Students</h1>
        </div>
        
        <div className="email-verification-content">
          {refreshMessage && (
            <div className="result-section success">
              <div className="result-message">
                <p>{refreshMessage}</p>
              </div>
            </div>
          )}

          {searchMessage && (
            <div className={`result-section ${searchMessage.includes('failed') || searchMessage.includes('error') ? 'error' : 'success'}`}>
              <div className="result-message">
                <p>{searchMessage}</p>
              </div>
            </div>
          )}

          <div className="form-section">
            <div className="form-group">
              <label>Search Students</label>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchInputChange}
                placeholder="Search by name, student ID, or department..."
              />
            </div>
          </div>

          {searchLoading && (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div style={{
              marginTop: '24px',
              padding: '24px',
              backgroundColor: '#f9fafb',
              borderRadius: '16px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '20px',
                textAlign: 'center'
              }}>Student Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {searchResults.map((student) => (
                  <div key={student._id} style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      marginBottom: '20px',
                      flexWrap: 'wrap'
                    }}>
                      {student.photoUrl && (
                        <img 
                          src={student.photoUrl} 
                          alt={student.name}
                          style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #e5e7eb',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '8px'
                        }}>{student.name}</h4>
                        <p style={{
                          fontSize: '16px',
                          color: '#6b7280',
                          marginBottom: '4px'
                        }}>ID: {student.id || student.studentId}</p>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        gap: '8px',
                        justifyContent: 'flex-end',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={() => handleConvertToCostSharing(student)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-money-bill" style={{ fontSize: '12px' }}></i>
                          Convert to Cost-Sharing
                        </button>
                        <button
                          onClick={() => handleEditStudent(student)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-edit" style={{ fontSize: '12px' }}></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student.id || student.studentId)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className="fas fa-trash" style={{ fontSize: '12px' }}></i>
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px'
                    }}>
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        borderLeft: '2px solid #3b82f6'
                      }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Name</div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{student.name}</div>
                      </div>
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        borderLeft: '2px solid #10b981'
                      }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Student ID</div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{student.id || student.studentId}</div>
                      </div>
                      <div style={{
                        padding: '16px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '8px',
                        borderLeft: '2px solid #f59e0b'
                      }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Department</div>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>{student.department}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '24px' }}>
            <button 
              type="button" 
              className="btn-cancel"
              onClick={handleBackToDashboard}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {showEditStudentModal && (
        <div className="email-verification-container" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div className="email-verification-card" style={{ maxWidth: '450px' }}>
            <div className="email-verification-header">
              <h1>Edit Student</h1>
            </div>
            
            <div className="email-verification-content">
              {editStudentMessage && (
                <div className={`result-section ${editStudentMessage.includes('failed') || editStudentMessage.includes('error') ? 'error' : 'success'}`}>
                  <div className="result-message">
                    <p>{editStudentMessage}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleUpdateStudent} className="form-section">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={editStudentData.name}
                    onChange={(e) => setEditStudentData({...editStudentData, name: e.target.value})}
                    placeholder="Enter student name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Student ID</label>
                  <input
                    type="text"
                    value={editStudentData.studentId}
                    onChange={(e) => setEditStudentData({...editStudentData, studentId: e.target.value})}
                    placeholder="Enter student ID"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={editStudentData.department}
                    onChange={(e) => setEditStudentData({...editStudentData, department: e.target.value})}
                    placeholder="Enter department"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Photo URL</label>
                  <input
                    type="url"
                    value={editStudentData.photoUrl}
                    onChange={(e) => setEditStudentData({...editStudentData, photoUrl: e.target.value})}
                    placeholder="Enter photo URL (optional)"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowEditStudentModal(false)}
                  >
                    Cancel
                  </button>
                  
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={editStudentLoading}
                  >
                    {editStudentLoading ? (
                      <>
                        <div className="spinner"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Student'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Cost-Sharing Modal */}
      {showConversionModal && (
        <div className="email-verification-container" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div className="email-verification-card" style={{ maxWidth: '450px' }}>
            <div className="email-verification-header">
              <h1>💰 Convert to Cost-Sharing</h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '8px 0 0 0' }}>
                This will remove the student from regular database and add to cost-sharing.
              </p>
            </div>
            
            <div className="email-verification-content">
              {conversionMessage && (
                <div className={`result-section ${conversionMessage.includes('❌') ? 'error' : 'success'}`}>
                  <div className="result-message">
                    <p>{conversionMessage}</p>
                  </div>
                </div>
              )}

              {convertingStudent && (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  border: '1px solid #e5e7eb'
                }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                    Student Information
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                    <strong>Name:</strong> {convertingStudent.name}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                    <strong>ID:</strong> {convertingStudent.id || convertingStudent.studentId}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
                    <strong>Department:</strong> {convertingStudent.department}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  🏦 National Bank of Ethiopia Account Number *
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  placeholder="Enter 13-digit NBE account number"
                  maxLength="13"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                    boxSizing: 'border-box'
                  }}
                  required
                />
                <p style={{ 
                  fontSize: '12px', 
                  color: '#6b7280', 
                  margin: '4px 0 0 0' 
                }}>
                  Required for direct bank transfers. Must be 13 digits.
                </p>
              </div>

              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowConversionModal(false)}
                  disabled={conversionLoading}
                >
                  Cancel
                </button>
                
                <button 
                  type="button"
                  onClick={handleConfirmConversion}
                  className="btn-primary"
                  disabled={conversionLoading}
                  style={{
                    backgroundColor: '#8b5cf6',
                    borderColor: '#8b5cf6'
                  }}
                >
                  {conversionLoading ? (
                    <>
                      <div className="spinner"></div>
                      Converting...
                    </>
                  ) : (
                    'Convert to Cost-Sharing'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchStudent;
