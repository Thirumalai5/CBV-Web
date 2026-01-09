/**
 * CBV System - Capture Helpers
 * Utility functions for data capture operations
 */

import CONFIG from './config';
import logger from './logger';

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

/**
 * Format duration in seconds
 */
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate progress percentage
 */
export const calculateProgress = (current, target) => {
  return Math.min(100, Math.round((current / target) * 100));
};

/**
 * Get progress color based on percentage
 */
export const getProgressColor = (percentage) => {
  if (percentage >= 100) return '#10b981'; // Green
  if (percentage >= 70) return '#3b82f6'; // Blue
  if (percentage >= 40) return '#f59e0b'; // Yellow
  return '#ef4444'; // Red
};

/**
 * Generate session ID
 */
export const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create face sample metadata
 */
export const createFaceSampleMetadata = (detection, quality, sessionId, userId) => {
  return {
    userId,
    sessionId,
    timestamp: Date.now(),
    metadata: {
      confidence: detection.probability[0],
      faceSize: quality.metrics.faceSize,
      position: {
        x: quality.metrics.positionX,
        y: quality.metrics.positionY,
      },
      brightness: quality.metrics.brightness,
      sharpness: quality.metrics.sharpness,
      qualityScore: quality.score || 0,
    },
  };
};

/**
 * Create liveness sample metadata
 */
export const createLivenessSampleMetadata = (features, sessionId, userId) => {
  return {
    userId,
    sessionId,
    timestamp: Date.now(),
    features: {
      earSequence: features.earSequence,
      blinkCount: features.blinkCount,
      blinkTimestamps: features.blinkTimestamps,
      blinkDurations: features.blinkDurations,
      duration: features.duration,
      confidence: features.confidence,
    },
  };
};

/**
 * Create behavior window metadata
 */
export const createBehaviorWindowMetadata = (window, sessionId, userId) => {
  return {
    userId,
    sessionId,
    timestamp: window.startTime,
    windowDuration: window.duration,
    features: window.features,
  };
};

/**
 * Compress image data URL
 */
export const compressImageDataURL = (dataURL, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataURL;
  });
};

/**
 * Estimate storage size
 */
export const estimateStorageSize = (data) => {
  const jsonString = JSON.stringify(data);
  const bytes = new Blob([jsonString]).size;
  return {
    bytes,
    kb: (bytes / 1024).toFixed(2),
    mb: (bytes / (1024 * 1024)).toFixed(2),
  };
};

/**
 * Check storage quota
 */
export const checkStorageQuota = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      available: estimate.quota - estimate.usage,
    };
  }
  return null;
};

/**
 * Throttle function execution
 */
export const throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  };
};

/**
 * Debounce function execution
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Create capture session summary
 */
export const createCaptureSessionSummary = (faceSamples, livenessData, behaviorWindows) => {
  return {
    timestamp: Date.now(),
    face: {
      count: faceSamples.length,
      avgQuality: faceSamples.reduce((sum, s) => sum + (s.metadata.qualityScore || 0), 0) / faceSamples.length,
      avgConfidence: faceSamples.reduce((sum, s) => sum + s.metadata.confidence, 0) / faceSamples.length,
    },
    liveness: {
      duration: livenessData?.features?.duration || 0,
      blinkCount: livenessData?.features?.blinkCount || 0,
      confidence: livenessData?.features?.confidence || 0,
    },
    behavior: {
      windowCount: behaviorWindows.length,
      totalKeystrokes: behaviorWindows.reduce((sum, w) => sum + (w.features.keystroke?.keyCount || 0), 0),
      totalMouseEvents: behaviorWindows.reduce((sum, w) => sum + (w.features.mouse?.clickCount || 0), 0),
    },
  };
};

/**
 * Validate capture session completeness
 */
export const validateCaptureSession = (faceSamples, livenessData, behaviorWindows) => {
  const { ENROLLMENT } = CONFIG;
  const issues = [];

  if (faceSamples.length < ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES) {
    issues.push(`Need ${ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES - faceSamples.length} more face samples`);
  }

  if (!livenessData || livenessData.features.duration < ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION) {
    const needed = ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION - (livenessData?.features?.duration || 0);
    issues.push(`Need ${needed} more seconds of liveness data`);
  }

  if (behaviorWindows.length < ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_WINDOWS) {
    issues.push(`Need ${ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_WINDOWS - behaviorWindows.length} more behavior windows`);
  }

  return {
    isComplete: issues.length === 0,
    issues,
  };
};

/**
 * Get capture instructions based on module
 */
export const getCaptureInstructions = (module) => {
  const instructions = {
    face: [
      'Position your face in the center of the frame',
      'Ensure good lighting on your face',
      'Look directly at the camera',
      'Keep your face still and neutral',
      'Remove glasses if possible',
    ],
    liveness: [
      'Look at the camera naturally',
      'Blink normally (don\'t force it)',
      'Make small natural head movements',
      'Stay in frame for the full duration',
      'Maintain good lighting',
    ],
    behavior: [
      'Type the provided text naturally',
      'Use your normal typing speed',
      'Move your mouse naturally',
      'Click on targets as they appear',
      'Don\'t rush - be natural',
    ],
  };

  return instructions[module] || [];
};

/**
 * Calculate time remaining
 */
export const calculateTimeRemaining = (startTime, targetDuration) => {
  const elapsed = (Date.now() - startTime) / 1000;
  const remaining = Math.max(0, targetDuration - elapsed);
  return {
    elapsed: Math.floor(elapsed),
    remaining: Math.floor(remaining),
    percentage: Math.min(100, (elapsed / targetDuration) * 100),
  };
};

/**
 * Create error report
 */
export const createErrorReport = (error, context) => {
  return {
    timestamp: Date.now(),
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };
};

/**
 * Log capture event
 */
export const logCaptureEvent = (eventType, data) => {
  logger.info(`Capture event: ${eventType}`, data);
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate random target positions for mouse interaction
 */
export const generateTargetPositions = (count, width, height, padding = 50) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: padding + Math.random() * (width - 2 * padding),
      y: padding + Math.random() * (height - 2 * padding),
      id: i,
    });
  }
  return positions;
};

/**
 * Check if browser supports required features
 */
export const checkBrowserCapabilities = () => {
  const capabilities = {
    camera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    webgl: !!document.createElement('canvas').getContext('webgl'),
    indexedDB: !!window.indexedDB,
    webCrypto: !!(window.crypto && window.crypto.subtle),
    webWorkers: !!window.Worker,
  };

  const allSupported = Object.values(capabilities).every(v => v);

  return {
    ...capabilities,
    allSupported,
  };
};

export default {
  formatTimestamp,
  formatDuration,
  calculateProgress,
  getProgressColor,
  generateSessionId,
  createFaceSampleMetadata,
  createLivenessSampleMetadata,
  createBehaviorWindowMetadata,
  compressImageDataURL,
  estimateStorageSize,
  checkStorageQuota,
  throttle,
  debounce,
  createCaptureSessionSummary,
  validateCaptureSession,
  getCaptureInstructions,
  calculateTimeRemaining,
  createErrorReport,
  logCaptureEvent,
  formatFileSize,
  generateTargetPositions,
  checkBrowserCapabilities,
};
