/**
 * CBV System - Verification Service
 * Continuous biometric verification in the background
 */

import faceMatcherService from './face-matcher.service';
import behaviorVerifierService from './behavior-verifier.service';
import livenessDetectionService from './liveness-detection.service';
import cameraService from './camera.service';
import behaviorCaptureService from './behavior-capture.service';
import templateLoaderService from './template-loader.service';
import logger from '@/utils/logger';
import CONFIG from '@/utils/config';

class VerificationService {
  constructor() {
    this.isRunning = false;
    this.userId = null;
    this.verificationInterval = null;
    this.videoElement = null;
    
    // Current scores
    this.currentScores = {
      face: 0,
      liveness: 0,
      behavior: 0,
      timestamp: null
    };
    
    // Status tracking
    this.status = {
      cameraActive: false,
      faceDetected: false,
      modelsLoaded: false,
      lastError: null
    };
    
    // Event listeners
    this.listeners = new Map();
  }

  /**
   * Start continuous verification
   * @param {string} userId - User ID
   * @param {HTMLVideoElement} videoElement - Video element for camera
   * @returns {Promise<boolean>} Success status
   */
  async start(userId, videoElement) {
    if (this.isRunning) {
      logger.warn('Verification already running');
      return true;
    }

    try {
      logger.info('Starting continuous verification', { userId });
      
      this.userId = userId;
      this.videoElement = videoElement;

      // Load templates
      logger.info('Loading verification templates...');
      const templates = await templateLoaderService.loadTemplates(userId);
      
      if (!templates.faceTemplate) {
        throw new Error('Face template not found. Please complete enrollment first.');
      }
      
      // Behavior baseline is optional - generate default if missing
      if (!templates.behaviorBaseline) {
        logger.warn('Behavior baseline not found, generating default baseline...');
        const mockTemplateService = (await import('./mock-template.service')).default;
        try {
          const baseline = await mockTemplateService.generateMockBehaviorBaseline(userId);
          templates.behaviorBaseline = baseline;
          logger.info('Default behavior baseline generated successfully');
        } catch (error) {
          logger.warn('Failed to generate default baseline, using fallback', { error: error.message });
          // Use a minimal fallback baseline
          templates.behaviorBaseline = this._createFallbackBaseline(userId);
        }
      }

      // Initialize face matcher with real face recognition
      await faceMatcherService.init();
      
      // Set templates in verification services
      faceMatcherService.setTemplate(templates.faceTemplate);
      behaviorVerifierService.setBaseline(templates.behaviorBaseline);
      
      this.status.modelsLoaded = true;
      logger.info('Templates loaded successfully');

      // Start camera if not already running
      if (!cameraService.isRunning() && videoElement) {
        logger.info('Starting camera for verification...');
        await cameraService.start(videoElement);
        this.status.cameraActive = true;
      }

      // Initialize liveness detection
      if (!livenessDetectionService.isInitialized) {
        await livenessDetectionService.init();
      }

      // Start behavior capture
      behaviorCaptureService.startCapture();

      // Start verification loop
      this.isRunning = true;
      this.startVerificationLoop();

      logger.info('Continuous verification started successfully');
      this.emit('started', { userId });
      
      return true;
    } catch (error) {
      logger.error('Failed to start verification', { error: error.message });
      this.status.lastError = error.message;
      this.emit('error', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop continuous verification
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping continuous verification');

    // Stop verification loop
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }

    // Stop behavior capture
    behaviorCaptureService.stopCapture();

    // Reset state
    this.isRunning = false;
    this.userId = null;
    this.videoElement = null;
    this.status.cameraActive = false;
    this.status.faceDetected = false;

    logger.info('Continuous verification stopped');
    this.emit('stopped');
  }

  /**
   * Start the verification loop
   */
  startVerificationLoop() {
    const frequency = CONFIG.VERIFICATION?.LOOP_FREQUENCY || 2; // Hz
    const interval = 1000 / frequency; // Convert to ms

    logger.info('Starting verification loop', { frequency: `${frequency} Hz`, interval: `${interval}ms` });

    this.verificationInterval = setInterval(async () => {
      await this.performVerification();
    }, interval);
  }

  /**
   * Perform a single verification check
   */
  async performVerification() {
    try {
      const scores = {
        face: 0,
        liveness: 0,
        behavior: 0,
        timestamp: Date.now()
      };

      // 1. Verify Face
      if (this.videoElement && cameraService.isRunning()) {
        try {
          const faceResult = await faceMatcherService.verifyFace(this.videoElement);
          
          if (faceResult.success) {
            scores.face = faceResult.confidence || 0;
            this.status.faceDetected = faceResult.isMatch;
          } else {
            scores.face = 0;
            this.status.faceDetected = false;
          }
        } catch (error) {
          logger.debug('Face verification failed', { error: error.message });
          scores.face = 0;
          this.status.faceDetected = false;
        }
      } else {
        // Camera not available - conservative score
        scores.face = 0;
        this.status.cameraActive = false;
      }

      // 2. Verify Liveness
      if (this.videoElement && cameraService.isRunning()) {
        try {
          const landmarks = await livenessDetectionService.detectLandmarks(this.videoElement);
          
          if (landmarks) {
            const ear = livenessDetectionService.calculateEAR(landmarks);
            const motion = livenessDetectionService.calculateMotion(landmarks);
            
            // Simple liveness confidence based on EAR and motion
            const earConfidence = ear > 0.15 && ear < 0.35 ? 1.0 : 0.5;
            const motionConfidence = motion > 0.01 ? 1.0 : 0.7;
            
            scores.liveness = (earConfidence + motionConfidence) / 2;
          } else {
            scores.liveness = 0;
          }
        } catch (error) {
          logger.debug('Liveness verification failed', { error: error.message });
          scores.liveness = 0;
        }
      } else {
        scores.liveness = 0;
      }

      // 3. Verify Behavior
      try {
        const recentWindows = behaviorCaptureService.getRecentWindows(3); // Last 3 windows
        
        if (recentWindows.length > 0) {
          const behaviorResult = behaviorVerifierService.verifyContinuousBehavior(recentWindows);
          scores.behavior = behaviorResult.confidence || 0;
        } else {
          // No behavior data yet - neutral score
          scores.behavior = 0.5;
        }
      } catch (error) {
        logger.debug('Behavior verification failed', { error: error.message });
        scores.behavior = 0.5; // Neutral on error
      }

      // Update current scores
      this.currentScores = scores;

      // Emit scores update
      this.emit('scores', scores);

      logger.debug('Verification check complete', {
        face: scores.face.toFixed(3),
        liveness: scores.liveness.toFixed(3),
        behavior: scores.behavior.toFixed(3)
      });

    } catch (error) {
      logger.error('Verification check failed', { error: error.message });
      this.status.lastError = error.message;
      this.emit('error', { error: error.message });
    }
  }

  /**
   * Get current verification scores
   * @returns {Object} Current scores
   */
  getCurrentScores() {
    return { ...this.currentScores };
  }

  /**
   * Get verification status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      userId: this.userId,
      ...this.status
    };
  }

  /**
   * Check if verification is running
   * @returns {boolean} Running status
   */
  isVerifying() {
    return this.isRunning;
  }

  /**
   * Subscribe to verification events
   * @param {string} event - Event name (started, stopped, scores, error)
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Event listener error', { event, error: error.message });
        }
      });
    }
  }

  /**
   * Create a minimal fallback baseline when no data available
   * @private
   */
  _createFallbackBaseline(userId) {
    return {
      version: '1.0',
      userId,
      createdAt: new Date().toISOString(),
      type: 'behavior_baseline',
      source: 'fallback',
      method: 'statistical',
      baseline: {
        features: Array(20).fill(null).map((_, i) => ({
          index: i,
          mean: 100,
          std: 30,
          percentiles: { 5: 50, 25: 80, 50: 100, 75: 120, 95: 150 }
        }))
      },
      feature_names: [
        'dwell_mean', 'dwell_std', 'dwell_min', 'dwell_max', 'dwell_median',
        'flight_mean', 'flight_std', 'flight_min', 'flight_max', 'flight_median',
        'velocity_mean', 'velocity_std', 'velocity_min', 'velocity_max', 'velocity_median',
        'curvature_mean', 'curvature_std', 'curvature_min', 'curvature_max', 'curvature_median',
      ],
      metadata: {
        windows_used: 0,
        note: 'Fallback baseline - minimal default values',
      },
    };
  }

  /**
   * Clear all event listeners
   */
  clearListeners() {
    this.listeners.clear();
  }
}

// Create singleton instance
const verificationService = new VerificationService();

export default verificationService;
