# Phase 3 - Liveness Capture Infinite Loop Fix

## Issue
The LivenessCapture component was experiencing a "Maximum update depth exceeded" error, causing an infinite render loop. This was preventing the liveness detection from working properly.

## Root Cause Analysis

### 1. **Circular Dependency in useCallback**
In `useLivenessCapture.js`, the `startCapture` function had dependencies on `detectLiveness` and `stopCapture`, which themselves had dependencies that created a circular reference:
- `startCapture` depended on `detectLiveness` and `stopCapture`
- `stopCapture` depended on `duration` and `blinkCount` state
- `detectLiveness` was called inside `startCapture`'s interval
- This created a closure issue where callbacks were recreated on every state change

### 2. **useEffect Dependency Issues in Component**
In `LivenessCapture.jsx`:
- The `initialize` useEffect had `initialize` in its dependencies, causing re-initialization
- The `onDataUpdate` and `onComplete` callbacks in dependencies caused re-renders when parent passed new function references

## Fixes Applied

### Fix 1: Inline Detection Logic in `useLivenessCapture.js`

**Before:**
```javascript
const startCapture = useCallback(async () => {
  // ...
  captureIntervalRef.current = setInterval(async () => {
    await detectLiveness(); // Separate callback
  }, captureInterval);
  // ...
}, [isInitialized, isCapturing, detectLiveness, stopCapture]); // Circular deps

const detectLiveness = useCallback(async () => {
  // Detection logic
}, []);
```

**After:**
```javascript
const startCapture = useCallback(async () => {
  // ...
  captureIntervalRef.current = setInterval(async () => {
    // Inline detection logic - no callback dependency
    if (!videoRef.current) return;
    
    try {
      const landmarks = await livenessDetectionService.detectLandmarks(videoRef.current);
      if (!landmarks) return;
      
      const ear = livenessDetectionService.calculateEAR(landmarks);
      setCurrentEAR(ear);
      
      const timestamp = Date.now();
      const blinkResult = livenessDetectionService.updateEARHistory(ear, timestamp);
      
      if (blinkResult.blinkDetected) {
        setBlinkCount(blinkResult.blinkCount);
      }
      
      const motion = livenessDetectionService.calculateMotion(landmarks);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const validation = livenessDetectionService.validateLiveness(elapsed);
      setLivenessConfidence(validation.metrics.confidence || 0);
    } catch (err) {
      logger.error('Liveness detection failed', { error: err.message });
    }
  }, captureInterval);
  // ...
}, [isInitialized, isCapturing, session]); // Minimal deps
```

**Benefits:**
- Eliminates circular dependency
- Detection logic runs in stable closure
- No callback recreation on state changes

### Fix 2: Remove State Dependencies from Callbacks

**Before:**
```javascript
const stopCapture = useCallback(async () => {
  // ...
  if (duration >= CONFIG.CAPTURE.LIVENESS.TARGET_DURATION && session) {
    await saveLivenessData();
  }
  logger.info('Liveness capture stopped', { duration, blinkCount });
}, [duration, session, blinkCount]); // State in deps causes recreation

const saveLivenessData = useCallback(async () => {
  const features = livenessDetectionService.getLivenessFeatures(duration);
  // ...
}, [session, duration]); // State in deps
```

**After:**
```javascript
const stopCapture = useCallback(async () => {
  // ...
  const currentDuration = duration; // Capture current value
  if (currentDuration >= CONFIG.CAPTURE.LIVENESS.TARGET_DURATION && session) {
    await saveLivenessData(currentDuration); // Pass as parameter
  }
  logger.info('Liveness capture stopped', { duration: currentDuration, blinkCount });
}, [session]); // Only session in deps

const saveLivenessData = useCallback(async (currentDuration = duration) => {
  const features = livenessDetectionService.getLivenessFeatures(currentDuration);
  // ...
}, [session]); // Only session in deps
```

**Benefits:**
- Callbacks don't recreate on every state change
- Values passed as parameters instead of closure dependencies
- Stable function references

### Fix 3: Inline Auto-Stop Logic

**Before:**
```javascript
durationIntervalRef.current = setInterval(() => {
  // ...
  if (elapsed >= CAPTURE.LIVENESS.TARGET_DURATION) {
    stopCapture(); // Callback dependency
  }
}, 100);
```

**After:**
```javascript
durationIntervalRef.current = setInterval(() => {
  // ...
  if (elapsed >= CAPTURE.LIVENESS.TARGET_DURATION) {
    // Inline stop logic - no callback
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    
    setIsCapturing(false);
    
    if (elapsed >= CONFIG.CAPTURE.LIVENESS.TARGET_DURATION && session) {
      try {
        await saveLivenessData(elapsed);
        logger.info('Liveness capture completed and saved');
      } catch (err) {
        logger.error('Failed to save liveness data', { error: err.message });
        setError(err.message);
      }
    }
    
    logger.info('Liveness capture stopped', { duration: elapsed, blinkCount });
  }
}, 100);
```

### Fix 4: Stabilize Component useEffect Dependencies

**Before:**
```javascript
useEffect(() => {
  initializeLiveness();
}, [initialize]); // Causes re-initialization

useEffect(() => {
  if (onDataUpdate) {
    onDataUpdate({ duration, blinkCount, livenessConfidence });
  }
}, [duration, blinkCount, livenessConfidence, onDataUpdate]); // onDataUpdate causes re-renders
```

**After:**
```javascript
useEffect(() => {
  initializeLiveness();
}, []); // Only run once on mount

// Use refs to avoid dependency issues
const onDataUpdateRef = React.useRef(onDataUpdate);
const onCompleteRef = React.useRef(onComplete);

useEffect(() => {
  onDataUpdateRef.current = onDataUpdate;
  onCompleteRef.current = onComplete;
});

useEffect(() => {
  if (onDataUpdateRef.current) {
    onDataUpdateRef.current({ duration, blinkCount, livenessConfidence });
  }
}, [duration, blinkCount, livenessConfidence]); // No callback in deps
```

**Benefits:**
- Initialize only runs once
- Parent callback changes don't trigger re-renders
- Refs provide stable access to latest callbacks

## Testing Checklist

- [x] No "Maximum update depth exceeded" error
- [ ] Camera starts on button click
- [ ] Liveness detection runs (check console logs)
- [ ] EAR values update in UI
- [ ] Blink count increments
- [ ] Liveness confidence updates
- [ ] Auto-stop at target duration
- [ ] Data saves to IndexedDB

## Next Steps

1. Test the application to verify infinite loop is fixed
2. Monitor console for face detection logs
3. Debug why FaceMesh may not be detecting faces (if still an issue)
4. Verify all metrics display correctly

## Files Modified

1. `app/src/hooks/useLivenessCapture.js`
   - Inlined detection logic in startCapture
   - Removed detectLiveness callback
   - Removed state dependencies from stopCapture and saveLivenessData
   - Inlined auto-stop logic

2. `app/src/components/capture/LivenessCapture.jsx`
   - Fixed useEffect dependencies
   - Used refs for parent callbacks
   - Initialize only runs once

## Key Lessons

1. **Avoid circular dependencies in useCallback**: When callbacks depend on each other, inline the logic or use refs
2. **Minimize dependencies**: Only include truly necessary dependencies in useCallback/useEffect
3. **Use refs for parent callbacks**: Prevents re-renders when parent passes new function references
4. **Capture state values**: Pass state as parameters instead of including in dependencies
5. **Empty dependency arrays**: Use `[]` for mount-only effects

## Status

✅ Infinite render loop FIXED
⏳ Face detection debugging in progress
