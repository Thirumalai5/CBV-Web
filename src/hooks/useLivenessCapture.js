/**
 * CBV System - useLivenessCapture Hook
 * Custom hook for liveness detection functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import livenessDetectionService from '@/services/liveness-detection.service';
import captureCameraService from '@/services/capture-camera.service';
import storageService from '@/services/storage.service';
import { useAuth } from '@/context/AuthContext';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import { createLivenessSampleMetadata, calculateTimeRemaining } from '@/utils/capture-helpers';
import { validateLivenessQuality } from '@/utils/quality-validator';

const useLivenessCapture = () => {
  const { session } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [blinkCount, setBlinkCount] = useState(0);
  const [currentEAR, setCurrentEAR] = useState(0);
  const [livenessConfidence, setLivenessConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const durationIntervalRef = useRef(null);

  /**
   * Initialize liveness detection service (without starting camera)
   */
  const initialize = useCallback(async () => {
    try {
      setError(null);
      logger.info('Initializing liveness detection service...');

      // Initialize liveness detection service (load models)
      await livenessDetectionService.init();

      setIsInitialized(true);
      logger.info('Liveness detection service initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize liveness detection', { error: err.message });
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Start liveness capture (starts camera and begins detection)
   */
  const startCapture = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Liveness capture not initialized');
    }

    if (isCapturing) {
      logger.warn('Liveness capture already running');
      return;
    }

    try {
      setError(null);
      logger.info('Starting liveness capture...');

      // Start camera (this will request permission)
      if (videoRef.current && !captureCameraService.isRunning()) {
        await captureCameraService.start(videoRef.current);
      }

      // Wait for video to be fully ready and a few frames to render
      console.log('⏳ Waiting for video to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Video should be ready now');

      setIsCapturing(true);
      setDuration(0);
      setBlinkCount(0);
      setProgress(0);

      // Reset service state
      livenessDetectionService.reset();

      startTimeRef.current = Date.now();

      const { CAPTURE } = CONFIG;
      const captureInterval = 1000 / CAPTURE.LIVENESS.FPS; // Convert FPS to interval

      // Start landmark detection loop
      console.log('🎬 Starting liveness detection interval at', captureInterval, 'ms');
      console.log('🤖 Model initialized:', livenessDetectionService.isInitialized);
      captureIntervalRef.current = setInterval(async () => {
        console.log('🔄 Detection loop running...');
        
        if (!videoRef.current) {
          console.warn('⚠️ No video ref');
          return;
        }

        console.log('📹 Video element:', {
          readyState: videoRef.current.readyState,
          videoWidth: videoRef.current.videoWidth,
          videoHeight: videoRef.current.videoHeight,
        });

        try {
          // Detect landmarks
          console.log('🔍 Calling detectLandmarks...');
          const landmarks = await livenessDetectionService.detectLandmarks(videoRef.current);
          console.log('📊 Landmarks result:', landmarks ? 'Found' : 'None');

          if (!landmarks) {
            console.warn('⚠️ No landmarks detected');
            return;
          }

          // Calculate EAR
          const ear = livenessDetectionService.calculateEAR(landmarks);
          console.log('👁️ EAR calculated:', ear);
          setCurrentEAR(ear);

          // Update EAR history and detect blinks
          const timestamp = Date.now();
          const blinkResult = livenessDetectionService.updateEARHistory(ear, timestamp);
          console.log('👀 Blink result:', blinkResult);

          if (blinkResult.blinkDetected) {
            setBlinkCount(blinkResult.blinkCount);
            console.log('✨ Blink detected! Count:', blinkResult.blinkCount);
            logger.debug('Blink detected', { count: blinkResult.blinkCount });
          }

          // Calculate motion
          const motion = livenessDetectionService.calculateMotion(landmarks);
          console.log('🏃 Motion:', motion);

          // Calculate liveness confidence
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const validation = livenessDetectionService.validateLiveness(elapsed);
          console.log('✅ Confidence:', validation.metrics.confidence);
          setLivenessConfidence(validation.metrics.confidence || 0);

        } catch (err) {
          console.error('❌ Detection error:', err);
          logger.error('Liveness detection failed', { error: err.message });
        }
      }, captureInterval);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setDuration(elapsed);

        const progressPercent = Math.min(
          100,
          (elapsed / CAPTURE.LIVENESS.TARGET_DURATION) * 100
        );
        setProgress(progressPercent);

        // Auto-stop when target duration reached
        if (elapsed >= CAPTURE.LIVENESS.TARGET_DURATION) {
          // Stop intervals
          if (captureIntervalRef.current) {
            clearInterval(captureIntervalRef.current);
            captureIntervalRef.current = null;
          }
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }

          setIsCapturing(false);

          // Save liveness data if we have sufficient duration
          if (elapsed >= CONFIG.CAPTURE.LIVENESS.TARGET_DURATION && session) {
            // Use Promise without await in setInterval
            saveLivenessData(elapsed)
              .then(() => {
                logger.info('Liveness capture completed and saved');
              })
              .catch((err) => {
                logger.error('Failed to save liveness data', { error: err.message });
                setError(err.message);
              });
          }

          logger.info('Liveness capture stopped', { duration: elapsed, blinkCount });
        }
      }, 100); // Update every 100ms for smooth progress

      logger.info('Liveness capture started successfully');
    } catch (err) {
      logger.error('Failed to start liveness capture', { error: err.message });
      setError(err.message);
      setIsCapturing(false);
      throw err;
    }
  }, [isInitialized, isCapturing, session]);

  /**
   * Stop liveness capture
   */
  const stopCapture = useCallback(async () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    setIsCapturing(false);

    // Save liveness data if we have sufficient duration
    const currentDuration = duration;
    if (currentDuration >= CONFIG.CAPTURE.LIVENESS.TARGET_DURATION && session) {
      try {
        await saveLivenessData();
        logger.info('Liveness capture completed and saved');
      } catch (err) {
        logger.error('Failed to save liveness data', { error: err.message });
        setError(err.message);
      }
    }

    logger.info('Liveness capture stopped', { duration: currentDuration, blinkCount });
  }, [session]);



  /**
   * Save liveness data to storage
   */
  const saveLivenessData = useCallback(async (currentDuration = duration) => {
    if (!session) {
      throw new Error('No active session');
    }

    try {
      // Get liveness features
      const features = livenessDetectionService.getLivenessFeatures(currentDuration);

      // Validate quality
      const validation = validateLivenessQuality(features, currentDuration);

      if (!validation.isValid) {
        logger.warn('Liveness quality validation failed', { issues: validation.issues });
      }

      // Create metadata
      const metadata = createLivenessSampleMetadata(
        features,
        session.sessionId,
        session.userId
      );

      // Save to IndexedDB
      await storageService.saveLivenessSample(metadata);

      logger.info('Liveness data saved', {
        duration: currentDuration,
        blinkCount: features.blinkCount,
        confidence: features.confidence,
      });

      return metadata;
    } catch (err) {
      logger.error('Failed to save liveness data', { error: err.message });
      throw err;
    }
  }, [session]);

  /**
   * Get time remaining
   */
  const getTimeRemaining = useCallback(() => {
    if (!startTimeRef.current) {
      return {
        elapsed: 0,
        remaining: CONFIG.CAPTURE.LIVENESS.TARGET_DURATION,
        percentage: 0,
      };
    }

    return calculateTimeRemaining(
      startTimeRef.current,
      CONFIG.CAPTURE.LIVENESS.TARGET_DURATION
    );
  }, []);

  /**
   * Validate current liveness data
   */
  const validateCurrent = useCallback(() => {
    const features = {
      blinkCount,
      duration,
      confidence: livenessConfidence,
    };

    return validateLivenessQuality(features, duration);
  }, [blinkCount, duration, livenessConfidence]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (captureCameraService.isRunning()) {
        captureCameraService.stop();
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isCapturing,
    duration,
    blinkCount,
    currentEAR,
    livenessConfidence,
    error,
    progress,
    videoRef,

    // Methods
    initialize,
    startCapture,
    stopCapture,
    getTimeRemaining,
    validateCurrent,

    // Computed
    targetDuration: CONFIG.CAPTURE.LIVENESS.TARGET_DURATION,
    minBlinks: CONFIG.CAPTURE.LIVENESS.MIN_BLINKS,
    maxBlinks: CONFIG.CAPTURE.LIVENESS.MAX_BLINKS,
    isComplete: duration >= CONFIG.CAPTURE.LIVENESS.TARGET_DURATION,
    isBlinkCountValid: blinkCount >= CONFIG.CAPTURE.LIVENESS.MIN_BLINKS && 
                       blinkCount <= CONFIG.CAPTURE.LIVENESS.MAX_BLINKS,
  };
};

export default useLivenessCapture;
