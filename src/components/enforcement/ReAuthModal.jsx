/**
 * CBV System - ReAuthModal Component
 * Multi-method re-authentication modal
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import authService from '@/services/auth.service';
import faceDetectionService from '@/services/face-detection.service';
import livenessDetectionService from '@/services/liveness-detection.service';
import logger from '@/utils/logger';
import './ReAuthModal.css';

const ReAuthModal = ({ 
  isOpen, 
  onSuccess, 
  onCancel,
  timeout = 30000 // 30 seconds
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState('password'); // password, face, liveness, processing
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(timeout / 1000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [livenessStatus, setLivenessStatus] = useState('');
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Initialize camera for face/liveness steps
  useEffect(() => {
    if (!isOpen || (step !== 'face' && step !== 'liveness')) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        logger.error('Failed to access camera:', err);
        setError('Camera access denied. Please enable camera permissions.');
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, step]);

  const handleTimeout = () => {
    setError('Re-authentication timeout. Please try again.');
    setTimeout(() => {
      if (onCancel) onCancel();
    }, 2000);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // Verify password using validateCredentials
      const isValid = authService.validateCredentials(currentUser.userId, password);
      
      if (!isValid) {
        setError('Invalid password. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Reset login attempts on successful re-auth
      await authService.resetLoginAttempts(currentUser.userId);

      // Password valid, move to face recognition
      logger.info('Password verified, proceeding to face recognition', { userId: currentUser.userId });
      setStep('face');
      setIsProcessing(false);
    } catch (err) {
      logger.error('Password verification error:', err);
      setError('Authentication failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleFaceCapture = async () => {
    setError('');
    setIsProcessing(true);

    try {
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Detect face
      const faceResult = await faceDetectionService.detectFace(videoRef.current);
      
      if (!faceResult.success) {
        setError('No face detected. Please position your face in the frame.');
        setIsProcessing(false);
        return;
      }

      setFaceDetected(true);
      
      // In production, would match against stored template
      // For now, simulate face match
      const matchScore = 0.85 + Math.random() * 0.1; // 0.85-0.95
      
      if (matchScore < 0.7) {
        setError('Face does not match. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Face matched, move to liveness check
      logger.info('Face matched, proceeding to liveness check');
      setStep('liveness');
      setIsProcessing(false);
    } catch (err) {
      logger.error('Face capture error:', err);
      setError('Face recognition failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleLivenessCheck = async () => {
    setError('');
    setIsProcessing(true);
    setLivenessStatus('Checking for blinks...');

    try {
      if (!videoRef.current) {
        throw new Error('Video element not available');
      }

      // Check for liveness (blink detection)
      const livenessResult = await livenessDetectionService.checkLiveness(videoRef.current);
      
      if (!livenessResult.isLive) {
        setError('Liveness check failed. Please blink naturally.');
        setLivenessStatus('');
        setIsProcessing(false);
        return;
      }

      // All checks passed
      // Reset login attempts on successful re-auth
      await authService.resetLoginAttempts(currentUser.userId);
      
      logger.info('Re-authentication successful', { userId: currentUser.userId });
      setLivenessStatus('Liveness confirmed!');
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Success
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err) {
      logger.error('Liveness check error:', err);
      setError('Liveness check failed. Please try again.');
      setLivenessStatus('');
      setIsProcessing(false);
    }
  };

  const handleSkipToPassword = async () => {
    // Allow password-only authentication as fallback
    setError('');
    setIsProcessing(true);

    try {
      // Reset login attempts on successful re-auth
      await authService.resetLoginAttempts(currentUser.userId);
      
      logger.info('Re-authentication with password only', { userId: currentUser.userId });
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 500);
    } catch (err) {
      logger.error('Failed to complete re-authentication:', err);
      setError('Failed to complete re-authentication');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="reauth-modal-overlay">
      <div className="reauth-modal">
        <div className="reauth-modal-header">
          <h2>🔒 Re-Authentication Required</h2>
          <p>Your session trust score is low. Please verify your identity.</p>
          
          <div className="reauth-modal-timer">
            Time remaining: <strong>{formatTime(timeRemaining)}</strong>
          </div>
        </div>

        <div className="reauth-modal-body">
          {/* Step 1: Password */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="reauth-step">
              <div className="reauth-step-icon">👤</div>
              <h3>Enter Your Password</h3>
              
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="reauth-input"
                autoFocus
                disabled={isProcessing}
              />

              {error && <div className="reauth-error">{error}</div>}

              <div className="reauth-actions">
                <button 
                  type="submit" 
                  className="reauth-btn reauth-btn-primary"
                  disabled={!password || isProcessing}
                >
                  {isProcessing ? 'Verifying...' : 'Continue'}
                </button>
                <button 
                  type="button" 
                  className="reauth-btn reauth-btn-secondary"
                  onClick={onCancel}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Face Recognition */}
          {step === 'face' && (
            <div className="reauth-step">
              <div className="reauth-step-icon">📷</div>
              <h3>Face Recognition</h3>
              <p>Position your face in the frame</p>

              <div className="reauth-video-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="reauth-video"
                />
                {faceDetected && (
                  <div className="reauth-video-overlay">
                    <div className="reauth-face-indicator">✓ Face Detected</div>
                  </div>
                )}
              </div>

              {error && <div className="reauth-error">{error}</div>}

              <div className="reauth-actions">
                <button 
                  className="reauth-btn reauth-btn-primary"
                  onClick={handleFaceCapture}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Capturing...' : 'Capture Face'}
                </button>
                <button 
                  className="reauth-btn reauth-btn-secondary"
                  onClick={handleSkipToPassword}
                  disabled={isProcessing}
                >
                  Skip (Password Only)
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Liveness Check */}
          {step === 'liveness' && (
            <div className="reauth-step">
              <div className="reauth-step-icon">👁️</div>
              <h3>Liveness Check</h3>
              <p>Please blink naturally</p>

              <div className="reauth-video-container">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="reauth-video"
                />
                {livenessStatus && (
                  <div className="reauth-video-overlay">
                    <div className="reauth-liveness-status">{livenessStatus}</div>
                  </div>
                )}
              </div>

              {error && <div className="reauth-error">{error}</div>}

              <div className="reauth-actions">
                <button 
                  className="reauth-btn reauth-btn-primary"
                  onClick={handleLivenessCheck}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Checking...' : 'Check Liveness'}
                </button>
                <button 
                  className="reauth-btn reauth-btn-secondary"
                  onClick={handleSkipToPassword}
                  disabled={isProcessing}
                >
                  Skip (Password Only)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="reauth-modal-footer">
          <div className="reauth-progress">
            <div className={`reauth-progress-step ${step === 'password' ? 'active' : 'completed'}`}>
              1. Password
            </div>
            <div className={`reauth-progress-step ${step === 'face' ? 'active' : step === 'liveness' ? 'completed' : ''}`}>
              2. Face
            </div>
            <div className={`reauth-progress-step ${step === 'liveness' ? 'active' : ''}`}>
              3. Liveness
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReAuthModal;
