/**
 * CBV System - Face Capture Component
 * UI for capturing face samples with quality validation
 */

import React, { useEffect } from 'react';
import useFaceCapture from '@/hooks/useFaceCapture';
import CaptureFeedback from './CaptureFeedback';
import Button from '@/components/common/Button';
import { formatDuration, calculateProgress } from '@/utils/capture-helpers';
import './FaceCapture.css';

const FaceCapture = ({ onComplete, onSamplesUpdate }) => {
  const {
    isInitialized,
    isCapturing,
    samples,
    currentDetection,
    qualityFeedback,
    error,
    progress,
    videoRef,
    initialize,
    startCapture,
    stopCapture,
    captureSample,
    sampleCount,
    targetCount,
    isComplete,
    canCapture,
  } = useFaceCapture();

  // Don't auto-initialize camera - wait for user to click "Start Capture"
  // Camera permission will be requested when user clicks the button

  // Notify parent of sample updates
  useEffect(() => {
    if (onSamplesUpdate) {
      onSamplesUpdate(samples);
    }
  }, [samples, onSamplesUpdate]);

  // Notify parent when complete
  useEffect(() => {
    if (isComplete && onComplete) {
      onComplete(samples);
    }
  }, [isComplete, samples, onComplete]);

  const handleStartCapture = async () => {
    try {
      // Initialize camera and face detection first
      if (!isInitialized) {
        await initialize();
      }
      // Then start capturing
      await startCapture();
    } catch (err) {
      console.error('Failed to start capture:', err);
    }
  };

  const handleManualCapture = async () => {
    if (!canCapture) return;
    
    try {
      await captureSample();
    } catch (err) {
      console.error('Manual capture failed:', err);
    }
  };

  return (
    <div className="face-capture">
      {/* Video Preview */}
      <div className="capture-video-container">
        <video
          ref={videoRef}
          className="capture-video"
          autoPlay
          playsInline
          muted
        />
        
        {/* Face Detection Overlay */}
        {currentDetection && (
          <div 
            className="face-overlay"
            style={{
              left: `${currentDetection.box.x}px`,
              top: `${currentDetection.box.y}px`,
              width: `${currentDetection.box.width}px`,
              height: `${currentDetection.box.height}px`,
            }}
          >
            <div className={`face-box ${qualityFeedback?.isValid ? 'valid' : 'invalid'}`} />
          </div>
        )}

      {/* Status Overlay */}
        <div className="capture-status-overlay">
          <div className="status-badge">
            {isCapturing ? '🎥 Capturing...' : '⏸ Paused'}
          </div>
          {/* Debug info */}
          <div style={{
            position: 'absolute',
            top: '50px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            zIndex: 1000,
            maxWidth: '300px'
          }}>
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Capturing: {isCapturing ? '✅' : '❌'}</div>
            <div>Face Detected: {currentDetection ? '✅' : '❌'}</div>
            <div>Quality Valid: {qualityFeedback?.isValid ? '✅' : '❌'}</div>
            <div>Video Ready: {videoRef.current?.readyState === 4 ? '✅' : '❌'}</div>
            <div>Video Size: {videoRef.current?.videoWidth}x{videoRef.current?.videoHeight}</div>
            {qualityFeedback && (
              <div>Message: {qualityFeedback.message}</div>
            )}
            <div style={{marginTop: '10px', fontSize: '10px', color: '#aaa'}}>
              💡 Tips: Good lighting, face centered, look at camera
            </div>
          </div>
        </div>
      </div>

      {/* Quality Feedback */}
      {qualityFeedback && (
        <CaptureFeedback
          type={qualityFeedback.type}
          message={qualityFeedback.message}
          issues={qualityFeedback.issues}
        />
      )}

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
          <span className="progress-label">Face Samples</span>
          <span className="progress-count">
            {sampleCount} / {targetCount}
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

      {/* Sample Grid */}
      {samples.length > 0 && (
        <div className="sample-grid">
          <h4>Captured Samples ({samples.length})</h4>
          <div className="sample-thumbnails">
            {samples.slice(-6).map((sample) => (
              <div key={sample.id} className="sample-thumbnail">
                <img src={sample.dataUrl} alt="Face sample" />
                <div className="sample-quality">
                  {Math.round(sample.quality)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="capture-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Position your face in the center of the frame</li>
          <li>Ensure good lighting on your face</li>
          <li>Look directly at the camera</li>
          <li>Keep your face still and neutral</li>
          <li>Samples will be captured automatically when quality is good</li>
        </ul>
      </div>

      {/* Controls */}
      <div className="capture-controls">
        {!isInitialized && !isCapturing ? (
          <Button 
            variant="primary" 
            onClick={handleStartCapture}
            disabled={isComplete}
          >
            {isComplete ? 'Capture Complete ✓' : 'Start Capture'}
          </Button>
        ) : !isCapturing ? (
          <Button 
            variant="primary" 
            onClick={handleStartCapture}
            disabled={isComplete}
          >
            {isComplete ? 'Capture Complete ✓' : 'Start Capture'}
          </Button>
        ) : (
          <>
            <Button 
              variant="secondary" 
              onClick={handleManualCapture}
              disabled={!canCapture}
            >
              Capture Now
            </Button>
            <Button 
              variant="secondary" 
              onClick={stopCapture}
            >
              Stop Capture
            </Button>
          </>
        )}
      </div>

      {/* Quality Indicators */}
      {qualityFeedback?.metrics && (
        <div className="quality-indicators">
          <div className="quality-indicator">
            <span className="indicator-label">Confidence:</span>
            <span className="indicator-value">
              {(qualityFeedback.metrics.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="quality-indicator">
            <span className="indicator-label">Brightness:</span>
            <span className="indicator-value">
              {Math.round(qualityFeedback.metrics.brightness)}
            </span>
          </div>
          <div className="quality-indicator">
            <span className="indicator-label">Sharpness:</span>
            <span className="indicator-value">
              {Math.round(qualityFeedback.metrics.sharpness)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceCapture;
