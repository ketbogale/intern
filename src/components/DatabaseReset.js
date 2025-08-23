// Database Reset Functionality
class DatabaseResetManager {
  constructor() {
    this.isLoading = false;
    this.selectedResetType = 'manual';
    this.resetSchedule = {
      afterLateNight: '05:45',
      afterBreakfast: '09:30', 
      afterLunch: '14:30',
      afterDinner: '20:30'
    };
  }

  // Initialize database reset functionality
  init() {
    console.log('DatabaseResetManager init() called');
    this.bindEvents();
    this.updateScheduleDisplay();
  }

  // Bind event listeners
  bindEvents() {
    // Reset option selection
    document.addEventListener('click', (e) => {
      if (e.target.closest('.reset-option-card')) {
        this.selectResetOption(e.target.closest('.reset-option-card'));
      }
    });

    // Manual reset button
    document.addEventListener('click', (e) => {
      if (e.target.closest('.manual-reset-btn')) {
        e.preventDefault();
        console.log('Manual reset button clicked');
        this.showResetConfirmation();
      }
    });

    // Test reset button
    document.addEventListener('click', (e) => {
      if (e.target.closest('.test-reset-btn')) {
        e.preventDefault();
        this.performTestReset();
      }
    });

    // Confirmation modal events
    document.addEventListener('click', (e) => {
      if (e.target.closest('.confirm-reset-btn')) {
        this.performManualReset();
      }
      if (e.target.closest('.cancel-reset-btn') || e.target.closest('.reset-confirmation-modal')) {
        if (e.target === e.target.closest('.reset-confirmation-modal') || e.target.closest('.cancel-reset-btn')) {
          this.hideResetConfirmation();
        }
      }
    });
  }

  // Select reset option
  selectResetOption(card) {
    // Remove previous selection
    document.querySelectorAll('.reset-option-card').forEach(c => c.classList.remove('selected'));
    
    // Add selection to clicked card
    card.classList.add('selected');
    
    // Update selected type
    this.selectedResetType = card.dataset.resetType;
  }

  // Show reset confirmation modal
  showResetConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'reset-confirmation-modal';
    modal.innerHTML = `
      <div class="reset-confirmation-content">
        <div class="reset-confirmation-header">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Confirm Database Reset</h3>
        </div>
        <div class="reset-confirmation-message">
          <p><strong>Warning:</strong> This action will permanently delete all current meal attendance records.</p>
          <p>Students will be able to use their meals again after the reset.</p>
          <p>This action cannot be undone. Are you sure you want to proceed?</p>
        </div>
        <div class="reset-confirmation-actions">
          <button class="reset-btn secondary cancel-reset-btn">
            <i class="fas fa-times"></i>
            Cancel
          </button>
          <button class="reset-btn danger confirm-reset-btn">
            <i class="fas fa-trash-alt"></i>
            Reset Database
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  // Hide reset confirmation modal
  hideResetConfirmation() {
    const modal = document.querySelector('.reset-confirmation-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Perform manual reset
  async performManualReset() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.hideResetConfirmation();
      this.showResetStatus('Resetting meal database...', 'info');
      
      const response = await fetch('/api/dashboard/reset-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        this.showResetStatus(
          `✅ ${data.message} Reset completed at ${data.resetTime}`, 
          'success'
        );
        
        // Refresh dashboard stats if available
        if (window.fetchDashboardData) {
          setTimeout(() => {
            window.fetchDashboardData();
          }, 1000);
        }
      } else {
        this.showResetStatus(`❌ Reset failed: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Reset error:', error);
      this.showResetStatus('❌ Network error. Please check if the backend server is running.', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // Perform test reset (soft reset for testing)
  async performTestReset() {
    if (this.isLoading) return;
    
    try {
      this.isLoading = true;
      this.showResetStatus('Running test reset...', 'info');
      
      // Simulate test reset - in real implementation, this would call a test endpoint
      setTimeout(() => {
        this.showResetStatus('✅ Test reset completed successfully. No actual data was modified.', 'success');
        this.isLoading = false;
      }, 2000);
      
    } catch (error) {
      console.error('Test reset error:', error);
      this.showResetStatus('❌ Test reset failed.', 'error');
      this.isLoading = false;
    }
  }

  // Show reset status message
  showResetStatus(message, type) {
    // Remove existing status
    const existingStatus = document.querySelector('.reset-status');
    if (existingStatus) {
      existingStatus.remove();
    }

    // Create new status
    const status = document.createElement('div');
    status.className = `reset-status ${type}`;
    status.textContent = message;

    // Insert after reset controls
    const resetControls = document.querySelector('.reset-controls');
    if (resetControls) {
      resetControls.parentNode.insertBefore(status, resetControls.nextSibling);
    }

    // Auto-remove success/error messages after 5 seconds
    if (type !== 'info') {
      setTimeout(() => {
        if (status.parentNode) {
          status.remove();
        }
      }, 5000);
    }
  }

  // Update schedule display
  updateScheduleDisplay() {
    const scheduleContainer = document.querySelector('.schedule-list');
    if (!scheduleContainer) return;

    const scheduleItems = [
      { time: this.resetSchedule.afterLateNight, meal: 'After Late Night Meal' },
      { time: this.resetSchedule.afterBreakfast, meal: 'After Breakfast' },
      { time: this.resetSchedule.afterLunch, meal: 'After Lunch' },
      { time: this.resetSchedule.afterDinner, meal: 'After Dinner' }
    ];

    scheduleContainer.innerHTML = scheduleItems.map(item => `
      <li>
        <span class="schedule-time">${item.time} EAT</span>
        <span class="schedule-meal">${item.meal}</span>
      </li>
    `).join('');
  }

  // Get next scheduled reset time
  getNextResetTime() {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Africa/Addis_Ababa'
    });

    const resetTimes = Object.values(this.resetSchedule).sort();
    
    for (const time of resetTimes) {
      if (time > currentTime) {
        return time;
      }
    }
    
    // If no reset time today, return first reset time tomorrow
    return resetTimes[0] + ' (tomorrow)';
  }

  // Update button states based on loading
  updateButtonStates() {
    const buttons = document.querySelectorAll('.reset-btn');
    buttons.forEach(btn => {
      btn.disabled = this.isLoading;
      if (this.isLoading) {
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-spinner fa-spin';
        }
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DatabaseReset.js DOM loaded');
  if (window.databaseResetManager) return; // Prevent multiple initializations
  
  window.databaseResetManager = new DatabaseResetManager();
  console.log('DatabaseResetManager created');
  
  // Initialize immediately if section exists
  const resetSection = document.querySelector('.database-reset-section');
  if (resetSection) {
    console.log('Database reset section found, initializing immediately');
    window.databaseResetManager.init();
  }
  
  // Initialize when the database reset section becomes active
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const resetSection = document.querySelector('.database-reset-section');
        if (resetSection && !resetSection.dataset.initialized) {
          console.log('Database reset section detected via observer, initializing');
          resetSection.dataset.initialized = 'true';
          window.databaseResetManager.init();
        }
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseResetManager;
}
