/**
 * CBV System - Verification Camera Service
 * Dedicated camera service for continuous verification phase
 * Separate from capture camera to avoid conflicts
 */

import CONFIG from '@/utils/config';
import logger from '@/utils/logger';

class VerificationCameraService {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.isActive = false;
    this.instanceId = 'verification';
    this.constraints = {
      video: {
        width: { ideal: CONFIG.CAMERA.WIDTH },
        height: { ideal: CONFIG.CAMERA.HEIGHT },
        frameRate: { ideal: CONFIG.CAMERA.FRAME_RATE },
        facingMode: CONFIG.CAMERA.FACING_MODE,
      },
      audio: false,
    };
  }

  /**
   * Check if camera is supported
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Request camera permission and start stream for VERIFICATION
   */
  async start(videoElement) {
    try {
      if (!this.isSupported()) {
        throw new Error('Camera not supported in this browser');
      }

      if (this.isActive) {
        logger.warn('[VERIFICATION] Camera already active');
        return this.stream;
      }

      logger.info('[VERIFICATION] Requesting camera access for continuous verification...');

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia(this.constraints);
      this.videoElement = videoElement;

      // Attach stream to video element
      if (videoElement) {
        videoElement.srcObject = this.stream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          videoElement.onloadedmetadata = () => {
            videoElement.play();
            resolve();
          };
        });
      }

      this.isActive = true;

      logger.info('[VERIFICATION] Camera started successfully', {
        instanceId: this.instanceId,
        width: this.stream.getVideoTracks()[0].getSettings().width,
        height: this.stream.getVideoTracks()[0].getSettings().height,
        frameRate: this.stream.getVideoTracks()[0].getSettings().frameRate,
      });

      return this.stream;
    } catch (error) {
      logger.error('[VERIFICATION] Failed to start camera', { error: error.message });
      
      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError') {
        throw new Error('Camera permission denied. Please allow camera access.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No camera found. Please connect a camera.');
      } else if (error.name === 'NotReadableError') {
        throw new Error('Camera is already in use by another application.');
      } else {
        throw error;
      }
    }
  }

  /**
   * Stop camera stream
   */
  stop() {
    try {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      }

      if (this.videoElement) {
        this.videoElement.srcObject = null;
        this.videoElement = null;
      }

      this.isActive = false;
      logger.info('[VERIFICATION] Camera stopped');
    } catch (error) {
      logger.error('[VERIFICATION] Failed to stop camera', { error: error.message });
      throw error;
    }
  }

  /**
   * Capture current frame from video element
   */
  captureFrame(videoElement = this.videoElement) {
    try {
      if (!videoElement) {
        throw new Error('No video element available');
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Draw current frame
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      return canvas;
    } catch (error) {
      logger.error('[VERIFICATION] Failed to capture frame', { error: error.message });
      throw error;
    }
  }

  /**
   * Capture frame as ImageData
   */
  captureFrameData(videoElement = this.videoElement) {
    try {
      const canvas = this.captureFrame(videoElement);
      const ctx = canvas.getContext('2d');
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      logger.error('[VERIFICATION] Failed to capture frame data', { error: error.message });
      throw error;
    }
  }

  /**
   * Capture frame as base64 data URL
   */
  captureFrameAsDataURL(videoElement = this.videoElement, format = 'image/jpeg', quality = 0.95) {
    try {
      const canvas = this.captureFrame(videoElement);
      return canvas.toDataURL(format, quality);
    } catch (error) {
      logger.error('[VERIFICATION] Failed to capture frame as data URL', { error: error.message });
      throw error;
    }
  }

  /**
   * Capture frame as Blob
   */
  async captureFrameAsBlob(videoElement = this.videoElement, format = 'image/jpeg', quality = 0.95) {
    try {
      const canvas = this.captureFrame(videoElement);
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format,
          quality
        );
      });
    } catch (error) {
      logger.error('[VERIFICATION] Failed to capture frame as blob', { error: error.message });
      throw error;
    }
  }

  /**
   * Get camera capabilities
   */
  getCapabilities() {
    try {
      if (!this.stream) {
        throw new Error('Camera not active');
      }

      const track = this.stream.getVideoTracks()[0];
      return track.getCapabilities();
    } catch (error) {
      logger.error('[VERIFICATION] Failed to get camera capabilities', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current camera settings
   */
  getSettings() {
    try {
      if (!this.stream) {
        throw new Error('Camera not active');
      }

      const track = this.stream.getVideoTracks()[0];
      return track.getSettings();
    } catch (error) {
      logger.error('[VERIFICATION] Failed to get camera settings', { error: error.message });
      throw error;
    }
  }

  /**
   * Apply camera constraints
   */
  async applyConstraints(constraints) {
    try {
      if (!this.stream) {
        throw new Error('Camera not active');
      }

      const track = this.stream.getVideoTracks()[0];
      await track.applyConstraints(constraints);
      
      logger.info('[VERIFICATION] Camera constraints applied', constraints);
    } catch (error) {
      logger.error('[VERIFICATION] Failed to apply camera constraints', { error: error.message });
      throw error;
    }
  }

  /**
   * Take snapshot with metadata
   */
  async takeSnapshot(videoElement = this.videoElement) {
    try {
      const dataURL = this.captureFrameAsDataURL(videoElement);
      const settings = this.getSettings();

      return {
        dataURL,
        timestamp: Date.now(),
        width: settings.width,
        height: settings.height,
        frameRate: settings.frameRate,
      };
    } catch (error) {
      logger.error('[VERIFICATION] Failed to take snapshot', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if camera is currently active
   */
  isRunning() {
    return this.isActive && this.stream !== null;
  }

  /**
   * Get video dimensions
   */
  getVideoDimensions(videoElement = this.videoElement) {
    if (!videoElement) {
      return { width: 0, height: 0 };
    }

    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
    };
  }

  /**
   * Create video element
   */
  createVideoElement() {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    return video;
  }

  /**
   * Pause verification (keep stream but stop processing)
   */
  pause() {
    logger.info('[VERIFICATION] Camera paused (stream active, processing stopped)');
    // Stream stays active, but caller should stop processing frames
  }

  /**
   * Resume verification
   */
  resume() {
    logger.info('[VERIFICATION] Camera resumed');
    // Caller should resume processing frames
  }
}

// Create singleton instance for VERIFICATION phase
const verificationCameraService = new VerificationCameraService();

// Log initialization
if (verificationCameraService.isSupported()) {
  logger.info('[VERIFICATION] Verification camera service initialized');
} else {
  logger.error('[VERIFICATION] Camera not supported in this browser');
}

export default verificationCameraService;
