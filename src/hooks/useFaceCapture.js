/**
 * CBV System - useFaceCapture Hook
 * Custom hook for face capture functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import faceDetectionService from '@/services/face-detection.service';
import captureCameraService from '@/services/capture-camera.service';
import storageService from '@/services/storage.service';
import { useAuth } from '@/context/AuthContext';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';
import { createFaceSampleMetadata } from '@/utils/capture-helpers';
import { validateFaceQuality } from '@/utils/quality-validator';

const useFaceCapture = () => {
  const { session } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [samples, setSamples] = useState([]);
  const [currentDetection, setCurrentDetection] = useState(null);
  const [qualityFeedback, setQualityFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const qualityCheckIntervalRef = useRef(null);
  const samplesRef = useRef([]);
  const currentDetectionRef = useRef(null);
  const qualityFeedbackRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    samplesRef.current = samples;
  }, [samples]);

  useEffect(() => {
    currentDetectionRef.current = currentDetection;
  }, [currentDetection]);

  useEffect(() => {
    qualityFeedbackRef.current = qualityFeedback;
  }, [qualityFeedback]);

  /**
   * Initialize face detection and camera
   */
  const initialize = useCallback(async () => {
    console.log('🟢 useFaceCapture.initialize() called', { isInitialized });
    
    // Don't re-initialize if already initialized
    if (isInitialized) {
      console.log('⚠️ Already initialized, skipping');
      logger.info('Face capture already initialized, skipping...');
      return;
    }

    try {
      setError(null);
      console.log('🔄 Starting initialization...');
      logger.info('Initializing face capture...');

      // Initialize face detection service
      console.log('📞 Calling faceDetectionService.init()...');
      await faceDetectionService.init();
      console.log('✅ faceDetectionService.init() completed');

      // Start camera only if not already running
      console.log('📹 Checking camera...', { 
        hasVideoRef: !!videoRef.current,
        isRunning: captureCameraService.isRunning() 
      });
      
      if (videoRef.current && !captureCameraService.isRunning()) {
        console.log('🎥 Starting camera...');
        await captureCameraService.start(videoRef.current);
        console.log('✅ Camera started');
      }

      setIsInitialized(true);
      console.log('✅ Face capture initialized successfully');
      logger.info('Face capture initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize face capture:', err);
      logger.error('Failed to initialize face capture', { error: err.message });
      setError(err.message);
      throw err;
    }
  }, [isInitialized]);

  /**
   * Start face capture
   */
  const startCapture = useCallback(async () => {
    if (!isInitialized) {
      throw new Error('Face capture not initialized');
    }

    if (isCapturing) {
      logger.warn('Face capture already running');
      return;
    }

    try {
      setIsCapturing(true);
      setError(null);
      logger.info('Starting face capture...');

      const { CAPTURE } = CONFIG;

      // Start quality check loop - inline to avoid dependency issues
      qualityCheckIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) {
          return;
        }

        try {
          // Detect face
          const detection = await faceDetectionService.detectFace(videoRef.current);
          setCurrentDetection(detection);

          if (!detection) {
            setQualityFeedback({
              isValid: false,
              message: 'No face detected',
              issues: ['Position your face in the frame'],
              type: 'error',
            });
            return;
          }

          // Validate quality
          const quality = await faceDetectionService.validateFaceQuality(
            detection,
            videoRef.current
          );

          const validation = validateFaceQuality(detection, quality.metrics);

          setQualityFeedback({
            isValid: validation.isValid,
            message: validation.isValid ? 'Quality good ✓' : validation.issues[0],
            issues: validation.issues,
            type: validation.isValid ? 'success' : validation.score >= 70 ? 'warning' : 'error',
            score: validation.score,
            metrics: quality.metrics,
          });
        } catch (err) {
          logger.error('Quality check failed', { error: err.message });
        }
      }, CAPTURE.FACE.QUALITY_CHECK_INTERVAL);

      // Start auto-capture loop if enabled - inline to avoid dependency issues
      if (CAPTURE.FACE.AUTO_CAPTURE) {
        logger.info('Auto-capture enabled, starting interval...');
        captureIntervalRef.current = setInterval(async () => {
          // Use refs to get latest values
          const currentSamples = samplesRef.current.length;
          const latestDetection = currentDetectionRef.current;
          const latestQualityFeedback = qualityFeedbackRef.current;
          
          if (currentSamples >= CAPTURE.FACE.TARGET_SAMPLES) {
            logger.info('Target samples reached, stopping capture');
            // Stop intervals
            if (captureIntervalRef.current) {
              clearInterval(captureIntervalRef.current);
              captureIntervalRef.current = null;
            }
            if (qualityCheckIntervalRef.current) {
              clearInterval(qualityCheckIntervalRef.current);
              qualityCheckIntervalRef.current = null;
            }
            setIsCapturing(false);
            return;
          }

          // Check quality feedback from ref
          if (!latestDetection || !latestQualityFeedback?.isValid) {
            return;
          }

          try {
            if (!videoRef.current || !latestDetection || !session) {
              return;
            }

            // Crop face from video
            const faceDataUrl = await faceDetectionService.cropFace(
              videoRef.current,
              latestDetection
            );

            // Create metadata
            const metadata = createFaceSampleMetadata(
              latestDetection,
              latestQualityFeedback,
              session.sessionId,
              session.userId
            );

            // Save to IndexedDB
            await storageService.saveFaceSample({
              ...metadata,
              dataUrl: faceDataUrl,
            });

            // Update local state
            const newSample = {
              id: Date.now(),
              dataUrl: faceDataUrl,
              timestamp: metadata.timestamp,
              quality: latestQualityFeedback.score,
            };

            setSamples(prev => {
              const updated = [...prev, newSample];
              const newProgress = Math.min(
                100,
                (updated.length / CAPTURE.FACE.TARGET_SAMPLES) * 100
              );
              setProgress(newProgress);
              return updated;
            });

            logger.info('Face sample captured', {
              count: currentSamples + 1,
              target: CAPTURE.FACE.TARGET_SAMPLES,
            });
          } catch (err) {
            logger.error('Auto-capture failed', { error: err.message });
          }
        }, CAPTURE.FACE.CAPTURE_INTERVAL);
      }

      logger.info('Face capture started', {
        autoCapture: CAPTURE.FACE.AUTO_CAPTURE,
        captureInterval: CAPTURE.FACE.CAPTURE_INTERVAL,
        qualityCheckInterval: CAPTURE.FACE.QUALITY_CHECK_INTERVAL,
      });
    } catch (err) {
      logger.error('Failed to start face capture', { error: err.message });
      setError(err.message);
      setIsCapturing(false);
      throw err;
    }
  }, [isInitialized, isCapturing, session]);

  /**
   * Stop face capture (but keep camera running)
   */
  const stopCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (qualityCheckIntervalRef.current) {
      clearInterval(qualityCheckIntervalRef.current);
      qualityCheckIntervalRef.current = null;
    }

    setIsCapturing(false);
    setCurrentDetection(null);
    setQualityFeedback(null);
    
    // NOTE: We don't stop the camera here - it stays running
    // Camera is only stopped on component unmount
    logger.info('Face capture stopped (camera still running)');
  }, []);

  /**
   * Check face quality
   */
  const checkQuality = useCallback(async () => {
    logger.debug('checkQuality called', {
      hasVideo: !!videoRef.current,
      videoReady: videoRef.current?.readyState,
    });

    if (!videoRef.current) {
      logger.debug('Skipping quality check: no video');
      return;
    }

    try {
      logger.debug('Detecting face...');
      // Detect face
      const detection = await faceDetectionService.detectFace(videoRef.current);
      logger.debug('Face detection result:', { detected: !!detection });
      setCurrentDetection(detection);

      if (!detection) {
        logger.debug('No face detected, setting error feedback');
        setQualityFeedback({
          isValid: false,
          message: 'No face detected',
          issues: ['Position your face in the frame'],
          type: 'error',
        });
        return;
      }

      logger.debug('Validating face quality...');
      // Validate quality
      const quality = await faceDetectionService.validateFaceQuality(
        detection,
        videoRef.current
      );

      const validation = validateFaceQuality(detection, quality.metrics);
      logger.debug('Quality validation result:', {
        isValid: validation.isValid,
        score: validation.score,
        issues: validation.issues,
      });

      setQualityFeedback({
        isValid: validation.isValid,
        message: validation.isValid ? 'Quality good ✓' : validation.issues[0],
        issues: validation.issues,
        type: validation.isValid ? 'success' : validation.score >= 70 ? 'warning' : 'error',
        score: validation.score,
        metrics: quality.metrics,
      });
    } catch (err) {
      logger.error('Quality check failed', { error: err.message, stack: err.stack });
    }
  }, []);

  /**
   * Attempt auto-capture if quality is good
   */
  const attemptAutoCapture = useCallback(async () => {
    logger.debug('Attempting auto-capture', {
      hasQualityFeedback: !!qualityFeedback,
      isValid: qualityFeedback?.isValid,
      samplesCount: samples.length,
      target: CONFIG.CAPTURE.FACE.TARGET_SAMPLES,
    });

    if (!qualityFeedback || !qualityFeedback.isValid) {
      logger.debug('Skipping auto-capture: quality not valid');
      return;
    }

    if (samples.length >= CONFIG.CAPTURE.FACE.TARGET_SAMPLES) {
      logger.info('Target samples reached, stopping capture');
      stopCapture();
      return;
    }

    try {
      logger.info('Auto-capturing sample...');
      await captureSample();
    } catch (err) {
      logger.error('Auto-capture failed', { error: err.message });
    }
  }, [qualityFeedback, samples.length, stopCapture, captureSample]);

  /**
   * Manually capture a sample
   */
  const captureSample = useCallback(async () => {
    if (!videoRef.current || !currentDetection) {
      throw new Error('No face detected');
    }

    if (!session) {
      throw new Error('No active session');
    }

    try {
      // Crop face from video
      const faceDataUrl = await faceDetectionService.cropFace(
        videoRef.current,
        currentDetection
      );

      // Create metadata
      const metadata = createFaceSampleMetadata(
        currentDetection,
        qualityFeedback,
        session.sessionId,
        session.userId
      );

      // Save to IndexedDB
      await storageService.saveFaceSample({
        ...metadata,
        dataUrl: faceDataUrl,
      });

      // Update local state
      const newSample = {
        id: Date.now(),
        dataUrl: faceDataUrl,
        timestamp: metadata.timestamp,
        quality: qualityFeedback.score,
      };

      setSamples(prev => [...prev, newSample]);

      // Update progress
      const newProgress = Math.min(
        100,
        ((samples.length + 1) / CONFIG.CAPTURE.FACE.TARGET_SAMPLES) * 100
      );
      setProgress(newProgress);

      logger.info('Face sample captured', {
        count: samples.length + 1,
        target: CONFIG.CAPTURE.FACE.TARGET_SAMPLES,
      });

      return newSample;
    } catch (err) {
      logger.error('Failed to capture sample', { error: err.message });
      setError(err.message);
      throw err;
    }
  }, [videoRef, currentDetection, qualityFeedback, session, samples.length]);

  /**
   * Clear all samples
   */
  const clearSamples = useCallback(() => {
    setSamples([]);
    setProgress(0);
    logger.info('Face samples cleared');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCapture();
      if (captureCameraService.isRunning()) {
        captureCameraService.stop();
      }
    };
  }, [stopCapture]);

  return {
    // State
    isInitialized,
    isCapturing,
    samples,
    currentDetection,
    qualityFeedback,
    error,
    progress,
    videoRef,

    // Methods
    initialize,
    startCapture,
    stopCapture,
    captureSample,
    clearSamples,

    // Computed
    sampleCount: samples.length,
    targetCount: CONFIG.CAPTURE.FACE.TARGET_SAMPLES,
    isComplete: samples.length >= CONFIG.CAPTURE.FACE.TARGET_SAMPLES,
    canCapture: isInitialized && currentDetection && qualityFeedback?.isValid,
  };
};

export default useFaceCapture;
