/**
 * CBV System - Quality Validator
 * Validates quality of captured biometric data
 */

import CONFIG from './config';
import logger from './logger';

/**
 * Validate face sample quality
 */
export const validateFaceQuality = (detection, metrics) => {
  const issues = [];
  const { FACE } = CONFIG;

  if (!detection) {
    return {
      isValid: false,
      score: 0,
      issues: ['No face detected'],
    };
  }

  let score = 100;

  // Check confidence
  if (metrics.confidence < FACE.MIN_CONFIDENCE) {
    issues.push(`Low detection confidence: ${(metrics.confidence * 100).toFixed(1)}%`);
    score -= 20;
  }

  // Check face size
  if (metrics.faceSize < FACE.MIN_FACE_SIZE) {
    issues.push('Face too small');
    score -= 15;
  } else if (metrics.faceSize > FACE.MAX_FACE_SIZE) {
    issues.push('Face too large');
    score -= 15;
  }

  // Check positioning
  const centerTolerance = CONFIG.CAPTURE.QUALITY.FACE_POSITION_TOLERANCE;
  if (Math.abs(metrics.positionX - 0.5) > centerTolerance) {
    issues.push('Face not centered horizontally');
    score -= 10;
  }
  if (Math.abs(metrics.positionY - 0.5) > centerTolerance) {
    issues.push('Face not centered vertically');
    score -= 10;
  }

  // Check brightness
  if (metrics.brightness < FACE.QUALITY_THRESHOLDS.MIN_BRIGHTNESS) {
    issues.push('Too dark');
    score -= 20;
  } else if (metrics.brightness > FACE.QUALITY_THRESHOLDS.MAX_BRIGHTNESS) {
    issues.push('Too bright');
    score -= 20;
  }

  // Check sharpness
  if (metrics.sharpness < FACE.QUALITY_THRESHOLDS.MIN_SHARPNESS) {
    issues.push('Image blurry');
    score -= 15;
  }

  score = Math.max(0, score);

  return {
    isValid: issues.length === 0,
    score,
    issues,
  };
};

/**
 * Validate liveness data quality
 */
export const validateLivenessQuality = (features, duration) => {
  const issues = [];
  const { LIVENESS, CAPTURE } = CONFIG;
  let score = 100;

  // Check duration
  if (duration < CAPTURE.LIVENESS.TARGET_DURATION) {
    issues.push(`Duration too short: ${duration}s`);
    score -= 30;
  }

  // Check blink count
  if (features.blinkCount < CAPTURE.LIVENESS.MIN_BLINKS) {
    issues.push(`Too few blinks: ${features.blinkCount}`);
    score -= 25;
  } else if (features.blinkCount > CAPTURE.LIVENESS.MAX_BLINKS) {
    issues.push(`Too many blinks: ${features.blinkCount}`);
    score -= 15;
  }

  // Check blink frequency
  const blinkFrequency = (features.blinkCount / duration) * 60;
  if (blinkFrequency < LIVENESS.BLINK_FREQUENCY_MIN) {
    issues.push('Blink frequency too low');
    score -= 20;
  } else if (blinkFrequency > LIVENESS.BLINK_FREQUENCY_MAX) {
    issues.push('Blink frequency too high');
    score -= 15;
  }

  // Check confidence
  if (features.confidence < LIVENESS.CONFIDENCE_THRESHOLD) {
    issues.push('Low liveness confidence');
    score -= 20;
  }

  score = Math.max(0, score);

  return {
    isValid: issues.length === 0,
    score,
    issues,
  };
};

/**
 * Validate behavior window quality
 */
export const validateBehaviorQuality = (window) => {
  const issues = [];
  const { CAPTURE } = CONFIG;
  let score = 100;

  // Check keystroke data
  if (window.keystroke.keyCount < CAPTURE.BEHAVIOR.MIN_KEYSTROKES_PER_WINDOW) {
    issues.push(`Too few keystrokes: ${window.keystroke.keyCount}`);
    score -= 25;
  }

  // Check mouse data
  if (window.mouse.positions.length < CAPTURE.BEHAVIOR.MIN_MOUSE_EVENTS_PER_WINDOW) {
    issues.push(`Too few mouse events: ${window.mouse.positions.length}`);
    score -= 25;
  }

  // Check window duration
  const expectedDuration = CAPTURE.BEHAVIOR.WINDOW_SIZE;
  if (window.duration < expectedDuration * 0.9) {
    issues.push('Window duration too short');
    score -= 20;
  }

  // Check for natural interaction patterns
  if (window.features.keystroke.rhythm && window.features.keystroke.rhythm < 0.3) {
    issues.push('Unnatural typing rhythm');
    score -= 15;
  }

  score = Math.max(0, score);

  return {
    isValid: issues.length === 0,
    score,
    issues,
  };
};

/**
 * Calculate overall enrollment quality
 */
export const calculateEnrollmentQuality = (faceSamples, livenessData, behaviorWindows) => {
  const { ENROLLMENT } = CONFIG;
  
  const faceQuality = {
    count: faceSamples.length,
    target: ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES,
    percentage: Math.min(100, (faceSamples.length / ENROLLMENT.REQUIREMENTS.MIN_FACE_SAMPLES) * 100),
  };

  const livenessQuality = {
    duration: livenessData?.duration || 0,
    target: ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION,
    percentage: Math.min(100, ((livenessData?.duration || 0) / ENROLLMENT.REQUIREMENTS.MIN_LIVENESS_DURATION) * 100),
  };

  const behaviorQuality = {
    count: behaviorWindows.length,
    target: ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_WINDOWS,
    percentage: Math.min(100, (behaviorWindows.length / ENROLLMENT.REQUIREMENTS.MIN_BEHAVIOR_WINDOWS) * 100),
  };

  const overallPercentage = (
    faceQuality.percentage +
    livenessQuality.percentage +
    behaviorQuality.percentage
  ) / 3;

  return {
    face: faceQuality,
    liveness: livenessQuality,
    behavior: behaviorQuality,
    overall: overallPercentage,
    isComplete: overallPercentage >= 100,
  };
};

/**
 * Get quality feedback message
 */
export const getQualityFeedback = (validation) => {
  if (validation.isValid) {
    return {
      type: 'success',
      message: 'Quality check passed ✓',
      color: 'green',
    };
  }

  if (validation.score >= 70) {
    return {
      type: 'warning',
      message: validation.issues[0] || 'Quality could be improved',
      color: 'yellow',
    };
  }

  return {
    type: 'error',
    message: validation.issues[0] || 'Quality check failed',
    color: 'red',
  };
};

/**
 * Log quality metrics
 */
export const logQualityMetrics = (type, validation) => {
  logger.info(`${type} quality validation`, {
    isValid: validation.isValid,
    score: validation.score,
    issues: validation.issues,
  });
};

export default {
  validateFaceQuality,
  validateLivenessQuality,
  validateBehaviorQuality,
  calculateEnrollmentQuality,
  getQualityFeedback,
  logQualityMetrics,
};
