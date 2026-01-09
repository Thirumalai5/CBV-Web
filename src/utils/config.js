/**
 * CBV System - Global Configuration
 * Contains all constants, thresholds, and settings for the system
 */

export const CONFIG = {
  // System Information
  VERSION: '1.0.0',
  SCHEMA_VERSION: '1.0',
  
  // Sampling Rates (Hz)
  SAMPLING_RATES: {
    FACE_DETECTION: 5,        // 5 fps for face detection
    LIVENESS_CHECK: 10,       // 10 fps for liveness
    BEHAVIOR_CAPTURE: 100,    // 100 Hz for behavior (continuous)
    VERIFICATION_LOOP: 2,     // 2 Hz for runtime verification (every 500ms)
  },
  
  // Window Sizes (seconds)
  WINDOW_SIZES: {
    BEHAVIOR: 5,              // 5 second windows for behavior analysis
    LIVENESS: 3,              // 3 second windows for liveness
    TRUST_SMOOTHING: 10,      // 10 second EMA window for trust score
  },
  
  // Face Detection & Recognition
  FACE: {
    MIN_CONFIDENCE: 0.5,      // Minimum face detection confidence (lowered for better detection)
    MIN_FACE_SIZE: 0.15,      // Minimum face size (15% of frame - more lenient)
    MAX_FACE_SIZE: 0.7,       // Maximum face size (70% of frame - more lenient)
    SIMILARITY_THRESHOLD: 0.7, // Cosine similarity threshold for face match
    QUALITY_THRESHOLDS: {
      MIN_BRIGHTNESS: 50,     // Minimum average brightness
      MAX_BRIGHTNESS: 200,    // Maximum average brightness
      MIN_SHARPNESS: 100,     // Minimum Laplacian variance (blur detection)
      MAX_ANGLE: 15,          // Maximum face angle (degrees)
    },
    CAPTURE_TARGET: 100,      // Target number of face samples during enrollment
    MIN_SAMPLES: 50,          // Minimum samples required for enrollment
  },
  
  // Liveness Detection
  LIVENESS: {
    EAR_THRESHOLD: 0.2,       // Eye Aspect Ratio threshold for blink detection
    MIN_BLINK_DURATION: 100,  // Minimum blink duration (ms)
    MAX_BLINK_DURATION: 400,  // Maximum blink duration (ms)
    BLINK_FREQUENCY_MIN: 10,  // Minimum blinks per minute
    BLINK_FREQUENCY_MAX: 30,  // Maximum blinks per minute
    MOTION_THRESHOLD: 2.0,    // Minimum motion magnitude (pixels)
    CONFIDENCE_THRESHOLD: 0.6, // Minimum liveness confidence
    MIN_SEQUENCE_LENGTH: 30,  // Minimum frames for liveness sequence
  },
  
  // Behavioral Biometrics
  BEHAVIOR: {
    KEYSTROKE: {
      MIN_DWELL_TIME: 50,     // Minimum key press duration (ms)
      MAX_DWELL_TIME: 500,    // Maximum key press duration (ms)
      MIN_FLIGHT_TIME: 50,    // Minimum time between keys (ms)
      MAX_FLIGHT_TIME: 2000,  // Maximum time between keys (ms)
    },
    MOUSE: {
      MIN_VELOCITY: 0,        // Minimum mouse velocity (px/s)
      MAX_VELOCITY: 5000,     // Maximum mouse velocity (px/s)
      IDLE_THRESHOLD: 2000,   // Idle detection threshold (ms)
      SAMPLING_INTERVAL: 10,  // Mouse position sampling interval (ms)
    },
    MIN_WINDOWS: 20,          // Minimum behavior windows for enrollment
    ANOMALY_THRESHOLD: 0.3,   // Threshold for behavior anomaly detection
  },
  
  // Trust Score & State Machine
  TRUST_WEIGHTS: {
    FACE: 0.5,              // Weight for face similarity score
    LIVENESS: 0.2,          // Weight for liveness confidence
    BEHAVIOR: 0.3,          // Weight for behavior score
  },
  
  SMOOTHING: {
    ALPHA: 0.3,             // Exponential Moving Average smoothing factor
  },
  
  STATE_THRESHOLDS: {
    NORMAL: 0.7,            // Threshold for NORMAL state
    WATCH: 0.5,             // Threshold for WATCH state
    RESTRICT: 0.3,          // Threshold for RESTRICT state
    REAUTH: 0.0,            // Threshold for REAUTH state
  },
  
  HYSTERESIS: {
    MARGIN: 0.05,           // Margin for state transition hysteresis (5%)
    MIN_DURATION: 2000,     // Minimum time in state before transition (ms)
  },
  
  // Verification Loop Settings
  VERIFICATION: {
    LOOP_FREQUENCY: 2,      // Hz (2-5 recommended)
    FACE_CHECK_INTERVAL: 500,   // ms (2 Hz)
    BEHAVIOR_WINDOW: 3000,      // ms (3 seconds)
    LIVENESS_CHECK_INTERVAL: 1000, // ms (1 Hz)
  },
  
  TRUST: {
    WEIGHTS: {
      FACE: 0.5,              // Weight for face similarity score
      LIVENESS: 0.2,          // Weight for liveness confidence
      BEHAVIOR: 0.3,          // Weight for behavior score
    },
    EMA_ALPHA: 0.3,           // Exponential Moving Average smoothing factor
    HYSTERESIS_MARGIN: 0.05,  // Margin for state transition hysteresis
    STATES: {
      NORMAL: 'NORMAL',       // Trust > 0.7
      WATCH: 'WATCH',         // 0.5 < Trust <= 0.7
      RESTRICT: 'RESTRICT',   // 0.3 < Trust <= 0.5
      REAUTH: 'REAUTH',       // Trust <= 0.3
    },
    THRESHOLDS: {
      NORMAL: 0.7,            // Threshold for NORMAL state
      WATCH: 0.5,             // Threshold for WATCH state
      RESTRICT: 0.3,          // Threshold for RESTRICT state
      REAUTH: 0.0,            // Threshold for REAUTH state
    },
  },
  
  // Enforcement Settings
  ENFORCEMENT: {
    WATCH: {
      BLUR_AMOUNT: 8,         // CSS blur filter amount (px)
      SHOW_WARNING: true,     // Show warning banner
    },
    RESTRICT: {
      BLUR_AMOUNT: 16,        // CSS blur filter amount (px)
      BLOCK_ACTIONS: [
        'submit',
        'download',
        'copy',
        'paste',
        'privileged-click',
      ],
    },
    REAUTH: {
      FULL_OVERLAY: true,     // Show full screen overlay
      BLUR_ALL: true,         // Blur all content
      BLOCK_ALL: true,        // Block all interactions
    },
    RECOVERY: {
      INITIAL_TRUST: 0.8,     // Trust score after successful reauth
      MONITORING_PERIOD: 15,  // Seconds to monitor after recovery
      STABLE_THRESHOLD: 0.7,  // Trust threshold for stable recovery
    },
  },
  
  // Tamper Detection
  TAMPER: {
    CAMERA_OFF_TIMEOUT: 5000,     // Time before camera off triggers restriction (ms)
    FACE_ABSENT_TIMEOUT: 5000,    // Time before face absent triggers watch (ms)
    MODEL_LOAD_TIMEOUT: 10000,    // Timeout for model loading (ms)
    REPEATED_ANOMALY_COUNT: 3,    // Number of anomalies before reauth
    ANOMALY_WINDOW: 30000,        // Time window for counting anomalies (ms)
  },
  
  // Storage & Encryption
  STORAGE: {
    DB_NAME: 'cbv_db',
    DB_VERSION: 1,
    STORES: {
      USERS: 'users',
      FACE_SAMPLES: 'face_samples',
      LIVENESS_SAMPLES: 'liveness_samples',
      BEHAVIOR_WINDOWS: 'behavior_windows',
      TEMPLATES: 'templates',
      LOGS: 'logs',
    },
    ENCRYPTION: {
      ALGORITHM: 'AES-GCM',
      KEY_LENGTH: 256,
      IV_LENGTH: 12,
      SALT_LENGTH: 16,
      PBKDF2_ITERATIONS: 100000,
    },
  },
  
  // Demo Credentials (Hardcoded)
  DEMO_CREDENTIALS: {
    USER_ID: 'Thiru',
    PASSWORD: 'thiru0509',
  },
  
  // Enrollment Settings
  ENROLLMENT: {
    STATUS: {
      NOT_STARTED: 'not_started',
      IN_PROGRESS: 'in_progress',
      COMPLETED: 'completed',
    },
    REQUIREMENTS: {
      MIN_FACE_SAMPLES: 50,
      MIN_LIVENESS_DURATION: 30,  // seconds (recommended)
      MIN_BEHAVIOR_DURATION: 0, // seconds (optional - 0 means not required)
    },
    SESSION_TIMEOUT: 1800000,  // 30 minutes
  },
  
  // Authentication Settings
  AUTH: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 300000,  // 5 minutes
    SESSION_TIMEOUT: 3600000,  // 1 hour
  },
  
  // Permission Settings
  PERMISSIONS: {
    OWNER_ONLY: ['update_template', 'export_data', 'purge_data', 'complete_enrollment'],
    VERIFICATION_ONLY: ['view_data', 'verify'],
  },
  
  // Camera Settings
  CAMERA: {
    WIDTH: 640,
    HEIGHT: 480,
    FRAME_RATE: 30,
    FACING_MODE: 'user',      // Front-facing camera
  },
  
  // Capture Settings (Phase 3)
  CAPTURE: {
    FACE: {
      FPS: 5,                     // Frames per second for face detection
      TARGET_SAMPLES: 50,         // Target number of face samples
      VIDEO_WIDTH: 640,
      VIDEO_HEIGHT: 480,
      AUTO_CAPTURE: true,         // Auto-capture when quality is good
      CAPTURE_INTERVAL: 200,      // ms between auto-captures
      QUALITY_CHECK_INTERVAL: 100, // ms between quality checks
    },
    LIVENESS: {
      FPS: 10,                    // Frames per second for liveness detection
      TARGET_DURATION: 30,        // Target duration in seconds
      LANDMARK_COUNT: 468,        // Number of facial landmarks
      EAR_HISTORY_SIZE: 10,       // Number of frames to keep for EAR calculation
      MIN_BLINKS: 3,              // Minimum blinks required
      MAX_BLINKS: 15,             // Maximum blinks expected
    },
    BEHAVIOR: {
      WINDOW_SIZE: 5000,          // 5 seconds per window
      TARGET_WINDOWS: 0,          // No window requirement - only time-based
      MAX_DURATION: 300,          // 5 minutes maximum duration (300 seconds)
      TARGET_DURATION: 300,       // Target duration is 5 minutes
      MIN_KEYSTROKES_PER_WINDOW: 5,
      MIN_MOUSE_EVENTS_PER_WINDOW: 10,
      TYPING_PROMPT: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.',
    },
    SESSION: {
      AUTO_SAVE_INTERVAL: 10000,  // 10 seconds
      TIMEOUT_WARNING: 1500000,   // 25 minutes (show warning)
      TIMEOUT: 1800000,           // 30 minutes (end session)
    },
    QUALITY: {
      FACE_POSITION_TOLERANCE: 0.15,  // 15% tolerance for face centering
      MIN_SAMPLES_FOR_QUALITY: 10,    // Minimum samples before quality assessment
    },
  },
  
  // Debug Panel
  DEBUG: {
    ENABLED: true,
    UPDATE_INTERVAL: 100,     // Update interval for debug panel (ms)
    LOG_RETENTION: 1000,      // Number of log entries to retain
  },
  
  // Model Paths
  MODELS: {
    BLAZEFACE: '@tensorflow-models/blazeface',
    FACEMESH: '@tensorflow-models/face-landmarks-detection',
    FACE_EMBEDDING: '/models/pretrained/mobilefacenet.onnx',
    BEHAVIOR: '/models/trained/behavior.onnx',
    LIVENESS: '/models/trained/liveness.onnx',
  },
  
  // Evaluation Scenarios
  SCENARIOS: {
    LEGITIMATE_USE: {
      name: 'Legitimate Use',
      duration: 60,
      description: 'Owner uses app normally',
      expectedState: 'NORMAL',
    },
    SHOULDER_SURF: {
      name: 'Shoulder Surf',
      duration: 30,
      description: 'Owner looks away',
      expectedState: 'WATCH',
    },
    HANDOVER: {
      name: 'Handover',
      duration: 30,
      description: 'Different person takes over',
      expectedState: 'REAUTH',
    },
    CAMERA_BLOCKED: {
      name: 'Camera Blocked',
      duration: 20,
      description: 'Camera is covered',
      expectedState: 'RESTRICT',
    },
    RECOVERY: {
      name: 'Recovery',
      duration: 30,
      description: 'Owner returns after handover',
      expectedState: 'NORMAL',
    },
  },
};

// Helper function to get state from trust score
export const getStateFromTrust = (trustScore) => {
  const { THRESHOLDS, STATES } = CONFIG.TRUST;
  
  if (trustScore > THRESHOLDS.NORMAL) return STATES.NORMAL;
  if (trustScore > THRESHOLDS.WATCH) return STATES.WATCH;
  if (trustScore > THRESHOLDS.RESTRICT) return STATES.RESTRICT;
  return STATES.REAUTH;
};

// Helper function to get state color
export const getStateColor = (state) => {
  const colors = {
    NORMAL: '#10b981',    // Green
    WATCH: '#f59e0b',     // Yellow
    RESTRICT: '#ef4444',  // Red
    REAUTH: '#dc2626',    // Dark Red
  };
  return colors[state] || '#6b7280';
};

// Helper function to validate configuration
export const validateConfig = () => {
  const errors = [];
  
  // Validate trust weights sum to 1
  const weightSum = Object.values(CONFIG.TRUST.WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    errors.push('Trust weights must sum to 1.0');
  }
  
  // Validate thresholds are in order
  const { THRESHOLDS } = CONFIG.TRUST;
  if (THRESHOLDS.NORMAL <= THRESHOLDS.WATCH || 
      THRESHOLDS.WATCH <= THRESHOLDS.RESTRICT) {
    errors.push('Trust thresholds must be in descending order');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export default CONFIG;
