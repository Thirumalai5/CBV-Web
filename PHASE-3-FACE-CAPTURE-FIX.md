eness# Phase 3 - Face Capture Fix Documentation

## Issue Summary
Face capture was not working - no face detection, no quality feedback, no samples being captured despite camera working correctly.

## Root Cause
**React State Closure Problem** in `useFaceCapture.js`

### The Bug
1. `startCapture()` called `setIsCapturing(true)`
2. Immediately started `setInterval` loops for quality checks and auto-capture
3. `checkQuality()` callback had `if (!isCapturing) return` check
4. Due to React closure, `checkQuality()` was capturing the OLD value of `isCapturing` (false)
5. All quality checks were being skipped with "Skipping quality check: no video or not capturing"

### Why It Happened
- React state updates are asynchronous
- `setIsCapturing(true)` doesn't update immediately
- Callbacks created with `useCallback` capture the state value at creation time
- The intervals started before the state updated, so they used stale state

## The Fix

### Changes Made to `app/src/hooks/useFaceCapture.js`

**1. Removed `isCapturing` check from `checkQuality()`:**
```javascript
// BEFORE (BROKEN)
const checkQuality = useCallback(async () => {
  if (!videoRef.current || !isCapturing) {
    return;
  }
  // ... quality check logic
}, [isCapturing]);

// AFTER (FIXED)
const checkQuality = useCallback(async () => {
  if (!videoRef.current) {
    return;
  }
  // ... quality check logic
}, []);
```

**Rationale:**
- The intervals are only running when capture is active anyway
- They're started by `startCapture()` and stopped by `stopCapture()`
- No need to check `isCapturing` inside the callback
- Removes the closure/stale state problem

**2. Fixed progress calculation:**
```javascript
// BEFORE (BROKEN)
const progress = samples.length + 1 / TARGET * 100;

// AFTER (FIXED)
const progress = ((samples.length + 1) / TARGET) * 100;
```

**3. Added proper dependencies to callbacks:**
```javascript
// Added checkQuality and attemptAutoCapture to startCapture dependencies
const startCapture = useCallback(async () => {
  // ...
}, [isInitialized, isCapturing, checkQuality, attemptAutoCapture]);

// Added captureSample to attemptAutoCapture dependencies
const attemptAutoCapture = useCallback(async () => {
  // ...
}, [qualityFeedback, samples.length, stopCapture, captureSample]);
```

## Testing Results

### Before Fix
- ❌ No face detection box
- ❌ No quality feedback
- ❌ Capture button disabled
- ❌ No samples captured
- ❌ Console: "Skipping quality check: no video or not capturing"

### After Fix
- ✅ Face detection box appears (green when quality good, red when issues)
- ✅ Quality feedback messages display
- ✅ Capture button enabled when quality good
- ✅ Samples auto-capture every 200ms when quality valid
- ✅ Progress bar updates correctly
- ✅ Console: "Detecting face...", "Face detection result", "Auto-capturing sample..."

## Lessons Learned

1. **React Closure Gotcha**: Be careful with state in `useCallback` - callbacks capture state at creation time
2. **Interval Timing**: When starting intervals immediately after state updates, the intervals may see stale state
3. **Redundant Checks**: If intervals are controlled by start/stop functions, don't need state checks inside callbacks
4. **Debugging Strategy**: Detailed logging revealed the exact issue (isCapturing: false despite "started" message)

## Related Files Modified
- `app/src/hooks/useFaceCapture.js` - Main fix
- `app/src/components/capture/FaceCapture.jsx` - User-initiated camera (previous fix)
- `PHASE-3-CAMERA-PERMISSION-FIX.md` - Camera permission documentation

## Status
✅ **FIXED** - Face capture now works perfectly with:
- Real-time face detection
- Quality validation
- Auto-capture when quality is good
- Progress tracking
- Sample storage

## Next Steps
- Test liveness capture (may have similar issues)
- Test behavior capture
- Complete Phase 3 data collection implementation
