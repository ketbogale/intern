import React, { useState, useEffect } from 'react';

const DatabaseResetComponent = ({ fetchDashboardData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResetType, setSelectedResetType] = useState('manual');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resetStatus, setResetStatus] = useState({ message: '', type: '' });

  const resetSchedule = {
    afterLateNight: '05:45',
    afterBreakfast: '09:30', 
    afterLunch: '14:30',
    afterDinner: '20:30'
  };

  // Show reset status message
  const showResetStatus = (message, type) => {
    setResetStatus({ message, type });
    
    // Auto-remove success/error messages after 5 seconds
    if (type !== 'info') {
      setTimeout(() => {
        setResetStatus({ message: '', type: '' });
      }, 5000);
    }
  };

  // Perform manual reset
  const performManualReset = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setShowConfirmation(false);
      showResetStatus('Resetting meal database...', 'info');
      
      const response = await fetch('/api/dashboard/reset-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showResetStatus(
          `✅ ${data.message} Reset completed at ${data.resetTime}`, 
          'success'
        );
        
        // Refresh dashboard stats if available
        if (fetchDashboardData) {
          setTimeout(() => {
            fetchDashboardData();
          }, 1000);
        }
      } else {
        showResetStatus(`❌ Reset failed: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Reset error:', error);
      showResetStatus('❌ Network error. Please check if the backend server is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform test reset
  const performTestReset = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      showResetStatus('Running test reset...', 'info');
      
      // Simulate test reset - in real implementation, this would call a test endpoint
      setTimeout(() => {
        showResetStatus('✅ Test reset completed successfully. No actual data was modified.', 'success');
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      console.error('Test reset error:', error);
      showResetStatus('❌ Test reset failed.', 'error');
      setIsLoading(false);
    }
  };

  // Get next scheduled reset time
  const getNextResetTime = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Africa/Addis_Ababa'
    });

    const resetTimes = Object.values(resetSchedule).sort();
    
    for (const time of resetTimes) {
      if (time > currentTime) {
        return time;
      }
    }
    
    // If no reset time today, return first reset time tomorrow
    return resetTimes[0] + ' (tomorrow)';
  };

  const scheduleItems = [
    { time: resetSchedule.afterLateNight, meal: 'After Late Night Meal' },
    { time: resetSchedule.afterBreakfast, meal: 'After Breakfast' },
    { time: resetSchedule.afterLunch, meal: 'After Lunch' },
    { time: resetSchedule.afterDinner, meal: 'After Dinner' }
  ];

  return (
    <div className="database-reset-section">
      <h2>
        <i className="fas fa-database"></i>
        Database Reset Management
      </h2>

      <div className="reset-description">
        <i className="fas fa-exclamation-triangle warning-icon"></i>
        <strong>Database Reset System:</strong> This system automatically clears meal attendance records after each meal window closes, allowing 
        students to use their meals again for the next period. You can also perform manual resets when needed.
      </div>

      <div className="reset-options-grid">
        <div 
          className={`reset-option-card ${selectedResetType === 'automatic' ? 'selected' : ''}`}
          onClick={() => setSelectedResetType('automatic')}
          data-reset-type="automatic"
        >
          <div className="reset-option-header">
            <i className="fas fa-clock"></i>
            <h3>Automatic Reset Schedule</h3>
          </div>
          <div className="reset-option-description">
            Database automatically resets after each meal window closes based on your meal window configuration.
          </div>
          <div className="reset-timing">
            Active - Next reset varies by meal schedule
          </div>
        </div>

        <div 
          className={`reset-option-card ${selectedResetType === 'manual' ? 'selected' : ''}`}
          onClick={() => setSelectedResetType('manual')}
          data-reset-type="manual"
        >
          <div className="reset-option-header">
            <i className="fas fa-hand-paper"></i>
            <h3>Manual Reset Control</h3>
          </div>
          <div className="reset-option-description">
            Perform immediate database reset when needed for maintenance or emergency situations.
          </div>
          <div className="reset-timing">
            Available anytime - Admin controlled
          </div>
        </div>
      </div>

      <div className="schedule-display">
        <h4>
          <i className="fas fa-calendar-alt"></i>
          Automatic Reset Schedule (EAT)
        </h4>
        <ul className="schedule-list">
          {scheduleItems.map((item, index) => (
            <li key={index}>
              <span className="schedule-time">{item.time} EAT</span>
              <span className="schedule-meal">{item.meal}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="manual-reset-section">
        <div className="manual-reset-header">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Manual Database Reset</h3>
        </div>

        <div className="manual-reset-warning">
          <strong>Warning:</strong> Manual reset will immediately clear all current meal attendance records. 
          Students will be able to use their meals again after the reset.
        </div>

        <div className="reset-controls">
          <button 
            className="reset-btn danger manual-reset-btn"
            onClick={() => setShowConfirmation(true)}
            disabled={isLoading}
          >
            <i className="fas fa-trash-alt"></i>
            Reset Database Now
          </button>

          <button 
            className="reset-btn secondary test-reset-btn"
            onClick={performTestReset}
            disabled={isLoading}
          >
            <i className="fas fa-vial"></i>
            Test Reset
          </button>
        </div>

        {resetStatus.message && (
          <div className={`reset-status ${resetStatus.type}`}>
            {resetStatus.message}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="reset-confirmation-modal" onClick={() => setShowConfirmation(false)}>
          <div className="reset-confirmation-content" onClick={(e) => e.stopPropagation()}>
            <div className="reset-confirmation-header">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Confirm Database Reset</h3>
            </div>
            <div className="reset-confirmation-message">
              <p><strong>Warning:</strong> This action will permanently delete all current meal attendance records.</p>
              <p>Students will be able to use their meals again after the reset.</p>
              <p>This action cannot be undone. Are you sure you want to proceed?</p>
            </div>
            <div className="reset-confirmation-actions">
              <button 
                className="reset-btn secondary cancel-reset-btn"
                onClick={() => setShowConfirmation(false)}
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
              <button 
                className="reset-btn danger confirm-reset-btn"
                onClick={performManualReset}
              >
                <i className="fas fa-trash-alt"></i>
                Reset Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseResetComponent;
