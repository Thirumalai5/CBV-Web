/**
 * CBV System - Behavior Capture Component
 * UI for capturing behavioral biometrics (keystroke and mouse dynamics)
 */

import React, { useEffect, useRef } from 'react';
import useBehaviorCapture from '@/hooks/useBehaviorCapture';
import CaptureFeedback from './CaptureFeedback';
import Button from '@/components/common/Button';
import './BehaviorCapture.css';

const BehaviorCapture = ({ onComplete, onWindowsUpdate, existingWindows }) => {
  const {
    isCapturing,
    windows,
    currentKeystrokeCount,
    currentMouseEventCount,
    error,
    progress,
    elapsedTime,
    timeRemaining,
    startCapture,
    stopCapture,
    clearWindows,
    getWindowStats,
    validateCurrent,
    windowCount,
    targetDuration,
    isComplete,
    windowSize,
    maxDuration,
    typingPrompt,
  } = useBehaviorCapture(existingWindows);

  const captureAreaRef = useRef(null);
  const textAreaRef = useRef(null);

  // Notify parent of window updates
  useEffect(() => {
    if (onWindowsUpdate) {
      onWindowsUpdate(windows);
    }
  }, [windows, onWindowsUpdate]);

  // Notify parent when complete
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete(windows);
    }
  }, [isComplete, windows, onComplete]);

  const handleStart = () => {
    if (captureAreaRef.current) {
      startCapture(captureAreaRef.current);
      
      // Focus on textarea
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }
  };

  const stats = getWindowStats();
  const validation = validateCurrent();

  // Format time as MM:SS
  const formatTime = (seconds) => {
    // Handle undefined, null, or NaN values
    const validSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="behavior-capture">
      {/* DEBUG: Show raw values */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'black',
        color: 'lime',
        padding: '10px',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <div>isCapturing: {String(isCapturing)}</div>
        <div>elapsedTime: {elapsedTime}</div>
        <div>timeRemaining: {timeRemaining}</div>
        <div>progress: {progress.toFixed(1)}%</div>
      </div>

      {/* Timer Display */}
      {isCapturing && (
        <div className="capture-timer">
          <div className="timer-display">
            <div className="timer-label">Time Remaining:</div>
            <div className="timer-value">{formatTime(timeRemaining)}</div>
            <div className="timer-elapsed">Elapsed: {formatTime(elapsedTime)} / {formatTime(maxDuration)}</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="capture-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Type naturally in the text area below</li>
          <li>Move your mouse around the interaction area</li>
          <li>Click on different areas</li>
          <li>Continue for the full {formatTime(targetDuration)} duration</li>
          <li>Timer will automatically stop when complete</li>
        </ul>
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
          <span className="progress-label">Capture Progress</span>
          <span className="progress-count">
            {formatTime(elapsedTime)} / {formatTime(targetDuration)}
          </span>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="progress-percentage">
          {Math.round(progress)}% Complete
        </div>
      </div>

      {/* Capture Area */}
      <div 
        ref={captureAreaRef}
        className={`behavior-capture-area ${isCapturing ? 'capturing' : ''}`}
      >
        <div className="capture-area-header">
          <h4>Interaction Area</h4>
          {isCapturing && (
            <div className="recording-indicator">
              <span className="recording-dot"></span>
              Recording
            </div>
          )}
        </div>

        {/* Typing Area */}
        <div className="typing-section">
          <label htmlFor="typing-area">Type the following text:</label>
          <div className="typing-prompt">{typingPrompt}</div>
          <textarea
            ref={textAreaRef}
            id="typing-area"
            className="typing-area"
            placeholder="Start typing here..."
            disabled={!isCapturing}
            rows={6}
          />
        </div>

        {/* Mouse Interaction Canvas */}
        <div className="mouse-section">
          <label>Mouse Interaction Area:</label>
          <div className="mouse-canvas">
            <div className="canvas-instruction">
              Move your mouse and click around this area
            </div>
            <div className="click-targets">
              <button className="click-target" disabled={!isCapturing}>
                Click Me
              </button>
              <button className="click-target" disabled={!isCapturing}>
                Click Me
              </button>
              <button className="click-target" disabled={!isCapturing}>
                Click Me
              </button>
            </div>
          </div>
        </div>

        {/* Current Window Stats */}
        {isCapturing && (
          <div className="current-window-stats">
            <div className="stat-item">
              <span className="stat-label">Keystrokes:</span>
              <span className="stat-value">{currentKeystrokeCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Mouse Events:</span>
              <span className="stat-value">{currentMouseEventCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {windows.length > 0 && (
        <div className="behavior-statistics">
          <h4>Captured Statistics</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⌨️</div>
              <div className="stat-content">
                <div className="stat-label">Total Keystrokes</div>
                <div className="stat-value">{stats.totalKeystrokes}</div>
                <div className="stat-detail">
                  Avg: {stats.avgKeystrokesPerWindow.toFixed(1)} per window
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🖱️</div>
              <div className="stat-content">
                <div className="stat-label">Total Mouse Events</div>
                <div className="stat-value">{stats.totalMouseEvents}</div>
                <div className="stat-detail">
                  Avg: {stats.avgMouseEventsPerWindow.toFixed(1)} per window
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">Windows Captured</div>
                <div className="stat-value">{windowCount}</div>
                <div className="stat-detail">
                  {windowSize}s each
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Feedback */}
      {!validation.isValid && validation.issues.length > 0 && (
        <CaptureFeedback
          type="warning"
          message="Behavior validation issues:"
          issues={validation.issues}
        />
      )}

      {/* Controls */}
      <div className="capture-controls">
        {!isCapturing ? (
          <>
            <Button 
              variant="primary" 
              onClick={handleStart}
              disabled={elapsedTime >= maxDuration}
            >
              {elapsedTime >= maxDuration ? 'Capture Complete ✓' : 'Start Behavior Capture'}
            </Button>
            {windows.length > 0 && (
              <Button 
                variant="secondary" 
                onClick={clearWindows}
              >
                Clear Windows
              </Button>
            )}
          </>
        ) : (
          <Button 
            variant="secondary" 
            onClick={stopCapture}
          >
            Stop Capture
          </Button>
        )}
      </div>

      {/* Window List */}
      {windows.length > 0 && (
        <div className="window-list">
          <h4>Captured Windows</h4>
          <div className="window-items">
            {windows.map((window, index) => (
              <div key={index} className="window-item">
                <div className="window-number">#{index + 1}</div>
                <div className="window-details">
                  <div className="window-detail">
                    ⌨️ {window.features?.keystroke?.keyCount || 0} keys
                  </div>
                  <div className="window-detail">
                    🖱️ {window.features?.mouse?.clickCount || 0} clicks
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BehaviorCapture;
