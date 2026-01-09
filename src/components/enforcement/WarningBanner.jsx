/**
 * CBV System - WarningBanner Component
 * State-specific warning banners with countdown timers
 */

import React, { useState, useEffect } from 'react';
import './WarningBanner.css';

const WarningBanner = ({ 
  currentState, 
  trustScore, 
  onReAuthenticate,
  onDismiss,
  reAuthTimeout = 30000 // 30 seconds default
}) => {
  const [timeRemaining, setTimeRemaining] = useState(reAuthTimeout / 1000);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when state changes
  useEffect(() => {
    setIsDismissed(false);
  }, [currentState]);

  // Countdown timer for REAUTH state
  useEffect(() => {
    if (currentState !== 'REAUTH') {
      setTimeRemaining(reAuthTimeout / 1000);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentState, reAuthTimeout]);

  // Don't show banner in NORMAL state or if dismissed
  if (currentState === 'NORMAL' || isDismissed) {
    return null;
  }

  /**
   * Get banner configuration based on state
   */
  const getBannerConfig = () => {
    switch (currentState) {
      case 'WATCH':
        return {
          icon: '⚠️',
          title: 'Low Trust Score',
          message: 'Your trust score is low. Please verify your identity to maintain full access.',
          color: 'warning',
          showReAuth: false,
          showDismiss: true,
        };
      
      case 'RESTRICT':
        return {
          icon: '🚫',
          title: 'Limited Access Mode',
          message: 'Some features are disabled due to low trust score. Re-authenticate to restore access.',
          color: 'danger',
          showReAuth: true,
          showDismiss: false,
        };
      
      case 'REAUTH':
        return {
          icon: '🔒',
          title: 'Re-Authentication Required',
          message: `Access will be blocked in ${timeRemaining} seconds. Please re-authenticate immediately.`,
          color: 'critical',
          showReAuth: true,
          showDismiss: false,
        };
      
      default:
        return null;
    }
  };

  const config = getBannerConfig();
  if (!config) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  const handleReAuth = () => {
    if (onReAuthenticate) onReAuthenticate();
  };

  return (
    <div className={`warning-banner warning-banner-${config.color}`}>
      <div className="warning-banner-content">
        <div className="warning-banner-icon">{config.icon}</div>
        
        <div className="warning-banner-text">
          <div className="warning-banner-title">{config.title}</div>
          <div className="warning-banner-message">{config.message}</div>
          
          {/* Trust score indicator */}
          <div className="warning-banner-score">
            Trust Score: <strong>{(trustScore * 100).toFixed(0)}%</strong>
          </div>
        </div>

        <div className="warning-banner-actions">
          {config.showReAuth && (
            <button 
              className="warning-banner-btn warning-banner-btn-primary"
              onClick={handleReAuth}
            >
              Re-Authenticate Now
            </button>
          )}
          
          {config.showDismiss && (
            <button 
              className="warning-banner-btn warning-banner-btn-secondary"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for REAUTH countdown */}
      {currentState === 'REAUTH' && (
        <div className="warning-banner-progress">
          <div 
            className="warning-banner-progress-bar"
            style={{ 
              width: `${(timeRemaining / (reAuthTimeout / 1000)) * 100}%` 
            }}
          />
        </div>
      )}
    </div>
  );
};

export default WarningBanner;
