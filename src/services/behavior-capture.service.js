/**
 * CBV System - Behavior Capture Service
 * Handles keystroke and mouse dynamics capture
 */

import CONFIG from '@/utils/config';
import logger from '@/utils/logger';

class BehaviorCaptureService {
  constructor() {
    this.isCapturing = false;
    this.keystrokeEvents = [];
    this.mouseEvents = [];
    this.behaviorWindows = [];
    this.windowStartTime = null;
    this.lastKeyTime = null;
    this.lastMouseTime = null;
    this.currentWindow = null;
  }

  /**
   * Start behavior capture
   * @param {HTMLElement} targetElement - Element to attach listeners to
   */
  startCapture(targetElement = document) {
    if (this.isCapturing) {
      logger.warn('Behavior capture already running');
      return;
    }

    // Store the target element for cleanup
    this.targetElement = targetElement;

    this.isCapturing = true;
    this.windowStartTime = Date.now();
    this.currentWindow = this.createEmptyWindow();

    // Attach event listeners
    targetElement.addEventListener('keydown', this.handleKeyDown);
    targetElement.addEventListener('keyup', this.handleKeyUp);
    targetElement.addEventListener('mousemove', this.handleMouseMove);
    targetElement.addEventListener('mousedown', this.handleMouseDown);
    targetElement.addEventListener('mouseup', this.handleMouseUp);
    targetElement.addEventListener('click', this.handleClick);

    logger.info('Behavior capture started', { 
      target: targetElement === document ? 'document' : 'element' 
    });
  }

  /**
   * Stop behavior capture
   * @param {HTMLElement} targetElement - Element to remove listeners from
   */
  stopCapture(targetElement = null) {
    if (!this.isCapturing) {
      return;
    }

    this.isCapturing = false;

    // Use stored target element if not provided
    const element = targetElement || this.targetElement || document;

    // Remove event listeners
    element.removeEventListener('keydown', this.handleKeyDown);
    element.removeEventListener('keyup', this.handleKeyUp);
    element.removeEventListener('mousemove', this.handleMouseMove);
    element.removeEventListener('mousedown', this.handleMouseDown);
    element.removeEventListener('mouseup', this.handleMouseUp);
    element.removeEventListener('click', this.handleClick);

    // Finalize current window if exists
    if (this.currentWindow) {
      this.finalizeWindow();
    }

    // Clear target element reference
    this.targetElement = null;

    logger.info('Behavior capture stopped', { 
      windows: this.behaviorWindows.length 
    });
  }

  /**
   * Create empty behavior window
   */
  createEmptyWindow() {
    return {
      startTime: Date.now(),
      endTime: null,
      keystroke: {
        events: [],
        dwellTimes: [],
        flightTimes: [],
        keyCount: 0,
      },
      mouse: {
        events: [],
        positions: [],
        velocities: [],
        accelerations: [],
        curvatures: [],
        clickCount: 0,
        totalDistance: 0,
        idleTime: 0,
      },
    };
  }

  /**
   * Handle keydown event
   */
  handleKeyDown = (event) => {
    if (!this.isCapturing || !this.currentWindow) return;

    const timestamp = Date.now();
    const key = event.key;

    // Record keydown event
    this.keystrokeEvents.push({
      type: 'keydown',
      key,
      timestamp,
      code: event.code,
    });

    // Check if window should be finalized
    this.checkWindowCompletion();
  };

  /**
   * Handle keyup event
   */
  handleKeyUp = (event) => {
    if (!this.isCapturing || !this.currentWindow) return;

    const timestamp = Date.now();
    const key = event.key;

    // Find corresponding keydown event
    const keydownIndex = this.keystrokeEvents.findIndex(
      e => e.type === 'keydown' && e.key === key && !e.dwellTime
    );

    if (keydownIndex !== -1) {
      const keydownEvent = this.keystrokeEvents[keydownIndex];
      const dwellTime = timestamp - keydownEvent.timestamp;

      // Validate dwell time
      const { MIN_DWELL_TIME, MAX_DWELL_TIME } = CONFIG.BEHAVIOR.KEYSTROKE;
      if (dwellTime >= MIN_DWELL_TIME && dwellTime <= MAX_DWELL_TIME) {
        keydownEvent.dwellTime = dwellTime;
        this.currentWindow.keystroke.dwellTimes.push(dwellTime);

        // Calculate flight time (time between key releases)
        if (this.lastKeyTime) {
          const flightTime = keydownEvent.timestamp - this.lastKeyTime;
          const { MIN_FLIGHT_TIME, MAX_FLIGHT_TIME } = CONFIG.BEHAVIOR.KEYSTROKE;
          
          if (flightTime >= MIN_FLIGHT_TIME && flightTime <= MAX_FLIGHT_TIME) {
            this.currentWindow.keystroke.flightTimes.push(flightTime);
          }
        }

        this.lastKeyTime = timestamp;
        this.currentWindow.keystroke.keyCount++;
        this.currentWindow.keystroke.events.push({
          key,
          dwellTime,
          timestamp: keydownEvent.timestamp,
        });
      }
    }

    // Record keyup event
    this.keystrokeEvents.push({
      type: 'keyup',
      key,
      timestamp,
      code: event.code,
    });
  };

  /**
   * Handle mousemove event
   */
  handleMouseMove = (event) => {
    if (!this.isCapturing || !this.currentWindow) return;

    const timestamp = Date.now();
    const position = { x: event.clientX, y: event.clientY };

    // Add position to current window
    this.currentWindow.mouse.positions.push({
      ...position,
      timestamp,
    });

    // Calculate velocity and acceleration
    if (this.currentWindow.mouse.positions.length >= 2) {
      const prev = this.currentWindow.mouse.positions[this.currentWindow.mouse.positions.length - 2];
      const dt = (timestamp - prev.timestamp) / 1000; // Convert to seconds

      if (dt > 0) {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / dt;

        this.currentWindow.mouse.velocities.push(velocity);
        this.currentWindow.mouse.totalDistance += distance;

        // Calculate acceleration
        if (this.currentWindow.mouse.velocities.length >= 2) {
          const prevVelocity = this.currentWindow.mouse.velocities[this.currentWindow.mouse.velocities.length - 2];
          const acceleration = (velocity - prevVelocity) / dt;
          this.currentWindow.mouse.accelerations.push(acceleration);
        }

        // Calculate curvature (direction change)
        if (this.currentWindow.mouse.positions.length >= 3) {
          const curvature = this.calculateCurvature(
            this.currentWindow.mouse.positions.slice(-3)
          );
          this.currentWindow.mouse.curvatures.push(curvature);
        }
      }
    }

    this.lastMouseTime = timestamp;

    // Record mouse event
    this.mouseEvents.push({
      type: 'mousemove',
      ...position,
      timestamp,
    });

    // Check if window should be finalized
    this.checkWindowCompletion();
  };

  /**
   * Handle mousedown event
   */
  handleMouseDown = (event) => {
    if (!this.isCapturing || !this.currentWindow) return;

    const timestamp = Date.now();

    this.mouseEvents.push({
      type: 'mousedown',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp,
    });
  };

  /**
   * Handle mouseup event
   */
  handleMouseUp = (event) => {
    if (!this.isCapturing || !this.currentWindow) return;

    const timestamp = Date.now();

    this.mouseEvents.push({
      type: 'mouseup',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp,
    });
  };

  /**
   * Handle click event
   */
  handleClick = (event) => {
    if (!this.isCapturing || !this.currentWindow) return;

    const timestamp = Date.now();

    this.currentWindow.mouse.clickCount++;

    this.mouseEvents.push({
      type: 'click',
      x: event.clientX,
      y: event.clientY,
      button: event.button,
      timestamp,
    });
  };

  /**
   * Calculate curvature from three consecutive points
   */
  calculateCurvature(points) {
    if (points.length < 3) return 0;

    const [p1, p2, p3] = points;

    // Calculate vectors
    const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    // Calculate angle between vectors
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cosAngle = dot / (mag1 * mag2);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    return angle;
  }

  /**
   * Check if current window should be finalized
   */
  checkWindowCompletion() {
    if (!this.currentWindow) return;

    const elapsed = Date.now() - this.currentWindow.startTime;
    const { WINDOW_SIZE } = CONFIG.CAPTURE.BEHAVIOR;

    if (elapsed >= WINDOW_SIZE) {
      this.finalizeWindow();
      this.currentWindow = this.createEmptyWindow();
    }
  }

  /**
   * Finalize current behavior window
   */
  finalizeWindow() {
    if (!this.currentWindow) return;

    this.currentWindow.endTime = Date.now();
    const duration = this.currentWindow.endTime - this.currentWindow.startTime;

    // Calculate idle time
    if (this.lastMouseTime) {
      const timeSinceLastMove = this.currentWindow.endTime - this.lastMouseTime;
      if (timeSinceLastMove > CONFIG.BEHAVIOR.MOUSE.IDLE_THRESHOLD) {
        this.currentWindow.mouse.idleTime = timeSinceLastMove;
      }
    }

    // Validate window has sufficient data
    const { MIN_KEYSTROKES_PER_WINDOW, MIN_MOUSE_EVENTS_PER_WINDOW } = CONFIG.CAPTURE.BEHAVIOR;
    
    if (
      this.currentWindow.keystroke.keyCount >= MIN_KEYSTROKES_PER_WINDOW ||
      this.currentWindow.mouse.positions.length >= MIN_MOUSE_EVENTS_PER_WINDOW
    ) {
      // Calculate summary statistics
      const features = this.calculateWindowFeatures(this.currentWindow);

      this.behaviorWindows.push({
        ...this.currentWindow,
        duration,
        features,
      });

      logger.info('Behavior window finalized', {
        windowNumber: this.behaviorWindows.length,
        keystrokes: this.currentWindow.keystroke.keyCount,
        mouseEvents: this.currentWindow.mouse.positions.length,
      });
    } else {
      logger.debug('Window discarded - insufficient data', {
        keystrokes: this.currentWindow.keystroke.keyCount,
        mouseEvents: this.currentWindow.mouse.positions.length,
      });
    }
  }

  /**
   * Calculate feature statistics for a window
   */
  calculateWindowFeatures(window) {
    const features = {
      keystroke: {},
      mouse: {},
    };

    // Keystroke features
    if (window.keystroke.dwellTimes.length > 0) {
      features.keystroke = {
        avgDwellTime: this.average(window.keystroke.dwellTimes),
        stdDwellTime: this.standardDeviation(window.keystroke.dwellTimes),
        avgFlightTime: this.average(window.keystroke.flightTimes),
        stdFlightTime: this.standardDeviation(window.keystroke.flightTimes),
        keyCount: window.keystroke.keyCount,
        rhythm: this.calculateTypingRhythm(window.keystroke.events),
      };
    }

    // Mouse features
    if (window.mouse.velocities.length > 0) {
      features.mouse = {
        avgVelocity: this.average(window.mouse.velocities),
        stdVelocity: this.standardDeviation(window.mouse.velocities),
        maxVelocity: Math.max(...window.mouse.velocities),
        avgAcceleration: this.average(window.mouse.accelerations),
        avgCurvature: this.average(window.mouse.curvatures),
        clickCount: window.mouse.clickCount,
        totalDistance: window.mouse.totalDistance,
        idleTime: window.mouse.idleTime,
      };
    }

    return features;
  }

  /**
   * Calculate typing rhythm (consistency)
   */
  calculateTypingRhythm(events) {
    if (events.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].timestamp - events[i - 1].timestamp);
    }

    const avgInterval = this.average(intervals);
    const stdInterval = this.standardDeviation(intervals);

    // Rhythm score: lower std deviation = more consistent = higher score
    return avgInterval > 0 ? 1 - Math.min(1, stdInterval / avgInterval) : 0;
  }

  /**
   * Calculate average of array
   */
  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Calculate standard deviation of array
   */
  standardDeviation(arr) {
    if (arr.length === 0) return 0;
    const avg = this.average(arr);
    const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  /**
   * Get all behavior windows
   */
  getBehaviorWindows() {
    return this.behaviorWindows;
  }

  /**
   * Get current behavior window
   */
  getCurrentWindow() {
    if (!this.currentWindow) {
      return null;
    }

    // Return current window with features
    const features = this.calculateWindowFeatures(this.currentWindow);
    
    return {
      ...this.currentWindow,
      features,
    };
  }

  /**
   * Get window count
   */
  getWindowCount() {
    return this.behaviorWindows.length;
  }

  /**
   * Reset capture state
   */
  reset() {
    this.keystrokeEvents = [];
    this.mouseEvents = [];
    this.behaviorWindows = [];
    this.windowStartTime = null;
    this.lastKeyTime = null;
    this.lastMouseTime = null;
    this.currentWindow = null;
    logger.info('Behavior capture state reset');
  }
}

// Create singleton instance
const behaviorCaptureService = new BehaviorCaptureService();

export default behaviorCaptureService;
