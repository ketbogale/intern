import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './CostSharingManagement.css';

const CostSharingManagement = () => {
  const [costSharingStudents, setCostSharingStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentData, setPaymentData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
    paymentMethod: 'cash',
    notes: ''
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('students'); // students, record, history, summary, bulk
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [bulkPaymentData, setBulkPaymentData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0,
    paymentMethod: 'cbe_bulk',
    notes: ''
  });
  const [bulkPaymentLoading, setBulkPaymentLoading] = useState(false);
  const [bulkPaymentResult, setBulkPaymentResult] = useState(null);
  const [bulkPaymentStep, setBulkPaymentStep] = useState('prepare'); // prepare, authorize, process, complete
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [bulkPaymentFile, setBulkPaymentFile] = useState(null);
  const [totalBulkAmount, setTotalBulkAmount] = useState(0);
  const [paymentSummary, setPaymentSummary] = useState(null);

  useEffect(() => {
    fetchCostSharingStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search query
    if (!costSharingStudents || !Array.isArray(costSharingStudents)) {
      setFilteredStudents([]);
      return;
    }
    
    if (searchQuery.trim() === '') {
      setFilteredStudents(costSharingStudents);
    } else {
      const filtered = costSharingStudents.filter(student => 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [costSharingStudents, searchQuery]);

  const fetchCostSharingStudents = async () => {
    try {
      const response = await fetch('/api/cost-sharing/students');
      const data = await response.json();
      if (data.success) {
        setCostSharingStudents(data.students || []);
        setFilteredStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error fetching cost-sharing students:', error);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const response = await fetch(`/api/cost-sharing/summary?month=${paymentData.month}&year=${paymentData.year}`);
      const data = await response.json();
      if (data.success) {
        setMonthlySummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
    }
  };

  const fetchPaymentHistory = async (studentId) => {
    try {
      const response = await fetch(`/api/cost-sharing/payments/${studentId}?year=${paymentData.year}`);
      const data = await response.json();
      if (data.success) {
        setPaymentHistory(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setPaymentData({
      ...paymentData,
      amount: student.monthlyAllowance || 0
    });
  };

  const handleConvertToCafeteria = async (student) => {
    if (!window.confirm(`Are you sure you want to convert ${student.name} back to the cafeteria program? This will remove their bank account information and they will no longer receive monthly allowances.`)) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student-conversion/to-regular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId: student.id })
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        alert(`${student.name} has been successfully converted back to the cafeteria program.`);
        
        // Refresh the cost-sharing students list
        fetchCostSharingStudents();
        
        // Clear selected student if it was the converted one
        if (selectedStudent?.id === student.id) {
          setSelectedStudent(null);
        }
      } else {
        alert(`Failed to convert student: ${data.message}`);
      }
    } catch (error) {
      console.error('Error converting student to cafeteria:', error);
      alert('An error occurred while converting the student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      setMessage('Please select a student first.');
      setSuccess(false);
      setTimeout(() => setMessage(''), 2500);
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      const response = await fetch('/api/cost-sharing/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          month: paymentData.month,
          year: paymentData.year,
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setMessage('Payment recorded successfully!');
        setPaymentData({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          amount: 0,
          paymentMethod: 'cash',
          notes: ''
        });
        setSelectedStudent(null);
      } else {
        setSuccess(false);
        setMessage(data.message || 'Failed to record payment');
      }
    } catch (error) {
      setSuccess(false);
      setMessage('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePrepareBulkPayment = async (e) => {
    e.preventDefault();
    
    if (!bulkPaymentData.amount || bulkPaymentData.amount <= 0) {
      setMessage('Please enter a valid payment amount.');
      setSuccess(false);
      setTimeout(() => setMessage(''), 2500);
      return;
    }

    try {
      setBulkPaymentLoading(true);
      setMessage('');

      // Generate CBE bulk payment file
      const response = await fetch('/api/cbe-bulk-payment/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkPaymentData)
      });

      const data = await response.json();

      if (data.success) {
        setBulkPaymentFile(data.paymentFile);
        setTotalBulkAmount(data.totalAmount);
        setPaymentSummary(data.summary);
        setBulkPaymentStep('authorize');
        setMessage('Payment file prepared successfully. Please authorize the transaction.');
        setSuccess(true);
      } else {
        setMessage(data.message || 'Failed to prepare bulk payment');
        setSuccess(false);
      }
    } catch (error) {
      setMessage('Network error occurred. Please try again.');
      setSuccess(false);
    } finally {
      setBulkPaymentLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAuthorizeBulkPayment = async (e) => {
    e.preventDefault();
    
    if (!authorizationCode || authorizationCode.length !== 6) {
      setMessage('Please enter a valid 6-digit authorization code.');
      setSuccess(false);
      setTimeout(() => setMessage(''), 2500);
      return;
    }

    try {
      setBulkPaymentLoading(true);
      setMessage('');

      const response = await fetch('/api/cbe-bulk-payment/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorizationCode,
          paymentFileId: bulkPaymentFile.id,
          totalAmount: totalBulkAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        setBulkPaymentStep('process');
        setMessage('Authorization successful. Processing bulk payment...');
        setSuccess(true);
        // Auto-proceed to processing
        setTimeout(() => handleProcessBulkPayment(), 1000);
      } else {
        setMessage(data.message || 'Authorization failed');
        setSuccess(false);
      }
    } catch (error) {
      setMessage('Network error occurred. Please try again.');
      setSuccess(false);
    } finally {
      setBulkPaymentLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleProcessBulkPayment = async () => {
    try {
      setBulkPaymentLoading(true);
      setMessage('Processing bulk payment through CBE...');

      const response = await fetch('/api/cbe-bulk-payment/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentFileId: bulkPaymentFile.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setBulkPaymentResult(data);
        setBulkPaymentStep('complete');
        setMessage(`Bulk payment completed! ${data.summary.successful} students paid successfully.`);
        setSuccess(true);
        // Reset form
        setBulkPaymentData({
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          amount: 0,
          paymentMethod: 'cbe_bulk',
          notes: ''
        });
      } else {
        setMessage(data.message || 'Bulk payment processing failed');
        setSuccess(false);
        setBulkPaymentStep('authorize'); // Allow retry
      }
    } catch (error) {
      setMessage('Network error occurred during processing.');
      setSuccess(false);
      setBulkPaymentStep('authorize'); // Allow retry
    } finally {
      setBulkPaymentLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleResetBulkPayment = () => {
    setBulkPaymentStep('prepare');
    setBulkPaymentFile(null);
    setTotalBulkAmount(0);
    setPaymentSummary(null);
    setAuthorizationCode('');
    setBulkPaymentResult(null);
    setMessage('');
  };

  const handleDownloadPaymentFile = () => {
    if (bulkPaymentFile && bulkPaymentFile.downloadUrl) {
      const link = document.createElement('a');
      link.href = bulkPaymentFile.downloadUrl;
      link.download = bulkPaymentFile.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleExportPayments = async (type, studentId = null) => {
    try {
      let url = '/api/excel-export/payment-records';
      const params = new URLSearchParams();
      
      if (type === 'monthly' && paymentData.month && paymentData.year) {
        params.append('month', paymentData.month);
        params.append('year', paymentData.year);
      }
      
      if (studentId) {
        params.append('studentId', studentId);
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : 'payment_records.xlsx';
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        setMessage('Excel file downloaded successfully!');
        setSuccess(true);
      } else {
        setMessage('Failed to export payment records');
        setSuccess(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      setMessage('Error occurred while exporting');
      setSuccess(false);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExportMonthlySummary = async () => {
    try {
      const url = `/api/excel-export/monthly-summary?year=${paymentData.year}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1].replace(/"/g, '')
          : 'monthly_summary.xlsx';
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
        
        setMessage('Monthly summary exported successfully!');
        setSuccess(true);
      } else {
        setMessage('Failed to export monthly summary');
        setSuccess(false);
      }
    } catch (error) {
      console.error('Export error:', error);
      setMessage('Error occurred while exporting');
      setSuccess(false);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBackToDashboard = () => {
    window.location.href = '/';
  };

  const getMonthName = (monthNum) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNum - 1];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <img src="/images/salale_university_logo.png" alt="Salale University" className="header-logo" />
          <h1>Cost-Sharing Management</h1>
        </div>
        <div className="header-right">
          <button 
            onClick={() => window.location.href = '/'}
            className="back-btn"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Left Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Cost-Sharing</h2>
            <p className="welcome-text">Manage allowances</p>
          </div>
          <nav className="sidebar-nav">
            <div 
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <i className="fas fa-users"></i>
              <span>Students</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="fas fa-history"></i>
              <span>Payment History</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'bulk' ? 'active' : ''}`}
              onClick={() => setActiveTab('bulk')}
            >
              <i className="fas fa-credit-card"></i>
              <span>Bulk Payment</span>
            </div>
            <div 
              className={`nav-item ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Monthly Summary</span>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <div className="header-left-content">
              <h1>
                {activeTab === 'students' && 'Students in Cost-Sharing'}
                {activeTab === 'history' && 'Payment History'}
                {activeTab === 'bulk' && 'Bulk Payment Processing'}
                {activeTab === 'summary' && 'Monthly Summary'}
              </h1>
            </div>
          </div>
          <div className="content-body">
            {message && (
              <div className={`alert ${success ? 'alert-success' : 'alert-error'}`}>
                {message}
              </div>
            )}

            {/* Students in Cost-Sharing Tab */}
            {activeTab === 'students' && (
              <div>
                <div className="stats-overview">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{costSharingStudents.length}</h3>
                      <p>Total Cost-Sharing Students</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-money-bill-wave"></i>
                    </div>
                    <div className="stat-info">
                      <h3>{formatCurrency(costSharingStudents.reduce((sum, s) => sum + (s.monthlyAllowance || 0), 0))}</h3>
                      <p>Total Monthly Allowances</p>
                    </div>
                  </div>
                </div>

                <div className="data-section">
                  <div className="section-header">
                    <h2>All Cost-Sharing Students</h2>
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder="Search by name, ID, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                      <i className="fas fa-search search-icon"></i>
                    </div>
                  </div>
                  
                  {searchQuery.trim() === '' ? (
                    <div className="search-prompt">
                      <div className="search-prompt-content">
                        <i className="fas fa-search" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }}></i>
                        <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Search for Students</h3>
                        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
                          Enter a student name, ID, or department in the search box above to view cost-sharing students.
                        </p>
                      </div>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div className="students-grid">
                      {filteredStudents.map((student) => (
                        <div key={student._id} className="student-card">
                          <div className="student-info">
                            <div className="student-avatar">
                              {student.photoUrl ? (
                                <img src={student.photoUrl} alt={student.name} />
                              ) : (
                                <i className="fas fa-user"></i>
                              )}
                            </div>
                            <div className="student-details">
                              <h3>{student.name}</h3>
                              <p className="student-id">ID: {student.id}</p>
                              <p className="student-department">{student.department}</p>
                              <div className="allowance-info">
                                <span className="allowance-amount">
                                  ETB {student.monthlyAllowance || 0}.00
                                </span>
                                <span className="allowance-label">MONTHLY ALLOWANCE</span>
                              </div>
                            </div>
                          </div>
                          <div className="student-actions">
                            <button
                              onClick={() => handleConvertToCafeteria(student)}
                              className="btn-convert-cafeteria"
                            >
                              <i className="fas fa-utensils"></i>
                              Convert to Cafeteria
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">
                      <i className="fas fa-search"></i>
                      <p>No students found matching "{searchQuery}"</p>
                      <p style={{ fontSize: '14px', color: '#9ca3af' }}>
                        Try searching with a different name, ID, or department.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Payment History Tab */}
            {activeTab === 'history' && (
              <div>
              {selectedStudent ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px' 
                  }}>
                    <h3 style={{ margin: 0, color: '#374151' }}>
                      Payment History - {selectedStudent.name}
                    </h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleExportPayments('student', selectedStudent.id)}
                        className="btn-export"
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <i className="fas fa-file-excel"></i>
                        Export Excel
                      </button>
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="btn-secondary"
                        style={{ padding: '8px 16px' }}
                      >
                        Back to List
                      </button>
                    </div>
                  </div>
                  <div style={{ 
                    maxHeight: '400px', 
                    overflowY: 'auto',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    {paymentHistory.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Month</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map(payment => (
                            <tr key={payment._id}>
                              <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                {getMonthName(payment.month)} {payment.year}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                {formatCurrency(payment.amount)}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                {new Date(payment.paymentDate).toLocaleDateString()}
                              </td>
                              <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: payment.status === 'paid' ? '#dcfce7' : '#fef3c7',
                                  color: payment.status === 'paid' ? '#166534' : '#92400e'
                                }}>
                                  {payment.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        No payment history found for this student.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  Please select a student to view payment history.
                </div>
              )}
            </div>
          )}

            {/* Bulk Payment Tab */}
            {activeTab === 'bulk' && (
              <div>
                <div className="bulk-payment-section">
                  <div className="bulk-info-card">
                    <h3>🏦 CBE Bulk Payment System</h3>
                    <p>Efficient mass payment processing through Commercial Bank of Ethiopia with secure authorization.</p>
                    <div className="bulk-stats">
                      <div className="bulk-stat">
                        <span className="stat-number">{costSharingStudents.length}</span>
                        <span className="stat-label">Students to Pay</span>
                      </div>
                      <div className="bulk-stat">
                        <span className="stat-number">{formatCurrency(bulkPaymentData.amount * costSharingStudents.length)}</span>
                        <span className="stat-label">Total Amount</span>
                      </div>
                      <div className="bulk-stat">
                        <span className="stat-number">{bulkPaymentStep.toUpperCase()}</span>
                        <span className="stat-label">Current Step</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Prepare Payment */}
                  {bulkPaymentStep === 'prepare' && (
                    <div className="bulk-payment-form">
                      <h3>📋 Step 1: Prepare Bulk Payment</h3>
                      <form onSubmit={handlePrepareBulkPayment}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Amount per Student (ETB)</label>
                          <input
                            type="number"
                            value={bulkPaymentData.amount}
                            onChange={(e) => setBulkPaymentData({...bulkPaymentData, amount: parseFloat(e.target.value)})}
                            placeholder="Enter amount..."
                            min="0"
                            step="0.01"
                            required
                            className="form-control"
                          />
                        </div>
                      </div>



                        <div className="bulk-payment-actions">
                          <button
                            type="submit"
                            disabled={bulkPaymentLoading || !bulkPaymentData.amount || costSharingStudents.length === 0}
                            className="btn-bulk-payment"
                          >
                            {bulkPaymentLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Preparing Payment File...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-file-alt"></i>
                                Prepare CBE Payment File ({costSharingStudents.length} students)
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Step 2: Authorization */}
                  {bulkPaymentStep === 'authorize' && (
                    <div className="bulk-payment-form">
                      <h3>🔐 Step 2: Authorize Payment</h3>
                      
                      {paymentSummary && (
                        <div className="payment-summary-card">
                          <h4>📊 Payment Summary</h4>
                          <div className="summary-grid">
                            <div className="summary-item">
                              <span className="summary-label">Total Students:</span>
                              <span className="summary-value">{paymentSummary.totalStudents}</span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Amount per Student:</span>
                              <span className="summary-value">{formatCurrency(bulkPaymentData.amount)}</span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Total Amount:</span>
                              <span className="summary-value">{formatCurrency(totalBulkAmount)}</span>
                            </div>
                            <div className="summary-item">
                              <span className="summary-label">Payment File:</span>
                              <span className="summary-value">
                                <button 
                                  onClick={handleDownloadPaymentFile}
                                  className="btn-download-file"
                                >
                                  <i className="fas fa-download"></i>
                                  Download CBE File
                                </button>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <form onSubmit={handleAuthorizeBulkPayment}>
                        <div className="form-group">
                          <label>Authorization Code</label>
                          <input
                            type="text"
                            value={authorizationCode}
                            onChange={(e) => setAuthorizationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit authorization code"
                            maxLength="6"
                            className="form-control auth-code-input"
                            required
                          />
                          <small className="form-help">Enter the 6-digit code sent to your registered mobile number</small>
                        </div>

                        <div className="bulk-payment-actions">
                          <button
                            type="button"
                            onClick={handleResetBulkPayment}
                            className="btn-secondary"
                            style={{ marginRight: '12px' }}
                          >
                            <i className="fas fa-arrow-left"></i>
                            Back to Prepare
                          </button>
                          <button
                            type="submit"
                            disabled={bulkPaymentLoading || authorizationCode.length !== 6}
                            className="btn-bulk-payment"
                          >
                            {bulkPaymentLoading ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Authorizing...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-shield-alt"></i>
                                Authorize & Process Payment
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Step 3: Processing */}
                  {bulkPaymentStep === 'process' && (
                    <div className="bulk-payment-form">
                      <h3>⚡ Step 3: Processing Payment</h3>
                      <div className="processing-status">
                        <div className="processing-animation">
                          <i className="fas fa-cog fa-spin"></i>
                        </div>
                        <h4>Processing bulk payment through CBE...</h4>
                        <p>Please wait while we process {costSharingStudents.length} payments.</p>
                        <div className="progress-bar">
                          <div className="progress-fill"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Complete */}
                  {bulkPaymentStep === 'complete' && bulkPaymentResult && (
                    <div className="bulk-payment-form">
                      <h3>✅ Step 4: Payment Complete</h3>
                      <div className="completion-status">
                        <div className="success-icon">
                          <i className="fas fa-check-circle"></i>
                        </div>
                        <h4>Bulk payment completed successfully!</h4>
                        <p>All payments have been processed through CBE.</p>
                        
                        <div className="bulk-payment-actions">
                          <button
                            onClick={handleResetBulkPayment}
                            className="btn-bulk-payment"
                          >
                            <i className="fas fa-plus"></i>
                            Start New Bulk Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {bulkPaymentResult && (
                    <div className="bulk-result-card">
                      <h3>📊 Payment Results</h3>
                      <div className="result-summary">
                        <div className="result-stat success">
                          <i className="fas fa-check-circle"></i>
                          <span>{bulkPaymentResult.summary.successful} Successful</span>
                        </div>
                        <div className="result-stat failed">
                          <i className="fas fa-times-circle"></i>
                          <span>{bulkPaymentResult.summary.failed} Failed</span>
                        </div>
                        <div className="result-stat duplicate">
                          <i className="fas fa-exclamation-triangle"></i>
                          <span>{bulkPaymentResult.summary.duplicates} Duplicates</span>
                        </div>
                        <div className="result-stat total">
                          <i className="fas fa-money-bill-wave"></i>
                          <span>{formatCurrency(bulkPaymentResult.summary.totalAmount)} Total</span>
                        </div>
                      </div>
                      
                      {bulkPaymentResult.details.failed.length > 0 && (
                        <div className="failed-payments">
                          <h4>❌ Failed Payments</h4>
                          <ul>
                            {bulkPaymentResult.details.failed.map((item, index) => (
                              <li key={index}>
                                {item.name} ({item.studentId}): {item.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {bulkPaymentResult.details.duplicates.length > 0 && (
                        <div className="duplicate-payments">
                          <h4>⚠️ Duplicate Payments</h4>
                          <ul>
                            {bulkPaymentResult.details.duplicates.map((item, index) => (
                              <li key={index}>
                                {item.name} ({item.studentId}): {item.reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Monthly Summary Tab */}
            {activeTab === 'summary' && (
              <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '15px' 
              }}>
                <h3 style={{ margin: 0, color: '#374151' }}>
                  Monthly Summary - {getMonthName(paymentData.month)} {paymentData.year}
                </h3>
                <button
                  onClick={handleExportMonthlySummary}
                  className="btn-export"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fas fa-file-excel"></i>
                  Export Summary
                </button>
              </div>
              
              {monthlySummary && (
                <div>
                  {/* Summary Cards */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '15px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '14px', color: '#1e40af', fontWeight: '500' }}>Total Students</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a' }}>
                        {monthlySummary.totalStudents}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>Paid Students</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#14532d' }}>
                        {monthlySummary.paidStudents}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '14px', color: '#92400e', fontWeight: '500' }}>Unpaid Students</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#78350f' }}>
                        {monthlySummary.unpaidStudents}
                      </div>
                    </div>
                    
                    <div style={{
                      padding: '20px',
                      backgroundColor: '#f3e8ff',
                      border: '1px solid #d8b4fe',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontSize: '14px', color: '#7c3aed', fontWeight: '500' }}>Total Amount</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#5b21b6' }}>
                        {formatCurrency(monthlySummary.totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* Payment List */}
                  <div style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead style={{ backgroundColor: '#f9fafb', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Student</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>ID</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Amount</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                          <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlySummary.payments.map(payment => (
                          <tr key={payment._id}>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {payment.studentId?.name || 'Unknown'}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {payment.studentId}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {formatCurrency(payment.amount)}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                              {new Date(payment.paymentDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <div className="form-actions" style={{ justifyContent: 'center', marginTop: '30px' }}>
            <button 
              type="button" 
              onClick={handleBackToDashboard}
              className="btn-cancel"
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostSharingManagement;
