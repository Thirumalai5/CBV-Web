/**
 * CBV System - Liveness Capture Component
 * UI for capturing liveness detection data
 */

import React, { useEffect } from 'react';
import useLivenessCapture from '@/hooks/useLivenessCapture';
import CaptureFeedback from './CaptureFeedback';
import Button from '@/components/common/Button';
import { formatDuration } from '@/utils/capture-helpers';
import './LivenessCapture.css';

const LivenessCapture = ({ onComplete, onDataUpdate }) => {
  const {
    isInitialized,
    isCapturing,
    duration,
    blinkCount,
    currentEAR,
    livenessConfidence,
    error,
    progress,
    videoRef,
    initialize,
    startCapture,
    stopCapture,
    getTimeRemaining,
    validateCurrent,
    targetDuration,
    minBlinks,
    maxBlinks,
    isComplete,
    isBlinkCountValid,
  } = useLivenessCapture();

  // Initialize on mount (but don't start camera yet)
  useEffect(() => {
    const initializeLiveness = async () => {
      try {
        await initialize();
      } catch (err) {
        console.error('Failed to initialize liveness capture:', err);
      }
    };

    initializeLiveness();
  }, []); // Empty deps - only run once on mount

  // Notify parent of data updates (with ref to avoid infinite loops)
  const onDataUpdateRef = React.useRef(onDataUpdate);
  const onCompleteRef = React.useRef(onComplete);
  
  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate;
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (onDataUpdateRef.current) {
      onDataUpdateRef.current({
        duration,
        blinkCount,
        livenessConfidence,
      });
    }
  }, [duration, blinkCount, livenessConfidence]);

  // Notify parent when complete
  useEffect(() => {
    if (isComplete && onCompleteRef.current) {
      onCompleteRef.current({
        duration,
        blinkCount,
        livenessConfidence,
      });
    }
  }, [isComplete, duration, blinkCount, livenessConfidence]);

  const timeRemaining = getTimeRemaining();
  const validation = validateCurrent();

  const getEARStatus = () => {
    if (currentEAR < 0.2) return 'Blinking';
    if (currentEAR > 0.3) return 'Eyes Open';
    return 'Closing';
  };

  const getBlinkStatus = () => {
    if (blinkCount < minBlinks) {
      return { type: 'warning', message: `Need ${minBlinks - blinkCount} more blinks` };
    }
    if (blinkCount > maxBlinks) {
      return { type: 'warning', message: 'Too many blinks detected' };
    }
    return { type: 'success', message: 'Blink count is good' };
  };

  const blinkStatus = getBlinkStatus();

  return (
    <div className="liveness-capture">
      {/* Video Preview */}
      <div className="capture-video-container">
        <video
          ref={videoRef}
          className="capture-video"
          autoPlay
          playsInline
          muted
        />

        {/* Status Overlay */}
        <div className="capture-status-overlay">
          <div className="status-badge">
            {isCapturing ? '🎥 Recording...' : '⏸ Paused'}
          </div>
        </div>

        {/* Timer Overlay */}
        {isCapturing && (
          <div className="timer-overlay">
            <div className="timer-display">
              {formatDuration(duration || 0)}
            </div>
            <div className="timer-remaining">
              {formatDuration(timeRemaining?.remaining || 0)} remaining
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <CaptureFeedback
          type="error"
          message={error}
        />
      )}

      {/* Progress Section */}
      <div className="capture-progress-section">
        <div className="progress-header">
          <span className="progress-label">Liveness Detection</span>
          <span className="progress-count">
            {Math.round(duration || 0)}s / {targetDuration}s
          </span>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress || 0}%` }}
          />
        </div>

        <div className="progress-percentage">
          {Math.round(progress || 0)}% Complete
        </div>
      </div>

      {/* Liveness Metrics */}
      <div className="liveness-metrics">
        <div className="metric-card">
          <div className="metric-icon">👁️</div>
          <div className="metric-content">
            <div className="metric-label">Eye Aspect Ratio</div>
            <div className="metric-value">{(currentEAR || 0).toFixed(3)}</div>
            <div className="metric-status">{getEARStatus()}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👀</div>
          <div className="metric-content">
            <div className="metric-label">Blink Count</div>
            <div className="metric-value">{blinkCount || 0}</div>
            <div className={`metric-status status-${blinkStatus.type}`}>
              {blinkStatus.message}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">✓</div>
          <div className="metric-content">
            <div className="metric-label">Liveness Confidence</div>
            <div className="metric-value">
              {((livenessConfidence || 0) * 100).toFixed(1)}%
            </div>
            <div className="metric-status">
              {livenessConfidence > 0.7 ? 'High' : livenessConfidence > 0.5 ? 'Medium' : 'Low'}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="capture-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Look directly at the camera</li>
          <li>Keep your face in the frame</li>
          <li>Blink naturally (aim for {minBlinks}-{maxBlinks} blinks)</li>
          <li>Make small natural head movements</li>
          <li>Continue for {targetDuration} seconds</li>
        </ul>
      </div>

      {/* Validation Feedback */}
      {!validation.isValid && validation.issues.length > 0 && (
        <CaptureFeedback
          type="warning"
          message="Liveness validation issues:"
          issues={validation.issues}
        />
      )}

      {/* Controls */}
      <div className="capture-controls">
        {!isInitialized ? (
          <Button variant="primary" disabled loading>
            Initializing...
          </Button>
        ) : !isCapturing ? (
          <Button 
            variant="primary" 
            onClick={async () => {
              try {
                await startCapture();
              } catch (err) {
                console.error('Failed to start liveness capture:', err);
              }
            }}
            disabled={isComplete}
          >
            {isComplete ? 'Capture Complete ✓' : 'Start Liveness Check'}
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            onClick={stopCapture}
          >
            Stop Early
          </Button>
        )}
      </div>

      {/* EAR Visualization */}
      {isCapturing && (
        <div className="ear-visualization">
          <div className="ear-chart">
            <div className="ear-label">EAR History</div>
            <div className="ear-bar-container">
              <div 
                className="ear-bar"
                style={{ 
                  width: `${((currentEAR || 0) / 0.4) * 100}%`,
                  backgroundColor: currentEAR < 0.2 ? 'var(--color-warning)' : 'var(--color-success)'
                }}
              />
            </div>
            <div className="ear-threshold-line" style={{ left: '50%' }}>
              <span className="threshold-label">Blink Threshold</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivenessCapture;
