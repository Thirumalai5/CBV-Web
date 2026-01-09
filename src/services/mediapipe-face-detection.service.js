/**
 * CBV System - MediaPipe Face Detection Service
 * More robust face detection using MediaPipe instead of BlazeFace
 */

import { FaceDetection } from '@mediapipe/face_detection';
import logger from '@/utils/logger';

class MediaPipeFaceDetectionService {
  constructor() {
    this.faceDetection = null;
    this.isInitialized = false;
    this.lastResults = null;
  }

  /**
   * Initialize MediaPipe Face Detection
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing MediaPipe Face Detection...');

      this.faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }
      });

      this.faceDetection.setOptions({
        model: 'short',  // 'short' for close-range (< 2m), 'full' for long-range
        minDetectionConfidence: 0.5,
        selfieMode: true,  // Mirror camera for selfie view
      });

      this.faceDetection.onResults((results) => {
        this.lastResults = results;
      });

      this.isInitialized = true;
      logger.info('✅ MediaPipe Face Detection initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize MediaPipe Face Detection:', error);
      throw error;
    }
  }

  /**
   * Detect faces in video element
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Promise<Array>} Array of detected faces in BlazeFace-compatible format
   */
  async detectFaces(videoElement) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Send frame to MediaPipe
      await this.faceDetection.send({ image: videoElement });

      // Wait a bit for results
      await new Promise(resolve => setTimeout(resolve, 10));

      if (!this.lastResults || !this.lastResults.detections || this.lastResults.detections.length === 0) {
        return [];
      }

      // Convert MediaPipe format to BlazeFace-compatible format
      const faces = this.lastResults.detections.map(detection => {
        const bbox = detection.boundingBox;
        
        // MediaPipe uses normalized coordinates (0-1)
        // Convert to pixel coordinates
        const width = videoElement.videoWidth;
        const height = videoElement.videoHeight;

        const xCenter = bbox.xCenter * width;
        const yCenter = bbox.yCenter * height;
        const boxWidth = bbox.width * width;
        const boxHeight = bbox.height * height;

        const topLeft = [
          xCenter - boxWidth / 2,
          yCenter - boxHeight / 2
        ];

        const bottomRight = [
          xCenter + boxWidth / 2,
          yCenter + boxHeight / 2
        ];

        // Extract landmarks if available
        const landmarks = detection.landmarks ? detection.landmarks.map(landmark => [
          landmark.x * width,
          landmark.y * height
        ]) : [];

        return {
          topLeft,
          bottomRight,
          probability: [detection.score || 0.9],
          landmarks,
          // Additional MediaPipe-specific data
          score: detection.score,
          label: detection.label || 'face',
        };
      });

      logger.debug(`MediaPipe detected ${faces.length} face(s)`);
      return faces;

    } catch (error) {
      logger.error('MediaPipe face detection failed:', error);
      return [];
    }
  }

  /**
   * Get detection confidence threshold
   */
  getConfidenceThreshold() {
    return 0.5;
  }

  /**
   * Set detection confidence threshold
   * @param {number} threshold - Confidence threshold (0-1)
   */
  setConfidenceThreshold(threshold) {
    if (this.faceDetection) {
      this.faceDetection.setOptions({
        minDetectionConfidence: threshold
      });
      logger.info(`MediaPipe confidence threshold set to ${threshold}`);
    }
  }

  /**
   * Set detection model
   * @param {string} model - 'short' for close-range or 'full' for long-range
   */
  setModel(model) {
    if (this.faceDetection && (model === 'short' || model === 'full')) {
      this.faceDetection.setOptions({
        model
      });
      logger.info(`MediaPipe model set to ${model}`);
    }
  }

  /**
   * Dispose of resources
   */
  dispose() {
    if (this.faceDetection) {
      this.faceDetection.close();
      this.faceDetection = null;
      this.isInitialized = false;
      this.lastResults = null;
      logger.info('MediaPipe Face Detection disposed');
    }
  }

  /**
   * Check if initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

export default new MediaPipeFaceDetectionService();
