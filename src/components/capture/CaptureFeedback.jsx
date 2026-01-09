/**
 * CBV System - Capture Feedback Component
 * Displays real-time feedback messages during capture
 */

import React from 'react';
import './CaptureFeedback.css';

const CaptureFeedback = ({ 
  type = 'info', 
  message, 
  issues = [], 
  isVisible = true,
  onDismiss 
}) => {
  if (!isVisible || !message) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  const getClassName = () => {
    return `capture-feedback capture-feedback-${type}`;
  };

  return (
    <div className={getClassName()}>
      <div className="feedback-content">
        <span className="feedback-icon">{getIcon()}</span>
        <div className="feedback-text">
          <p className="feedback-message">{message}</p>
          {issues.length > 0 && (
            <ul className="feedback-issues">
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {onDismiss && (
        <button 
          className="feedback-dismiss" 
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CaptureFeedback;
