/**
 * CBV System - Face Detection Service
 * Handles face detection using MediaPipe (primary) and BlazeFace (fallback)
 */

import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs';
import mediapipeFaceDetection from './mediapipe-face-detection.service';
import CONFIG from '@/utils/config';
import logger from '@/utils/logger';

class FaceDetectionService {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.isLoading = false;
  }

  /**
   * Initialize face detection models (MediaPipe primary, BlazeFace fallback)
   */
  async init() {
    console.log('🔵 FaceDetectionService.init() called');
    
    if (this.isInitialized) {
      console.log('✅ Face detection already initialized');
      logger.info('Face detection already initialized');
      return true;
    }

    if (this.isLoading) {
      console.log('⏳ Face detection already loading');
      logger.info('Face detection already loading');
      return false;
    }

    try {
      this.isLoading = true;
      
      // Try to initialize MediaPipe first (primary)
      try {
        console.log('📥 Loading MediaPipe Face Detection (primary)...');
        logger.info('Loading MediaPipe Face Detection...');
        await mediapipeFaceDetection.initialize();
        console.log('✅ MediaPipe Face Detection loaded successfully');
        logger.info('✅ MediaPipe Face Detection initialized - using as primary detector');
      } catch (mediapipeError) {
        console.warn('⚠️ MediaPipe failed, will use BlazeFace only:', mediapipeError);
        logger.warn('MediaPipe initialization failed, using BlazeFace only', { error: mediapipeError.message });
      }

      // Initialize BlazeFace as fallback
      console.log('📥 Loading BlazeFace model (fallback)...');
      logger.info('Loading BlazeFace model as fallback...');

      // Set TensorFlow.js backend
      console.log('🔧 Initializing TensorFlow.js...');
      await tf.ready();
      console.log('✅ TensorFlow.js ready', { backend: tf.getBackend() });
      logger.info('TensorFlow.js ready', { backend: tf.getBackend() });

      // Load BlazeFace model
      console.log('📦 Loading BlazeFace model from CDN...');
      this.model = await blazeface.load();
      console.log('✅ BlazeFace model loaded successfully');
      
      this.isInitialized = true;
      this.isLoading = false;
      
      logger.info('Face detection initialized - MediaPipe (primary) + BlazeFace (fallback)');
      return true;
    } catch (error) {
      this.isLoading = false;
      console.error('❌ Failed to load face detection models:', error);
      logger.error('Failed to load face detection models', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect face in video element
   * Uses MediaPipe first, falls back to BlazeFace if needed
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<Object|null>} Detection result or null
   */
  async detectFace(videoElement) {
    if (!this.isInitialized) {
      throw new Error('Face detection not initialized');
    }

    try {
      // Try MediaPipe first (more robust)
      if (mediapipeFaceDetection.isReady()) {
        const mediapipeFaces = await mediapipeFaceDetection.detectFaces(videoElement);
        
        if (mediapipeFaces && mediapipeFaces.length > 0) {
          // Use first face from MediaPipe
          const face = mediapipeFaces[0];
          logger.debug('✅ Face detected using MediaPipe');
          
          return {
            topLeft: face.topLeft,
            bottomRight: face.bottomRight,
            landmarks: face.landmarks,
            probability: face.probability,
            box: this.calculateBoundingBox(face),
            source: 'mediapipe',
          };
        }
      }

      // Fallback to BlazeFace
      logger.debug('Trying BlazeFace fallback...');
      const predictions = await this.model.estimateFaces(videoElement, false);
      
      if (predictions.length === 0) {
        return null;
      }

      // Return first face (assuming single person)
      const face = predictions[0];
      logger.debug('✅ Face detected using BlazeFace (fallback)');
      
      return {
        topLeft: face.topLeft,
        bottomRight: face.bottomRight,
        landmarks: face.landmarks,
        probability: face.probability,
        box: this.calculateBoundingBox(face),
        source: 'blazeface',
      };
    } catch (error) {
      logger.error('Face detection failed', { error: error.message });
      return null;
    }
  }

  /**
   * Calculate bounding box from face detection
   */
  calculateBoundingBox(face) {
    const [x1, y1] = face.topLeft;
    const [x2, y2] = face.bottomRight;
    
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
      centerX: (x1 + x2) / 2,
      centerY: (y1 + y2) / 2,
    };
  }

  /**
   * Validate face quality
   * @param {Object} detection - Face detection result
   * @param {HTMLVideoElement} videoElement
   * @returns {Object} Quality validation result
   */
  async validateFaceQuality(detection, videoElement) {
    if (!detection) {
      return {
        isValid: false,
        issues: ['No face detected'],
        metrics: {},
      };
    }

    const issues = [];
    const metrics = {};
    const { FACE, CAPTURE } = CONFIG;

    // Check confidence
    metrics.confidence = detection.probability[0];
    if (metrics.confidence < FACE.MIN_CONFIDENCE) {
      issues.push(`Low confidence: ${(metrics.confidence * 100).toFixed(1)}%`);
    }

    // Check face size
    const videoWidth = videoElement.videoWidth;
    const videoHeight = videoElement.videoHeight;
    const faceArea = detection.box.width * detection.box.height;
    const videoArea = videoWidth * videoHeight;
    metrics.faceSize = faceArea / videoArea;

    if (metrics.faceSize < FACE.MIN_FACE_SIZE) {
      issues.push('Face too small - move closer');
    } else if (metrics.faceSize > FACE.MAX_FACE_SIZE) {
      issues.push('Face too large - move back');
    }

    // Check face position (centering)
    const centerX = detection.box.centerX / videoWidth;
    const centerY = detection.box.centerY / videoHeight;
    metrics.positionX = centerX;
    metrics.positionY = centerY;

    const tolerance = CAPTURE.QUALITY.FACE_POSITION_TOLERANCE;
    if (Math.abs(centerX - 0.5) > tolerance) {
      issues.push('Face not centered horizontally');
    }
    if (Math.abs(centerY - 0.5) > tolerance) {
      issues.push('Face not centered vertically');
    }

    // Check brightness
    const brightness = await this.calculateBrightness(videoElement, detection.box);
    metrics.brightness = brightness;

    if (brightness < FACE.QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
      issues.push('Too dark - improve lighting');
    } else if (brightness > FACE.QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
      issues.push('Too bright - reduce lighting');
    }

    // Check sharpness (blur detection)
    const sharpness = await this.calculateSharpness(videoElement, detection.box);
    metrics.sharpness = sharpness;

    if (sharpness < FACE.QUALITY_THRESHOLDS.MIN_SHARPNESS) {
      issues.push('Image blurry - hold still');
    }

    return {
      isValid: issues.length === 0,
      issues,
      metrics,
    };
  }

  /**
   * Calculate brightness of face region
   */
  async calculateBrightness(videoElement, box) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = box.width;
      canvas.height = box.height;
      
      ctx.drawImage(
        videoElement,
        box.x, box.y, box.width, box.height,
        0, 0, box.width, box.height
      );
      
      const imageData = ctx.getImageData(0, 0, box.width, box.height);
      const data = imageData.data;
      
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Calculate perceived brightness (weighted RGB)
        sum += (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      
      return sum / (data.length / 4);
    } catch (error) {
      logger.error('Failed to calculate brightness', { error: error.message });
      return 128; // Default middle brightness
    }
  }

  /**
   * Calculate sharpness using Laplacian variance
   */
  async calculateSharpness(videoElement, box) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = box.width;
      canvas.height = box.height;
      
      ctx.drawImage(
        videoElement,
        box.x, box.y, box.width, box.height,
        0, 0, box.width, box.height
      );
      
      const imageData = ctx.getImageData(0, 0, box.width, box.height);
      const data = imageData.data;
      
      // Convert to grayscale
      const gray = [];
      for (let i = 0; i < data.length; i += 4) {
        gray.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      
      // Calculate Laplacian variance (simplified)
      let variance = 0;
      const width = box.width;
      const height = box.height;
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const laplacian = 
            -gray[idx - width] - gray[idx - 1] + 4 * gray[idx] - gray[idx + 1] - gray[idx + width];
          variance += laplacian * laplacian;
        }
      }
      
      return variance / ((width - 2) * (height - 2));
    } catch (error) {
      logger.error('Failed to calculate sharpness', { error: error.message });
      return 200; // Default acceptable sharpness
    }
  }

  /**
   * Crop face from video frame
   * @param {HTMLVideoElement} videoElement
   * @param {Object} detection
   * @returns {Promise<string>} Base64 encoded image
   */
  async cropFace(videoElement, detection) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const box = detection.box;
      
      // Add padding around face
      const padding = 0.2; // 20% padding
      const paddedWidth = box.width * (1 + padding);
      const paddedHeight = box.height * (1 + padding);
      const paddedX = box.x - (paddedWidth - box.width) / 2;
      const paddedY = box.y - (paddedHeight - box.height) / 2;
      
      canvas.width = paddedWidth;
      canvas.height = paddedHeight;
      
      ctx.drawImage(
        videoElement,
        paddedX, paddedY, paddedWidth, paddedHeight,
        0, 0, paddedWidth, paddedHeight
      );
      
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      logger.error('Failed to crop face', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate face metrics for storage
   */
  calculateFaceMetrics(detection, quality) {
    return {
      confidence: detection.probability[0],
      faceSize: quality.metrics.faceSize,
      position: {
        x: quality.metrics.positionX,
        y: quality.metrics.positionY,
      },
      brightness: quality.metrics.brightness,
      sharpness: quality.metrics.sharpness,
      boundingBox: detection.box,
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    
    // Dispose MediaPipe
    if (mediapipeFaceDetection.isReady()) {
      mediapipeFaceDetection.dispose();
    }
    
    this.isInitialized = false;
    logger.info('Face detection service disposed');
  }
}

// Create singleton instance
const faceDetectionService = new FaceDetectionService();

export default faceDetectionService;
