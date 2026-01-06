# Capture Page Flickering Fix

## Issue

The Capture Page was experiencing:
1. Continuous flickering/re-rendering
2. "Loading enrollment status..." message appearing repeatedly
3. Page instability during liveness capture

## Root Cause

The `updateProgress` useEffect in CapturePage.jsx was causing an infinite render loop:

```javascript
// BEFORE - Infinite loop
useEffect(() => {
  const updateProgress = async () => {
    if (!isInProgress) return;
    
    const result = await updateEnrollmentProgress(newProgress);
    if (result.success) {
      await loadEnrollmentStatus(); // ❌ This triggers state update
    }
  };
  
  updateProgress();
}, [faceSamples.length, livenessData, behaviorWindows.length]);
```

**The Problem:**
1. Effect runs when capture data changes
2. Calls `loadEnrollmentStatus()`
3. Updates `enrollmentStatus` state via `setEnrollmentStatus()`
4. State change triggers component re-render
5. Re-render causes effect dependencies to be re-evaluated
6. Effect runs again → infinite loop

## Solution

Update the enrollment status directly from the API response instead of reloading:

```javascript
// AFTER - No infinite loop
useEffect(() => {
  const updateProgress = async () => {
    if (!isInProgress) return;
    
    const newProgress = {
      faceSamples: faceSamples.length,
      livenessDuration: livenessData?.duration || 0,
      behaviorWindows: behaviorWindows.length,
    };
    
    const result = await updateEnrollmentProgress(newProgress);
    if (result.success && result.data) {
      // ✅ Update state directly from response
      setEnrollmentStatus(result.data);
    }
  };
  
  updateProgress();
}, [faceSamples.length, livenessData, behaviorWindows.length, isInProgress, updateEnrollmentProgress]);
```

**Why This Works:**
1. Effect runs when capture data changes
2. Calls `updateEnrollmentProgress()` API
3. Updates state directly from API response
4. State update doesn't trigger the effect again (dependencies haven't changed)
5. No infinite loop

## Additional Improvements

Added proper dependencies to the useEffect:
- `isInProgress` - Ensures effect only runs during active enrollment
- `updateEnrollmentProgress` - Includes the function reference

## Benefits

✅ No more flickering/re-rendering
✅ Stable page during capture
✅ Enrollment progress updates correctly
✅ Better performance (fewer API calls)
✅ Cleaner state management

## Testing

### Before Fix
- Page flickered continuously
- "Loading enrollment status..." appeared repeatedly
- Capture components unstable
- Console showed rapid re-renders

### After Fix
- Page stable and smooth
- No flickering
- Enrollment progress updates correctly
- Single render per state change

## Files Modified

1. `app/src/pages/CapturePage.jsx`
   - Changed `loadEnrollmentStatus()` call to direct state update
   - Added proper effect dependencies
   - Prevents infinite render loop

## Related Fixes

This fix complements the earlier fixes:
1. **LivenessCapture infinite loop fix** - Fixed circular dependencies in hooks
2. **NaN warning fix** - Fixed undefined numeric values
3. **Camera separation** - Separated capture and verification camera services

## Status

✅ **FIXED** - Capture page no longer flickers or shows loading state repeatedly
