# Phase 3 - Data Collection Session - Implementation Plan

## Goal
Capture high-quality enrollment data for face, liveness, and behavior in a controlled session.

## Overview
Phase 3 transforms the simulated progress from Phase 2 into real data collection using:
- Camera for face capture and liveness detection
- Keyboard/mouse event listeners for behavioral biometrics
- Quality checks and validation
- Real-time feedback to the user
- Storage in IndexedDB

---

## Information Gathered

### Current State (Phase 2)
- ✅ Enrollment session management working
- ✅ Progress tracking infrastructure in place
- ✅ Requirements validation system ready
- ✅ UI components for progress display
- ✅ Camera service exists but not integrated
- ✅ Storage service ready for data persistence
- ✅ Encryption service available

### Existing Services
1. **camera.service.js** - Camera initialization and frame capture
2. **storage.service.js** - IndexedDB operations
3. **encryption.service.js** - Data encryption
4. **auth.service.js** - Session and enrollment management

### Dependencies Available
- TensorFlow.js (4.15.0)
- BlazeFace model (face detection)
- FaceMesh model (landmarks for liveness)
- React 18.2.0
- IndexedDB (idb 8.0.0)

---

## Detailed Implementation Plan

### 1. Face Capture Module

#### 1.1 Face Detection Service
**File**: `app/src/services/face-detection.service.js`

**Responsibilities:**
- Load BlazeFace model
- Detect faces in video frames
- Extract face bounding boxes
- Validate face quality (size, position, confidence)
- Crop face regions from frames

**Key Methods:**
```javascript
- init() - Load BlazeFace model
- detectFace(videoElement) - Detect face in frame
- validateFaceQuality(detection, frame) - Check quality criteria
- cropFace(frame, detection) - Extract face region
- calculateFaceMetrics(detection) - Get size, position, angle
```

**Quality Checks:**
- Face confidence > 0.8
- Face size between 20-60% of frame
- Face centered (within bounds)
- Brightness check (50-200 range)
- Blur detection (Laplacian variance > 100)

#### 1.2 Face Capture Component
**File**: `app/src/components/capture/FaceCapture.jsx`

**UI Elements:**
- Video preview (640x480)
- Face detection overlay (bounding box)
- Quality indicators (checkmarks/warnings)
- Sample counter (0/50)
- Capture status messages
- Start/Stop buttons

**Capture Flow:**
1. Start camera
2. Display video preview
3. Detect face at 5 fps
4. Show quality feedback
5. Auto-capture when quality is good
6. Store face crops with metadata
7. Update progress in real-time
8. Stop when target reached (50 samples)

**User Prompts:**
- "Position your face in the frame"
- "Move closer" / "Move back"
- "Good lighting detected ✓"
- "Face detected ✓"
- "Capturing... 25/50"

---

### 2. Liveness Detection Module

#### 2.1 Liveness Detection Service
**File**: `app/src/services/liveness-detection.service.js`

**Responsibilities:**
- Load FaceMesh model
- Detect facial landmarks (468 points)
- Calculate Eye Aspect Ratio (EAR)
- Detect blinks
- Track micro-movements
- Validate liveness confidence

**Key Methods:**
```javascript
- init() - Load FaceMesh model
- detectLandmarks(videoElement) - Get 468 landmarks
- calculateEAR(landmarks) - Eye Aspect Ratio
- detectBlink(earHistory) - Blink detection
- calculateMotion(landmarkHistory) - Micro-movements
- validateLiveness(features) - Overall liveness score
```

**Liveness Features:**
- **Blink Detection**: EAR threshold 0.2, duration 100-400ms
- **Blink Frequency**: 10-30 blinks/minute
- **Micro-movements**: Head motion > 2 pixels
- **Sequence Length**: Minimum 30 frames (3 seconds at 10fps)

#### 2.2 Liveness Capture Component
**File**: `app/src/components/capture/LivenessCapture.jsx`

**UI Elements:**
- Video preview with landmark overlay
- Blink counter
- Motion indicator
- Duration timer (0/30s)
- Liveness confidence meter
- Instructions panel

**Capture Flow:**
1. Start camera
2. Detect landmarks at 10 fps
3. Calculate EAR continuously
4. Detect blinks
5. Track micro-movements
6. Store time-series features
7. Update duration counter
8. Stop when 30 seconds reached

**User Prompts:**
- "Look at the camera"
- "Blink naturally"
- "Move your head slightly"
- "Blink detected ✓"
- "Duration: 15/30 seconds"

---

### 3. Behavioral Biometrics Module

#### 3.1 Behavior Capture Service
**File**: `app/src/services/behavior-capture.service.js`

**Responsibilities:**
- Listen to keyboard events
- Listen to mouse events
- Calculate keystroke dynamics
- Calculate mouse dynamics
- Create behavior windows (5 seconds)
- Store feature vectors

**Key Methods:**
```javascript
- startCapture() - Start event listeners
- stopCapture() - Stop event listeners
- handleKeyDown(event) - Record key press
- handleKeyUp(event) - Record key release
- handleMouseMove(event) - Record mouse position
- handleMouseClick(event) - Record click
- calculateKeystrokeDynamics() - Dwell/flight times
- calculateMouseDynamics() - Velocity, curvature
- createBehaviorWindow() - 5-second feature window
```

**Keystroke Features:**
- Dwell time (key press duration)
- Flight time (time between keys)
- Key press pressure (if available)
- Typing rhythm patterns

**Mouse Features:**
- Velocity (pixels/second)
- Acceleration
- Curvature (direction changes)
- Click timing
- Idle periods
- Movement patterns

#### 3.2 Behavior Capture Component
**File**: `app/src/components/capture/BehaviorCapture.jsx`

**UI Elements:**
- Text input area for typing
- Mouse interaction canvas
- Keystroke counter
- Mouse movement visualizer
- Window counter (0/20)
- Activity indicators

**Capture Flow:**
1. Display typing prompt
2. Display mouse interaction area
3. Listen to keyboard events
4. Listen to mouse events
5. Calculate features continuously
6. Create 5-second windows
7. Store windows with features
8. Update window counter
9. Stop when 20 windows collected

**User Prompts:**
- "Type the following text naturally"
- "Move your mouse in circles"
- "Click the targets"
- "Windows collected: 10/20"
- "Keep typing naturally"

---

### 4. Integrated Capture Page

#### 4.1 Enhanced Capture Page
**File**: `app/src/pages/CapturePage.jsx` (major update)

**New Features:**
- Tab-based interface (Face / Liveness / Behavior)
- Real-time progress tracking
- Quality feedback
- Error handling
- Session management
- Data persistence

**Capture Modes:**
1. **Sequential Mode** (default):
   - Complete face → liveness → behavior in order
   - Guided experience
   - Recommended for first enrollment

2. **Parallel Mode** (advanced):
   - All modules running simultaneously
   - Faster completion
   - Requires user attention

**Session Management:**
- Auto-save progress every 10 seconds
- Resume capability after interruption
- Session timeout warning (30 minutes)
- Data validation before storage

---

### 5. Data Storage Schema

#### 5.1 Face Samples
```javascript
{
  id: auto-increment,
  userId: "Thiru",
  sessionId: "uuid",
  timestamp: Date.now(),
  dataUrl: "data:image/jpeg;base64,...",
  metadata: {
    confidence: 0.95,
    faceSize: 0.35,
    position: { x: 320, y: 240 },
    brightness: 120,
    sharpness: 150,
    angle: 5
  },
  encrypted: false
}
```

#### 5.2 Liveness Samples
```javascript
{
  id: auto-increment,
  userId: "Thiru",
  sessionId: "uuid",
  timestamp: Date.now(),
  features: {
    earSequence: [0.25, 0.24, 0.15, ...],
    blinkCount: 5,
    blinkTimestamps: [1000, 3500, ...],
    motionVectors: [{x: 1.2, y: 0.8}, ...],
    duration: 30,
    confidence: 0.85
  },
  encrypted: true
}
```

#### 5.3 Behavior Windows
```javascript
{
  id: auto-increment,
  userId: "Thiru",
  sessionId: "uuid",
  timestamp: Date.now(),
  windowDuration: 5000,
  features: {
    keystroke: {
      dwellTimes: [120, 95, 110, ...],
      flightTimes: [180, 200, 175, ...],
      keyCount: 25,
      rhythm: 0.75
    },
    mouse: {
      velocities: [150, 200, 180, ...],
      accelerations: [10, 15, 12, ...],
      curvatures: [0.5, 0.8, 0.6, ...],
      clickCount: 3,
      idleTime: 500,
      totalDistance: 1500
    }
  },
  encrypted: true
}
```

---

### 6. Quality Checks and Validation

#### 6.1 Face Quality Validator
**File**: `app/src/utils/quality-validator.js`

**Checks:**
- Face detection confidence
- Face size (not too small/large)
- Face position (centered)
- Lighting (brightness range)
- Blur (sharpness threshold)
- Face angle (frontal)

**Thresholds** (from CONFIG):
```javascript
MIN_CONFIDENCE: 0.8
MIN_FACE_SIZE: 0.2
MAX_FACE_SIZE: 0.6
MIN_BRIGHTNESS: 50
MAX_BRIGHTNESS: 200
MIN_SHARPNESS: 100
MAX_ANGLE: 15
```

#### 6.2 Liveness Quality Validator

**Checks:**
- Landmark detection success
- Blink detection (natural frequency)
- Micro-movement presence
- Sequence length (minimum 30 frames)
- Overall confidence score

#### 6.3 Behavior Quality Validator

**Checks:**
- Sufficient keystroke samples
- Natural typing rhythm
- Mouse movement patterns
- Window completeness
- Feature validity

---

### 7. User Feedback System

#### 7.1 Real-time Feedback Component
**File**: `app/src/components/capture/CaptureFeedback.jsx`

**Feedback Types:**
- ✅ Success (green)
- ⚠️ Warning (yellow)
- ❌ Error (red)
- ℹ️ Info (blue)

**Messages:**
- "Face detected ✓"
- "Move closer ⚠️"
- "Lighting too dark ❌"
- "Blink detected ✓"
- "Keep moving your mouse ℹ️"

#### 7.2 Progress Indicators

**Visual Elements:**
- Progress bars (animated)
- Sample counters
- Quality meters
- Time remaining
- Success checkmarks

---

### 8. Error Handling

#### 8.1 Camera Errors
- Camera not available
- Permission denied
- Camera in use by another app
- Camera disconnected during capture

**Recovery:**
- Show clear error message
- Provide retry button
- Suggest troubleshooting steps
- Save progress before retry

#### 8.2 Model Loading Errors
- TensorFlow.js load failure
- Model download failure
- Insufficient memory

**Recovery:**
- Show loading status
- Retry with exponential backoff
- Fallback to simpler models
- Clear error messages

#### 8.3 Storage Errors
- IndexedDB quota exceeded
- Storage permission denied
- Corruption detection

**Recovery:**
- Warn user before quota exceeded
- Offer to export and clear old data
- Validate data integrity
- Provide manual export option

---

## File Structure

```
app/src/
├── services/
│   ├── face-detection.service.js (NEW)
│   ├── liveness-detection.service.js (NEW)
│   ├── behavior-capture.service.js (NEW)
│   ├── camera.service.js (ENHANCE)
│   └── storage.service.js (ENHANCE)
├── components/
│   ├── capture/
│   │   ├── FaceCapture.jsx (NEW)
│   │   ├── FaceCapture.css (NEW)
│   │   ├── LivenessCapture.jsx (NEW)
│   │   ├── LivenessCapture.css (NEW)
│   │   ├── BehaviorCapture.jsx (NEW)
│   │   ├── BehaviorCapture.css (NEW)
│   │   ├── CaptureFeedback.jsx (NEW)
│   │   └── CaptureFeedback.css (NEW)
├── utils/
│   ├── quality-validator.js (NEW)
│   └── capture-helpers.js (NEW)
├── pages/
│   ├── CapturePage.jsx (MAJOR UPDATE)
│   └── CapturePage.css (UPDATE)
└── hooks/
    ├── useFaceCapture.js (NEW)
    ├── useLivenessCapture.js (NEW)
    └── useBehaviorCapture.js (NEW)
```

---

## Implementation Steps

### Step 1: Services Layer (Foundation)
1. Create face-detection.service.js
2. Create liveness-detection.service.js
3. Create behavior-capture.service.js
4. Enhance camera.service.js
5. Enhance storage.service.js

### Step 2: Utilities
1. Create quality-validator.js
2. Create capture-helpers.js

### Step 3: Custom Hooks
1. Create useFaceCapture.js
2. Create useLivenessCapture.js
3. Create useBehaviorCapture.js

### Step 4: Capture Components
1. Create FaceCapture.jsx + CSS
2. Create LivenessCapture.jsx + CSS
3. Create BehaviorCapture.jsx + CSS
4. Create CaptureFeedback.jsx + CSS

### Step 5: Integration
1. Update CapturePage.jsx with tabs
2. Integrate all capture modules
3. Add session management
4. Add error handling
5. Add progress persistence

### Step 6: Testing
1. Test face capture quality
2. Test liveness detection
3. Test behavior capture
4. Test data storage
5. Test error scenarios
6. Test session resume

---

## Dependencies

### Already Installed ✅
- @tensorflow/tfjs: ^4.15.0
- @tensorflow-models/blazeface: ^0.0.7
- @tensorflow-models/face-landmarks-detection: ^1.0.5
- idb: ^8.0.0
- uuid: ^9.0.1

### No New Dependencies Required ✅

---

## Configuration Updates

Add to `app/src/utils/config.js`:

```javascript
CAPTURE: {
  FACE: {
    FPS: 5,
    TARGET_SAMPLES: 50,
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    AUTO_CAPTURE: true,
    CAPTURE_INTERVAL: 200, // ms between auto-captures
  },
  LIVENESS: {
    FPS: 10,
    TARGET_DURATION: 30,
    LANDMARK_COUNT: 468,
    EAR_HISTORY_SIZE: 10,
  },
  BEHAVIOR: {
    WINDOW_SIZE: 5000, // 5 seconds
    TARGET_WINDOWS: 20,
    MIN_KEYSTROKES_PER_WINDOW: 5,
    MIN_MOUSE_EVENTS_PER_WINDOW: 10,
  },
  SESSION: {
    AUTO_SAVE_INTERVAL: 10000, // 10 seconds
    TIMEOUT_WARNING: 1500000, // 25 minutes
    TIMEOUT: 1800000, // 30 minutes
  },
}
```

---

## Success Criteria

### Face Capture ✓
- 50 high-quality face samples collected
- All quality checks passed
- Samples stored in IndexedDB
- Progress updated in real-time

### Liveness Detection ✓
- 30 seconds of landmark data collected
- Multiple blinks detected
- Micro-movements captured
- Liveness confidence > 0.6

### Behavior Capture ✓
- 20 behavior windows collected
- Keystroke dynamics captured
- Mouse dynamics captured
- Natural interaction patterns

### Overall ✓
- All data encrypted and stored
- Session can be resumed
- Error handling works
- User feedback is clear
- Progress persists across refreshes

---

## Testing Plan

### Unit Tests
- Face detection accuracy
- Liveness calculation correctness
- Behavior feature extraction
- Quality validation logic

### Integration Tests
- Camera → Detection → Storage flow
- Session management
- Progress tracking
- Error recovery

### User Acceptance Tests
- Complete enrollment flow
- Resume after interruption
- Handle camera errors
- Handle poor lighting
- Handle rapid movements

---

## Timeline Estimate

- **Services Layer**: 2-3 hours
- **Utilities & Hooks**: 1-2 hours
- **Capture Components**: 3-4 hours
- **Integration**: 2-3 hours
- **Testing & Debugging**: 2-3 hours
- **Total**: 10-15 hours

---

## Risk Mitigation

### Risk 1: Model Loading Slow
**Mitigation**: Show loading progress, cache models, use CDN

### Risk 2: Camera Quality Issues
**Mitigation**: Provide clear feedback, adjust thresholds, offer manual mode

### Risk 3: Storage Quota
**Mitigation**: Monitor usage, compress images, offer export

### Risk 4: Browser Compatibility
**Mitigation**: Feature detection, graceful degradation, clear requirements

---

## Phase 3 Deliverables

1. ✅ Face capture with quality validation
2. ✅ Liveness detection with blink/motion tracking
3. ✅ Behavioral biometrics collection
4. ✅ Real-time progress tracking
5. ✅ Data storage in IndexedDB
6. ✅ Session management and resume
7. ✅ Error handling and recovery
8. ✅ User feedback system
9. ✅ Quality validation
10. ✅ Complete enrollment flow

---

## Ready to Implement!

This plan provides a comprehensive roadmap for Phase 3. Implementation will be done incrementally, testing each component before moving to the next.

🚀 **Let's build Phase 3!**
