/**
 * CBV System - Verification Status Component
 * Displays detailed verification status and metrics
 */

import React from 'react';
import './VerificationStatus.css';

const VerificationStatus = ({ isVerifying, scores, status }) => {
  const getScoreColor = (score) => {
    if (score >= 0.7) return '#10b981'; // green
    if (score >= 0.5) return '#f59e0b'; // yellow
    if (score >= 0.3) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const formatScore = (score) => {
    return (score * 100).toFixed(0);
  };

  return (
    <div className="verification-status">
      <div className="verification-status__header">
        <h3 className="verification-status__title">Verification Status</h3>
        <div className={`verification-status__indicator ${isVerifying ? 'verification-status__indicator--active' : ''}`}>
          <span className="verification-status__dot"></span>
          <span className="verification-status__text">
            {isVerifying ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {isVerifying && (
        <>
          {/* Biometric Scores */}
          <div className="verification-status__section">
            <h4 className="verification-status__section-title">Biometric Scores</h4>
            <div className="verification-status__scores">
              {/* Face Score */}
              <div className="verification-status__score-item">
                <div className="verification-status__score-header">
                  <span className="verification-status__score-label">Face Recognition</span>
                  <span 
                    className="verification-status__score-value"
                    style={{ color: getScoreColor(scores.face) }}
                  >
                    {formatScore(scores.face)}%
                  </span>
                </div>
                <div className="verification-status__score-bar">
                  <div 
                    className="verification-status__score-fill"
                    style={{ 
                      width: `${formatScore(scores.face)}%`,
                      backgroundColor: getScoreColor(scores.face)
                    }}
                  />
                </div>
              </div>

              {/* Liveness Score */}
              <div className="verification-status__score-item">
                <div className="verification-status__score-header">
                  <span className="verification-status__score-label">Liveness Detection</span>
                  <span 
                    className="verification-status__score-value"
                    style={{ color: getScoreColor(scores.liveness) }}
                  >
                    {formatScore(scores.liveness)}%
                  </span>
                </div>
                <div className="verification-status__score-bar">
                  <div 
                    className="verification-status__score-fill"
                    style={{ 
                      width: `${formatScore(scores.liveness)}%`,
                      backgroundColor: getScoreColor(scores.liveness)
                    }}
                  />
                </div>
              </div>

              {/* Behavior Score */}
              <div className="verification-status__score-item">
                <div className="verification-status__score-header">
                  <span className="verification-status__score-label">Behavior Biometrics</span>
                  <span 
                    className="verification-status__score-value"
                    style={{ color: getScoreColor(scores.behavior) }}
                  >
                    {formatScore(scores.behavior)}%
                  </span>
                </div>
                <div className="verification-status__score-bar">
                  <div 
                    className="verification-status__score-fill"
                    style={{ 
                      width: `${formatScore(scores.behavior)}%`,
                      backgroundColor: getScoreColor(scores.behavior)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="verification-status__section">
            <h4 className="verification-status__section-title">System Status</h4>
            <div className="verification-status__system">
              <div className="verification-status__system-item">
                <span className={`verification-status__system-icon ${status.cameraActive ? 'verification-status__system-icon--active' : ''}`}>
                  📷
                </span>
                <span className="verification-status__system-label">Camera</span>
                <span className={`verification-status__system-status ${status.cameraActive ? 'verification-status__system-status--active' : ''}`}>
                  {status.cameraActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="verification-status__system-item">
                <span className={`verification-status__system-icon ${status.faceDetected ? 'verification-status__system-icon--active' : ''}`}>
                  👤
                </span>
                <span className="verification-status__system-label">Face</span>
                <span className={`verification-status__system-status ${status.faceDetected ? 'verification-status__system-status--active' : ''}`}>
                  {status.faceDetected ? 'Detected' : 'Not Detected'}
                </span>
              </div>

              <div className="verification-status__system-item">
                <span className={`verification-status__system-icon ${status.modelsLoaded ? 'verification-status__system-icon--active' : ''}`}>
                  🧠
                </span>
                <span className="verification-status__system-label">Models</span>
                <span className={`verification-status__system-status ${status.modelsLoaded ? 'verification-status__system-status--active' : ''}`}>
                  {status.modelsLoaded ? 'Loaded' : 'Not Loaded'}
                </span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {status.lastError && (
            <div className="verification-status__error">
              <span className="verification-status__error-icon">⚠️</span>
              <span className="verification-status__error-text">{status.lastError}</span>
            </div>
          )}
        </>
      )}

      {!isVerifying && (
        <div className="verification-status__inactive">
          <p className="verification-status__inactive-text">
            Verification is not active. Navigate to the Protected App to start continuous verification.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationStatus;
