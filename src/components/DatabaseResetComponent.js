import React, { useState, useEffect } from 'react';

const DatabaseResetComponent = ({ fetchDashboardData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResetType, setSelectedResetType] = useState('manual');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resetStatus, setResetStatus] = useState({ message: '', type: '' });

  const [dynamicResetSchedule, setDynamicResetSchedule] = useState([]);
  const [automaticResetEnabled, setAutomaticResetEnabled] = useState(true);

  // Fetch meal windows and calculate reset schedule
  useEffect(() => {
    const fetchMealWindows = async () => {
      try {
        const response = await fetch('/api/meal-windows', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.mealWindows) {
          calculateResetSchedule(data.mealWindows);
        }
      } catch (error) {
        // Fallback to calculated schedule based on default meal times if API fails
        const fallbackWindows = {
          breakfast: { startTime: '06:00', enabled: true },
          lunch: { startTime: '12:00', enabled: true },
          dinner: { startTime: '17:00', enabled: true },
          lateNight: { startTime: '22:00', enabled: false }
        };
        calculateResetSchedule(fallbackWindows);
      }
    };
    
    fetchMealWindows();
  }, []);

  // Calculate reset times (30 minutes before each meal start)
  const calculateResetSchedule = (mealWindowsObj) => {
    const schedule = Object.entries(mealWindowsObj)
      .filter(([mealType, window]) => window.enabled)
      .map(([mealType, window]) => {
        // Validate startTime format
        if (!window.startTime || !window.startTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
          return null;
        }

        const [hours, minutes] = window.startTime.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        
        // Subtract 30 minutes for reset time
        const resetDate = new Date(startDate.getTime() - (30 * 60000));
        
        // Handle day rollover (if reset time goes to previous day)
        let resetTime;
        if (resetDate.getDate() !== startDate.getDate()) {
          // Reset time is on previous day, show as 23:XX
          resetTime = `${resetDate.getHours().toString().padStart(2, '0')}:${resetDate.getMinutes().toString().padStart(2, '0')}`;
        } else {
          resetTime = `${resetDate.getHours().toString().padStart(2, '0')}:${resetDate.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // Format meal type display name
        let displayName = mealType;
        if (mealType === 'lateNight') {
          displayName = 'Late Night';
        } else {
          displayName = mealType.charAt(0).toUpperCase() + mealType.slice(1);
        }
        
        return {
          time: resetTime,
          meal: displayName,
          resetType: 'Before',
          startTime: window.startTime,
          mealType: mealType
        };
      })
      .filter(item => item !== null) // Remove invalid entries
      .sort((a, b) => a.time.localeCompare(b.time));
    
    setDynamicResetSchedule(schedule);
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
      showResetStatus('❌ Network error. Please check if the backend server is running.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  // Toggle automatic reset schedule
  const toggleAutomaticReset = async () => {
    try {
      setIsLoading(true);
      const newStatus = !automaticResetEnabled;
      
      // Here you would call an API to enable/disable the scheduler
      // For now, we'll just update the local state
      setAutomaticResetEnabled(newStatus);
      
      showResetStatus(
        `✅ Automatic reset schedule ${newStatus ? 'enabled' : 'disabled'}`,
        'success'
      );
      
    } catch (error) {
      showResetStatus('❌ Failed to toggle automatic reset schedule', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="database-reset-section">
      <h2>
        <i className="fas fa-database"></i>
        Database Reset Management
      </h2>

      <div className="reset-description">
        <i className="fas fa-clock warning-icon"></i>
        <strong>MealCurrent Database Reset Schedule:</strong> Student meal records are automatically cleared at the times shown below, 
        allowing students to scan meals again for the next meal period.
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
            MealCurrent database automatically clears student records 30 minutes before each meal starts, based on meal window times from database.
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
        <div className="schedule-header">
          <h4>
            <i className="fas fa-calendar-alt"></i>
            Automatic Reset Schedule (EAT)
          </h4>
          <div className="schedule-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={automaticResetEnabled}
                onChange={toggleAutomaticReset}
                disabled={isLoading}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">
              {automaticResetEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        <div className="schedule-grid">
          {dynamicResetSchedule.map((item, index) => (
            <div key={index} className={`schedule-card ${!automaticResetEnabled ? 'disabled' : ''}`}>
              <div className="schedule-time">{item.time}</div>
              <div className="schedule-meal">{item.meal}</div>
              <div className="schedule-info">
                <div className="meal-start">Meal: {item.startTime}</div>
                <div className="schedule-badge">Database Reset</div>
              </div>
            </div>
          ))}
        </div>
        {!automaticResetEnabled && (
          <div className="schedule-disabled-notice">
            <i className="fas fa-info-circle"></i>
            Automatic reset schedule is currently disabled. Enable it to automatically clear meal records.
          </div>
        )}
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
