# Phase 6 — Continuous Verification Runtime Loop

## Goal
Run CBV in the background continuously and produce stable trust decisions based on face recognition, liveness detection, and behavioral biometrics.

## Overview

Phase 6 implements the core continuous verification system that:
1. Runs a background monitoring loop (2-5 Hz)
2. Captures and verifies biometric data continuously
3. Fuses multiple scores into a trust score
4. Maps trust scores to security states
5. Handles failures and tampering gracefully

## Current Status Assessment

### ✅ Already Available (from previous phases)
1. **Face Detection**: BlazeFace model (Phase 3)
2. **Liveness Detection**: EAR + blink detection (Phase 3)
3. **Behavior Capture**: Keystroke + mouse tracking (Phase 3)
4. **Templates**: Face template + behavior baseline (Phase 5)
5. **Verification Services**: Face matcher + behavior verifier (Phase 5)
6. **Storage**: IndexedDB with encryption (Phase 4)

### 🔍 What Needs to Be Done

## Tasks

### 1. Verification Service 🔄
**Status**: Not implemented

**Requirements**:
- Background loop running at 2-5 Hz
- Capture current frame + behavior window
- Compute face similarity score
- Compute liveness confidence
- Compute behavior acceptance score
- Handle camera/model failures gracefully

**Action Required**:
- Create `app/src/services/verification.service.js`
- Implement continuous monitoring loop
- Integrate all verification components
- Add error handling and recovery

### 2. Trust Score Fusion 📊
**Status**: Not implemented

**Requirements**:
- Normalize scores from different modalities
- Apply weighted fusion (Face: 50%, Liveness: 20%, Behavior: 30%)
- Apply smoothing (Exponential Moving Average)
- Apply hysteresis to prevent oscillation
- Map to states: NORMAL/WATCH/RESTRICT/REAUTH

**Action Required**:
- Create `app/src/services/trust-score.service.js`
- Implement score normalization
- Implement weighted fusion
- Implement EMA smoothing
- Implement state machine with hysteresis

### 3. State Machine 🎯
**Status**: Not implemented

**Requirements**:
- Four states: NORMAL, WATCH, RESTRICT, REAUTH
- State transitions based on trust score
- Hysteresis to prevent rapid switching
- Timeout mechanisms
- Recovery paths

**Action Required**:
- Create `app/src/services/state-machine.service.js`
- Define state transition rules
- Implement hysteresis logic
- Add timeout handling
- Add recovery mechanisms

### 4. Tamper/Failure Handling ⚠️
**Status**: Not implemented

**Requirements**:
- Detect camera off/blocked
- Detect face not detected
- Detect model load failure
- Conservative downgrade on failure
- Automatic recovery when conditions improve

**Action Required**:
- Add failure detection in verification service
- Implement conservative downgrade logic
- Add automatic recovery
- Log all failures

### 5. Verification Context 🔌
**Status**: Not implemented

**Requirements**:
- React context for verification state
- Global access to trust score
- Global access to current state
- Event notifications
- Start/stop verification

**Action Required**:
- Create `app/src/context/VerificationContext.jsx`
- Provide verification state globally
- Add event system
- Add control methods

### 6. Integration with Protected App 🛡️
**Status**: Not implemented

**Requirements**:
- Start verification on Protected App page
- Display trust score and state
- Update UI based on state
- Stop verification on page exit

**Action Required**:
- Update `app/src/pages/ProtectedAppPage.jsx`
- Add verification initialization
- Add trust score display
- Add state indicator
- Add cleanup on unmount

## Implementation Plan

### Step 1: Create Verification Service

**New File**: `app/src/services/verification.service.js`

**Features**:
- Background loop (2-5 Hz configurable)
- Face frame capture and matching
- Liveness detection
- Behavior window verification
- Score collection
- Error handling

**Key Methods**:
```javascript
class VerificationService {
  async start(userId)
  stop()
  getCurrentScores()
  getStatus()
  isRunning()
}
```

### Step 2: Create Trust Score Service

**New File**: `app/src/services/trust-score.service.js`

**Features**:
- Score normalization (0-1 range)
- Weighted fusion
- EMA smoothing (configurable alpha)
- Hysteresis for state mapping
- State transition logic

**Key Methods**:
```javascript
class TrustScoreService {
  updateScores(faceScore, livenessScore, behaviorScore)
  getTrustScore()
  getCurrentState()
  getStateHistory()
  reset()
}
```

### Step 3: Create State Machine Service

**New File**: `app/src/services/state-machine.service.js`

**Features**:
- Four states: NORMAL, WATCH, RESTRICT, REAUTH
- Transition rules with hysteresis
- Timeout mechanisms
- State history
- Event emission

**State Definitions**:
```javascript
STATES = {
  NORMAL: {
    threshold: 0.7,
    description: 'Full access',
    color: 'green'
  },
  WATCH: {
    threshold: 0.5,
    description: 'Monitoring closely',
    color: 'yellow'
  },
  RESTRICT: {
    threshold: 0.3,
    description: 'Limited access',
    color: 'orange'
  },
  REAUTH: {
    threshold: 0.0,
    description: 'Re-authentication required',
    color: 'red'
  }
}
```

### Step 4: Create Verification Context

**New File**: `app/src/context/VerificationContext.jsx`

**Features**:
- Global verification state
- Trust score access
- Current state access
- Event subscriptions
- Control methods

**Context API**:
```javascript
const {
  isVerifying,
  trustScore,
  currentState,
  scores,
  startVerification,
  stopVerification,
  subscribe,
  unsubscribe
} = useVerification();
```

### Step 5: Update Protected App Page

**Modified File**: `app/src/pages/ProtectedAppPage.jsx`

**Changes**:
- Initialize verification on mount
- Display trust score indicator
- Display current state
- Show verification status
- Cleanup on unmount

**UI Components**:
- Trust score gauge
- State indicator badge
- Verification status icon
- Score breakdown (optional)

### Step 6: Create Verification UI Components

**New Files**:
- `app/src/components/verification/TrustScoreGauge.jsx`
- `app/src/components/verification/StateIndicator.jsx`
- `app/src/components/verification/VerificationStatus.jsx`

**Features**:
- Visual trust score display
- Color-coded state indicator
- Real-time updates
- Smooth animations

## Done Means

Phase 6 is complete when:
- ✅ Verification service runs continuously in background
- ✅ Trust score updates smoothly (2-5 Hz)
- ✅ State transitions work correctly with hysteresis
- ✅ Failures handled gracefully (camera off, face not detected)
- ✅ Protected App page shows verification status
- ✅ Trust score and state displayed in UI
- ✅ Verification starts/stops correctly
- ✅ No performance issues or memory leaks

## Technical Specifications

### Verification Loop Timing
```javascript
VERIFICATION_CONFIG = {
  LOOP_FREQUENCY: 2,          // Hz (2-5 recommended)
  FACE_CHECK_INTERVAL: 500,   // ms (2 Hz)
  BEHAVIOR_WINDOW: 3000,      // ms (3 seconds)
  LIVENESS_CHECK_INTERVAL: 1000, // ms (1 Hz)
}
```

### Trust Score Fusion
```javascript
TRUST_WEIGHTS = {
  FACE: 0.5,        // 50% weight
  LIVENESS: 0.2,    // 20% weight
  BEHAVIOR: 0.3,    // 30% weight
}

SMOOTHING = {
  ALPHA: 0.3,       // EMA smoothing factor
}
```

### State Thresholds
```javascript
STATE_THRESHOLDS = {
  NORMAL: 0.7,      // >= 0.7 = NORMAL
  WATCH: 0.5,       // >= 0.5 = WATCH
  RESTRICT: 0.3,    // >= 0.3 = RESTRICT
  REAUTH: 0.0,      // < 0.3 = REAUTH
}

HYSTERESIS = {
  MARGIN: 0.05,     // 5% hysteresis margin
  MIN_DURATION: 2000, // 2 seconds minimum state duration
}
```

### Failure Handling
```javascript
FAILURE_POLICIES = {
  CAMERA_OFF: 'RESTRICT',           // Downgrade to RESTRICT
  FACE_NOT_DETECTED: 'WATCH',       // Downgrade to WATCH
  MODEL_FAILURE: 'RESTRICT',        // Downgrade to RESTRICT
  RECOVERY_THRESHOLD: 0.7,          // Trust score for recovery
  RECOVERY_DURATION: 5000,          // 5 seconds stable for recovery
}
```

## Architecture

### Service Layer
```
verification.service.js
├── Captures biometric data
├── Calls verification services
├── Collects scores
└── Emits events

trust-score.service.js
├── Normalizes scores
├── Applies fusion weights
├── Applies EMA smoothing
└── Maps to states

state-machine.service.js
├── Manages current state
├── Handles transitions
├── Applies hysteresis
└── Emits state changes
```

### Context Layer
```
VerificationContext
├── Wraps verification services
├── Provides global state
├── Handles subscriptions
└── Manages lifecycle
```

### UI Layer
```
ProtectedAppPage
├── Initializes verification
├── Displays trust score
├── Shows current state
└── Handles cleanup

Verification Components
├── TrustScoreGauge
├── StateIndicator
└── VerificationStatus
```

## Testing Strategy

### Unit Tests
- Trust score calculation
- State transitions
- Hysteresis logic
- Score normalization
- EMA smoothing

### Integration Tests
- Verification loop
- Service integration
- Context updates
- UI updates

### Scenario Tests
1. **Normal Use**: Owner using system normally
2. **Shoulder Surf**: Someone looking over shoulder
3. **Handover**: Device handed to another person
4. **Camera Blocked**: Camera covered or turned off
5. **Face Not Detected**: User moves away from camera
6. **Recovery**: Owner returns after anomaly

## Performance Considerations

### CPU Usage
- Target: < 10% CPU usage
- Optimize frame capture
- Throttle verification checks
- Use Web Workers if needed

### Memory Usage
- Target: < 50MB additional memory
- Limit history buffers
- Clean up old data
- Avoid memory leaks

### Battery Impact
- Target: < 5% additional battery drain
- Optimize loop frequency
- Reduce unnecessary computations
- Pause when page not visible

## Error Handling

### Graceful Degradation
1. **Camera Failure**: Rely on behavior only
2. **Model Failure**: Use fallback heuristics
3. **Storage Failure**: Continue without logging
4. **Network Failure**: N/A (local only)

### Recovery Mechanisms
1. **Automatic Retry**: Retry failed operations
2. **State Recovery**: Return to NORMAL when conditions improve
3. **User Notification**: Inform user of issues
4. **Fallback Mode**: Minimal verification if needed

## Timeline Estimate

- **Step 1** (Verification Service): 4-5 hours
- **Step 2** (Trust Score Service): 3-4 hours
- **Step 3** (State Machine): 3-4 hours
- **Step 4** (Verification Context): 2-3 hours
- **Step 5** (Protected App Integration): 2-3 hours
- **Step 6** (UI Components): 2-3 hours
- **Testing & Debugging**: 3-4 hours

**Total**: 19-26 hours

## Priority Order

1. **High Priority**: Verification service (core functionality)
2. **High Priority**: Trust score service (score fusion)
3. **High Priority**: State machine (state management)
4. **Medium Priority**: Verification context (global state)
5. **Medium Priority**: Protected App integration (UI)
6. **Low Priority**: UI components (polish)

## Dependencies

### Existing Services (Phase 5)
- `template-loader.service.js` - Load templates
- `face-matcher.service.js` - Face matching
- `behavior-verifier.service.js` - Behavior verification
- `liveness-detection.service.js` - Liveness detection (Phase 3)
- `camera.service.js` - Camera access (Phase 0)

### Existing Components
- `DebugPanel.jsx` - Can show verification metrics
- `ProtectedAppPage.jsx` - Will host verification

### Configuration
- `config.js` - Already has trust weights and thresholds

## Next Steps After Phase 6

### Phase 7 (Enforcement and Recovery)
- Implement UI blurring/redaction
- Block sensitive actions
- Require re-authentication
- Gradual recovery

---

**Status**: Ready to begin Phase 6 implementation  
**Prerequisites**: Phase 5 complete (templates and verification services ready)  
**Estimated Duration**: 19-26 hours
