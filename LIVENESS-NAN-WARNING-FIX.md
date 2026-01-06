# Liveness Capture NaN Warning Fix

## Issue

Console warning in LivenessCapture component:
```
Warning: Received NaN for the `children` attribute. If this is expected, cast the value to a string.
```

## Root Cause

The LivenessCapture component was displaying numeric values that could be `undefined` or `NaN` before initialization:
- `duration` - undefined initially
- `currentEAR` - 0 initially but could be NaN
- `blinkCount` - 0 initially
- `livenessConfidence` - 0 initially
- `progress` - 0 initially
- `timeRemaining.remaining` - could be NaN before capture starts

When React tries to render these values as children of DOM elements, it throws a warning if they're NaN.

## Solution

Added null coalescing operators (`||`) to provide default values of `0` for all numeric displays:

### Changes Made

1. **Timer Display**
   ```javascript
   // Before
   {formatDuration(duration)}
   {formatDuration(timeRemaining.remaining)} remaining
   
   // After
   {formatDuration(duration || 0)}
   {formatDuration(timeRemaining?.remaining || 0)} remaining
   ```

2. **Progress Section**
   ```javascript
   // Before
   {Math.round(duration)}s / {targetDuration}s
   style={{ width: `${progress}%` }}
   {Math.round(progress)}% Complete
   
   // After
   {Math.round(duration || 0)}s / {targetDuration}s
   style={{ width: `${progress || 0}%` }}
   {Math.round(progress || 0)}% Complete
   ```

3. **Liveness Metrics**
   ```javascript
   // Before
   {currentEAR.toFixed(3)}
   {blinkCount}
   {(livenessConfidence * 100).toFixed(1)}%
   
   // After
   {(currentEAR || 0).toFixed(3)}
   {blinkCount || 0}
   {((livenessConfidence || 0) * 100).toFixed(1)}%
   ```

4. **EAR Visualization**
   ```javascript
   // Before
   width: `${(currentEAR / 0.4) * 100}%`
   
   // After
   width: `${((currentEAR || 0) / 0.4) * 100}%`
   ```

## Benefits

✅ No more NaN warnings in console
✅ All numeric values display as "0" initially instead of NaN
✅ Smooth initialization without visual glitches
✅ Better user experience with predictable initial state

## Testing

### Before Fix
- Console showed NaN warning on component mount
- Metrics might display "NaN" briefly

### After Fix
- No console warnings
- All metrics display "0" or "0.000" initially
- Clean initialization

## Files Modified

1. `app/src/components/capture/LivenessCapture.jsx`
   - Added null coalescing for all numeric displays
   - 8 locations updated

## Status

✅ **FIXED** - No more NaN warnings in LivenessCapture component
