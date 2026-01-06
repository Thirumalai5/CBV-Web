# Camera Separation Implementation

## Overview

Separated camera services into two distinct instances to prevent conflicts between the enrollment/capture phase and the continuous verification phase.

---

## Problem Statement

Previously, the CBV System used a single `camera.service.js` singleton for both:
1. **Capture Phase** (enrollment): Face, liveness, and behavior data collection
2. **Verification Phase** (runtime): Continuous biometric verification

This caused several issues:
- Camera conflicts when transitioning between phases
- Shared state causing unexpected behavior
- Difficulty managing camera lifecycle independently
- Risk of one phase interfering with another

---

## Solution: Separate Camera Services

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Camera Services                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────┐  ┌─────────────────────────┐ │
│  │  capture-camera.service  │  │ verification-camera     │ │
│  │                          │  │      .service           │ │
│  │  - Enrollment phase      │  │  - Runtime phase        │ │
│  │  - Face capture          │  │  - Continuous verify    │ │
│  │  - Liveness capture      │  │  - Trust monitoring     │ │
│  │  - High quality samples  │  │  - Lower overhead       │ │
│  │  - User-initiated        │  │  - Background process   │ │
│  │  - Stops after capture   │  │  - Always running       │ │
│  └──────────────────────────┘  └─────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Capture Camera Service

**File**: `app/src/services/capture-camera.service.js`

**Purpose**: Dedicated camera for enrollment/capture phase

**Features**:
- High-quality capture settings
- User-initiated start
- Stops when capture complete
- Optimized for quality over performance
- Clear logging with `[CAPTURE]` prefix

**Usage**:
```javascript
import captureCameraService from '@/services/capture-camera.service';

// Start camera for capture
await captureCameraService.start(videoElement);

// Capture frame
const frame = captureCameraService.captureFrame();

// Stop when done
captureCameraService.stop();
```

**Used By**:
- `useFaceCapture.js` - Face sample collection
- `useLivenessCapture.js` - Liveness detection
- `FaceCapture.jsx` - Face capture UI
- `LivenessCapture.jsx` - Liveness capture UI

### 2. Verification Camera Service

**File**: `app/src/services/verification-camera.service.js`

**Purpose**: Dedicated camera for continuous verification phase

**Features**:
- Optimized for continuous operation
- Lower overhead for background processing
- Pause/resume capability
- Always-on during protected session
- Clear logging with `[VERIFICATION]` prefix

**Usage**:
```javascript
import verificationCameraService from '@/services/verification-camera.service';

// Start camera for verification
await verificationCameraService.start(videoElement);

// Continuous frame capture
setInterval(() => {
  const frame = verificationCameraService.captureFrame();
  // Process for verification
}, 1000);

// Pause (keep stream, stop processing)
verificationCameraService.pause();

// Resume
verificationCameraService.resume();

// Stop when leaving protected area
verificationCameraService.stop();
```

**Used By** (Future):
- `useVerification.js` - Continuous verification hook
- `ProtectedApp.jsx` - Protected content page
- `VerificationOverlay.jsx` - Runtime verification UI

### 3. Legacy Camera Service

**File**: `app/src/services/camera.service.js`

**Status**: Kept for backward compatibility, points to verification service

**Purpose**: Provides smooth migration path

---

## Key Differences

| Feature | Capture Camera | Verification Camera |
|---------|---------------|---------------------|
| **Purpose** | Enrollment | Runtime verification |
| **Lifecycle** | Short-lived | Long-lived |
| **Quality** | High (enrollment) | Balanced (continuous) |
| **User Control** | User-initiated | Background |
| **Performance** | Quality-focused | Performance-focused |
| **Logging Prefix** | `[CAPTURE]` | `[VERIFICATION]` |
| **Stop Behavior** | Stops completely | Can pause/resume |

---

## Benefits

### 1. **No Conflicts**
- Each phase has its own camera instance
- No shared state between phases
- Independent lifecycle management

### 2. **Clear Separation of Concerns**
- Capture: High-quality enrollment
- Verification: Continuous monitoring
- Each optimized for its purpose

### 3. **Better Resource Management**
- Capture camera stops when not needed
- Verification camera runs only during protected sessions
- No unnecessary camera usage

### 4. **Easier Debugging**
- Clear logging prefixes (`[CAPTURE]` vs `[VERIFICATION]`)
- Independent error handling
- Isolated state management

### 5. **Future Flexibility**
- Can optimize each service independently
- Different constraints for different purposes
- Easy to add phase-specific features

---

## Migration Guide

### For Capture Phase Components

**Before**:
```javascript
import cameraService from '@/services/camera.service';

await cameraService.start(videoElement);
```

**After**:
```javascript
import captureCameraService from '@/services/capture-camera.service';

await captureCameraService.start(videoElement);
```

### For Verification Phase Components

**Before**:
```javascript
import cameraService from '@/services/camera.service';

await cameraService.start(videoElement);
```

**After**:
```javascript
import verificationCameraService from '@/services/verification-camera.service';

await verificationCameraService.start(videoElement);
```

---

## Files Modified

### New Files Created
1. `app/src/services/capture-camera.service.js` - Capture camera service
2. `app/src/services/verification-camera.service.js` - Verification camera service

### Files Updated
1. `app/src/hooks/useFaceCapture.js` - Uses `captureCameraService`
2. `app/src/hooks/useLivenessCapture.js` - Uses `captureCameraService`

### Files Unchanged
1. `app/src/services/camera.service.js` - Kept for backward compatibility
2. `app/src/hooks/useBehaviorCapture.js` - Doesn't use camera

---

## Testing Checklist

### Capture Phase
- [ ] Face capture starts camera correctly
- [ ] Face capture stops camera when complete
- [ ] Liveness capture uses same camera instance
- [ ] No camera conflicts between face and liveness
- [ ] Camera stops when leaving capture page
- [ ] Console shows `[CAPTURE]` logs

### Verification Phase (Future)
- [ ] Verification camera starts on protected page
- [ ] Verification runs continuously
- [ ] Can pause/resume verification
- [ ] Camera stops when leaving protected page
- [ ] Console shows `[VERIFICATION]` logs

### Transition Between Phases
- [ ] Capture camera stops before verification starts
- [ ] No "camera in use" errors
- [ ] Smooth transition between phases
- [ ] No memory leaks

---

## Console Log Examples

### Capture Phase
```
[CAPTURE] Capture camera service initialized
[CAPTURE] Requesting camera access for enrollment...
[CAPTURE] Camera started successfully { instanceId: 'capture', width: 640, height: 480 }
[CAPTURE] Camera stopped
```

### Verification Phase
```
[VERIFICATION] Verification camera service initialized
[VERIFICATION] Requesting camera access for continuous verification...
[VERIFICATION] Camera started successfully { instanceId: 'verification', width: 640, height: 480 }
[VERIFICATION] Camera paused (stream active, processing stopped)
[VERIFICATION] Camera resumed
[VERIFICATION] Camera stopped
```

---

## Future Enhancements

### Capture Camera
- [ ] Add quality presets (high, medium, low)
- [ ] Support multiple camera selection
- [ ] Add flash/lighting control
- [ ] Implement zoom controls

### Verification Camera
- [ ] Implement adaptive frame rate based on CPU usage
- [ ] Add power-saving mode
- [ ] Implement smart pause (pause when user idle)
- [ ] Add privacy mode (blur video feed)

---

## Best Practices

### 1. Always Use Correct Service
```javascript
// ✅ GOOD - Capture phase
import captureCameraService from '@/services/capture-camera.service';

// ✅ GOOD - Verification phase
import verificationCameraService from '@/services/verification-camera.service';

// ❌ BAD - Don't use generic service
import cameraService from '@/services/camera.service';
```

### 2. Stop Camera When Done
```javascript
// ✅ GOOD - Clean up
useEffect(() => {
  return () => {
    if (captureCameraService.isRunning()) {
      captureCameraService.stop();
    }
  };
}, []);
```

### 3. Check Running State
```javascript
// ✅ GOOD - Prevent duplicate starts
if (!captureCameraService.isRunning()) {
  await captureCameraService.start(videoElement);
}
```

### 4. Handle Errors Gracefully
```javascript
// ✅ GOOD - User-friendly errors
try {
  await captureCameraService.start(videoElement);
} catch (error) {
  if (error.message.includes('permission denied')) {
    showPermissionDialog();
  }
}
```

---

## Summary

✅ **Separated camera services** into capture and verification instances  
✅ **No conflicts** between enrollment and runtime phases  
✅ **Clear logging** with prefixes for easy debugging  
✅ **Independent lifecycle** management for each phase  
✅ **Backward compatible** with legacy camera service  
✅ **Future-ready** for continuous verification implementation  

**Status**: ✅ **IMPLEMENTED**  
**Testing**: ⏳ **Ready for verification**  
**Documentation**: ✅ **Complete**
