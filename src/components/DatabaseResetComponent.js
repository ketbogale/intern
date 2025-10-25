import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

const DatabaseResetComponent = ({ fetchDashboardData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resetStatus, setResetStatus] = useState({ message: '', type: '' });
  const [autoResetTimes, setAutoResetTimes] = useState([]);
  const [mealSummaries, setMealSummaries] = useState([]);
  const [nextAutoReset, setNextAutoReset] = useState(null);

  // Load meal windows once and compute concise auto-reset times
  useEffect(() => {
    const fetchMealWindows = async () => {
      try {
        const res = await fetch('/api/meal-windows', { credentials: 'include' });
        const data = await res.json();
        if (data?.success && data?.mealWindows) {
          // Build enhanced per-meal summary
          const entries = Object.entries(data.mealWindows)
            .map(([mealType, w]) => ({
              mealType,
              enabled: !!w?.enabled,
              startTime: w?.startTime || '--:--',
              endTime: w?.endTime || '--:--',
              autoResetTime: (() => {
                if (!w?.startTime) return '--:--';
                const [h, m] = w.startTime.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                d.setTime(d.getTime() - 30 * 60000);
                const hh = d.getHours().toString().padStart(2, '0');
                const mm = d.getMinutes().toString().padStart(2, '0');
                return `${hh}:${mm}`;
              })()
            }))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          setMealSummaries(entries);

          // Concise list of auto-reset times
          const times = entries
            .filter(e => e.enabled && e.autoResetTime !== '--:--')
            .map(e => e.autoResetTime)
            .sort((a, b) => a.localeCompare(b));
          setAutoResetTimes(times);

          // Compute next upcoming auto reset (today or tomorrow)
          const now = new Date();
          const nowMinutes = now.getHours() * 60 + now.getMinutes();
          const minutesFromHHMM = (t) => {
            const [hh, mm] = t.split(':').map(Number);
            return hh * 60 + mm;
          };
          const upcoming = times
            .map(t => ({ t, m: minutesFromHHMM(t) }))
            .filter(x => x.m > nowMinutes)
            .sort((a, b) => a.m - b.m)[0] || null;
          let target = null;
          if (upcoming) {
            target = new Date();
            target.setHours(Math.floor(upcoming.m / 60), upcoming.m % 60, 0, 0);
          } else if (times.length) {
            // First time tomorrow
            const first = minutesFromHHMM(times[0]);
            target = new Date();
            target.setDate(target.getDate() + 1);
            target.setHours(Math.floor(first / 60), first % 60, 0, 0);
          }
          setNextAutoReset(target);
        }
      } catch (_) {
        // Silent fail; leave times empty
      }
    };
    fetchMealWindows();
  }, []);

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
      showResetStatus('Resetting current meal attendance...', 'info');
      
      const response = await fetch('/api/dashboard/reset-meals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showResetStatus('✅ Database reset completed.', 'success');
        
        // Refresh dashboard stats if available
        if (fetchDashboardData) {
          setTimeout(() => {
            fetchDashboardData({ showToast: true, useSpinner: false });
          }, 1000);
        }
      } else {
        showResetStatus('❌ Reset failed. Please try again.', 'error');
      }
    } catch (error) {
      showResetStatus('❌ Network error. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="database-reset-section">
      <h2>
        <i className="fas fa-database"></i>
        Database Reset
      </h2>

      <p className="reset-brief">
        Automatic reset runs <strong>30 minutes before</strong> each meal's start time (Timezone: <strong>EAT</strong>).{autoResetTimes.length ? ` Next times today: ${autoResetTimes.join(', ')}` : ''}
      </p>

      {nextAutoReset && (
        <div className="next-reset-callout">
          <i className="fas fa-clock"></i>
          <span>
            Next automatic reset at <strong>{nextAutoReset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            {(() => {
              const diff = nextAutoReset.getTime() - Date.now();
              if (diff <= 0) return null;
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              return <em className="in-text"> (in {h}h {m}m)</em>;
            })()}
          </span>
        </div>
      )}

      {/* Per-meal summary */}
      {!!mealSummaries.length && (
        <div className="meal-reset-summary">
          {mealSummaries.map(ms => (
            <div className="meal-row" key={ms.mealType}>
              <div className="meal-name">
                <span className={`status-dot ${ms.enabled ? 'on' : 'off'}`}></span>
                {ms.mealType.charAt(0).toUpperCase() + ms.mealType.slice(1)}
                {!ms.enabled && <span className="badge muted">Disabled</span>}
              </div>
              <div className="meal-times">
                <span className="label">Window:</span>
                <span className="value">{ms.startTime} - {ms.endTime}</span>
                <span className="label sep">Auto reset:</span>
                <span className="value strong">{ms.autoResetTime}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="reset-controls">
        <button 
          className="reset-btn danger manual-reset-btn"
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading}
        >
          <i className="fas fa-trash-alt"></i>
          {isLoading ? 'Resetting...' : 'Reset Now'}
        </button>
      </div>

      {resetStatus.message && (
        <div className={`reset-status ${resetStatus.type}`}>
          {resetStatus.message}
        </div>
      )}

      {/* Confirmation Modal (Bootstrap style to match Contact Admin) */}
      <Modal 
        show={showConfirmation}
        onHide={() => setShowConfirmation(false)}
        centered
      >
        <div style={{background: 'rgba(52, 73, 94, 0.95)', backdropFilter: 'blur(15px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px'}}>
          <Modal.Header closeButton style={{borderBottom: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent'}}>
            <Modal.Title style={{color: 'white'}}>Confirm Reset</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{background: 'transparent'}}>
            <div className="text-center" style={{color: 'rgba(255,255,255,0.9)'}}>
              Clear current meal attendance records now?
            </div>
            <div className="reset-confirmation-actions" style={{display:'flex', gap: '8px', justifyContent:'center', marginTop: '12px'}}>
              <button 
                className="reset-btn secondary cancel-reset-btn"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              <button 
                className="reset-btn danger confirm-reset-btn"
                onClick={performManualReset}
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </Modal.Body>
        </div>
      </Modal>
    </div>
  );
};

export default DatabaseResetComponent;
