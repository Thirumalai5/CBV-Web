/**
 * CBV System - Debug Panel Component
 * Displays real-time metrics and system status
 */

import React, { useState, useEffect } from 'react';
import CONFIG, { getStateColor } from '@/utils/config';
import logger from '@/utils/logger';
import './DebugPanel.css';

const DebugPanel = ({ 
  fps = 0, 
  inferenceTime = 0, 
  trustScore = 0, 
  currentState = 'NORMAL',
  isVisible = true,
  blurAmount = 0,
  isReAuthModalOpen = false,
  isMonitoring = false
}) => {
  const [visible, setVisible] = useState(isVisible);
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to logger
    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, entry];
        // Keep only last 50 logs
        return newLogs.slice(-50);
      });
    });

    return unsubscribe;
  }, []);

  if (!visible) {
    return (
      <button 
        className="debug-panel-toggle"
        onClick={() => setVisible(true)}
        title="Show Debug Panel"
      >
        🐛
      </button>
    );
  }

  const stateColor = getStateColor(currentState);
  const trustPercentage = Math.round(trustScore * 100);

  return (
    <div className={`debug-panel ${expanded ? 'expanded' : ''}`}>
      <div className="debug-panel-header">
        <h3>🐛 Debug Panel</h3>
        <div className="debug-panel-controls">
          <button 
            onClick={() => setExpanded(!expanded)}
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? '▼' : '▲'}
          </button>
          <button 
            onClick={() => setVisible(false)}
            title="Hide"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="debug-panel-content">
        {/* Metrics Grid */}
        <div className="debug-metrics">
          <div className="debug-metric">
            <div className="debug-metric-label">FPS</div>
            <div className="debug-metric-value">{fps.toFixed(1)}</div>
          </div>

          <div className="debug-metric">
            <div className="debug-metric-label">Inference</div>
            <div className="debug-metric-value">{inferenceTime.toFixed(0)}ms</div>
          </div>

          <div className="debug-metric">
            <div className="debug-metric-label">Trust Score</div>
            <div className="debug-metric-value">{trustPercentage}%</div>
          </div>

          <div className="debug-metric">
            <div className="debug-metric-label">State</div>
            <div 
              className="debug-metric-value debug-state"
              style={{ color: stateColor }}
            >
              {currentState}
            </div>
          </div>
        </div>

        {/* Trust Score Gauge */}
        <div className="debug-gauge">
          <div className="debug-gauge-label">Trust Score</div>
          <div className="debug-gauge-bar">
            <div 
              className="debug-gauge-fill"
              style={{ 
                width: `${trustPercentage}%`,
                backgroundColor: stateColor 
              }}
            />
          </div>
          <div className="debug-gauge-markers">
            <span style={{ left: '30%' }}>REAUTH</span>
            <span style={{ left: '50%' }}>RESTRICT</span>
            <span style={{ left: '70%' }}>WATCH</span>
            <span style={{ left: '90%' }}>NORMAL</span>
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <>
            {/* System Info */}
            <div className="debug-section">
              <h4>System Info</h4>
              <div className="debug-info">
                <div className="debug-info-row">
                  <span>Version:</span>
                  <span>{CONFIG.VERSION}</span>
                </div>
                <div className="debug-info-row">
                  <span>Schema:</span>
                  <span>{CONFIG.SCHEMA_VERSION}</span>
                </div>
                <div className="debug-info-row">
                  <span>Verification Rate:</span>
                  <span>{CONFIG.SAMPLING_RATES.VERIFICATION_LOOP} Hz</span>
                </div>
              </div>
            </div>

            {/* Thresholds */}
            <div className="debug-section">
              <h4>Thresholds</h4>
              <div className="debug-info">
                <div className="debug-info-row">
                  <span>NORMAL:</span>
                  <span>{'>'} {CONFIG.TRUST.THRESHOLDS.NORMAL}</span>
                </div>
                <div className="debug-info-row">
                  <span>WATCH:</span>
                  <span>{'>'} {CONFIG.TRUST.THRESHOLDS.WATCH}</span>
                </div>
                <div className="debug-info-row">
                  <span>RESTRICT:</span>
                  <span>{'>'} {CONFIG.TRUST.THRESHOLDS.RESTRICT}</span>
                </div>
                <div className="debug-info-row">
                  <span>REAUTH:</span>
                  <span>≤ {CONFIG.TRUST.THRESHOLDS.RESTRICT}</span>
                </div>
              </div>
            </div>

            {/* Phase 7: Enforcement Status */}
            <div className="debug-section">
              <h4>Enforcement (Phase 7)</h4>
              <div className="debug-info">
                <div className="debug-info-row">
                  <span>Blur Amount:</span>
                  <span>{blurAmount}px</span>
                </div>
                <div className="debug-info-row">
                  <span>Re-Auth Modal:</span>
                  <span style={{ color: isReAuthModalOpen ? '#ef4444' : '#10b981' }}>
                    {isReAuthModalOpen ? 'OPEN' : 'CLOSED'}
                  </span>
                </div>
                <div className="debug-info-row">
                  <span>Recovery Monitor:</span>
                  <span style={{ color: isMonitoring ? '#f59e0b' : '#6b7280' }}>
                    {isMonitoring ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="debug-info-row">
                  <span>Warning Banner:</span>
                  <span style={{ color: currentState !== 'NORMAL' ? '#f59e0b' : '#6b7280' }}>
                    {currentState !== 'NORMAL' ? 'VISIBLE' : 'HIDDEN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Console Logs */}
            <div className="debug-section">
              <div className="debug-section-header">
                <h4>Console Logs</h4>
                <button 
                  className="debug-clear-btn"
                  onClick={() => {
                    setLogs([]);
                    logger.clear();
                  }}
                >
                  Clear
                </button>
              </div>
              <div className="debug-logs">
                {logs.length === 0 ? (
                  <div className="debug-log-empty">No logs yet</div>
                ) : (
                  logs.map((log, index) => (
                    <div 
                      key={index} 
                      className={`debug-log-entry debug-log-${log.level.toLowerCase()}`}
                    >
                      <span className="debug-log-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="debug-log-level">[{log.level}]</span>
                      <span className="debug-log-message">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
