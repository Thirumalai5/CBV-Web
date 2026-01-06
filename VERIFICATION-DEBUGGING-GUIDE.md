# Verification Service Debugging Guide

## Current Issue

The Protected App page shows "Access Restricted - Anomaly Detected" because continuous verification is failing repeatedly with the error:
```
[ERROR] Face/liveness verification failed
```

## Enhanced Logging Added

I've added detailed debug logging to help identify the root cause. The logs will now show:

### 1. Camera Status
```
[WARN] Camera not active or video element missing
  - hasVideoElement: true/false
  - cameraActive: true/false
```

### 2. Video Readiness
```
[DEBUG] Video not ready
  - readyState: 0-4 (0=no data, 2=enough to start, 4=can play through)
```

### 3. Face Detection
```
[DEBUG] No faces detected in frame
OR
[DEBUG] Face detected
  - box: { xMin, yMin, width, height }
  - hasTemplate: true/false
```

### 4. Face Matching
```
[DEBUG] Face match completed
  - confidence: 0.0-1.0
OR
[WARN] No face template available for matching
```

### 5. Liveness Check
```
[DEBUG] Liveness check completed
  - confidence: 0.0-1.0
```

### 6. Detailed Errors
```
[ERROR] Face/liveness verification failed
  - error: error message
  - stack: full stack trace
  - videoReady: readyState value
  - cameraActive: true/false
```

## Common Causes & Solutions

### Cause 1: No Templates Loaded
**Symptom**: `[WARN] No face template available for matching`

**Reason**: User hasn't completed enrollment, or templates failed to load from IndexedDB

**Solution**:
1. Complete the enrollment process (face + liveness + behavior capture)
2. Check IndexedDB to verify templates were saved
3. Check console for template loading errors

### Cause 2: Camera Not Starting
**Symptom**: `[WARN] Camera not active or video element missing`

**Reason**: Verification camera service failed to start

**Solution**:
1. Check for camera permission errors
2. Verify video element is properly passed to verification service
3. Check if camera is already in use by another service

### Cause 3: Video Not Ready
**Symptom**: `[DEBUG] Video not ready { readyState: 0 or 1 }`

**Reason**: Video stream hasn't loaded enough data yet

**Solution**:
- This is normal during initialization
- Should resolve within 1-2 seconds
- If persists, camera may have failed to start

### Cause 4: No Face Detected
**Symptom**: `[DEBUG] No faces detected in frame`

**Reason**: 
- User not in frame
- Poor lighting
- Face detection model not loaded
- Camera pointing wrong direction

**Solution**:
1. Ensure user is visible in camera
2. Check lighting conditions
3. Verify face detection service initialized
4. Check if camera is showing video feed

### Cause 5: Face Detection Service Error
**Symptom**: Error with stack trace in console

**Reason**: Face detection model failed to load or process frame

**Solution**:
1. Check network for model loading errors
2. Verify TensorFlow.js loaded correctly
3. Check browser console for ML model errors

## Debugging Steps

### Step 1: Check Console Logs
After refreshing the Protected App page, look for:

1. **Initialization Logs**
   ```
   [INFO] Starting continuous verification { userId: 'Thiru' }
   [INFO] Loading templates for verification
   [INFO] Face template loaded (or [WARN] No face template available)
   [INFO] Starting camera for verification
   [VERIFICATION] Camera started successfully
   [INFO] Continuous verification started successfully
   ```

2. **Verification Loop Logs**
   - Should see `[DEBUG]` logs every ~500ms
   - Check what stage is failing

### Step 2: Check Video Element
Open browser DevTools and run:
```javascript
// Check if video element exists and is playing
const video = document.querySelector('video');
console.log({
  exists: !!video,
  readyState: video?.readyState,
  videoWidth: video?.videoWidth,
  videoHeight: video?.videoHeight,
  paused: video?.paused,
});
```

Expected output:
```javascript
{
  exists: true,
  readyState: 4,
  videoWidth: 640,
  videoHeight: 480,
  paused: false
}
```

### Step 3: Check IndexedDB
1. Open DevTools → Application → IndexedDB
2. Check `cbv_system` database
3. Verify these stores have data:
   - `face_samples` - Should have face images
   - `liveness_samples` - Should have liveness data
   - `behavior_windows` - Should have behavior data
   - `templates` - Should have face template

### Step 4: Check Camera Permission
1. Click the camera icon in browser address bar
2. Verify camera permission is "Allow"
3. If blocked, reset and allow

### Step 5: Test Face Detection Manually
Open console and run:
```javascript
import('@tensorflow-models/blazeface').then(async (blazeface) => {
  const model = await blazeface.load();
  const video = document.querySelector('video');
  const predictions = await model.estimateFaces(video, false);
  console.log('Faces detected:', predictions.length);
  console.log('Predictions:', predictions);
});
```

## Temporary Workaround

If verification keeps failing and you want to test the UI without restrictions, you can temporarily modify the trust score service to always return high scores. However, this defeats the purpose of CBV and should only be used for UI testing.

## Expected Behavior

### Normal Operation
```
[DEBUG] Face detected { box: {...}, hasTemplate: true }
[DEBUG] Face match completed { confidence: 0.85 }
[DEBUG] Liveness check completed { confidence: 0.7 }
[DEBUG] Trust score updated { trustScore: 0.82, state: 'NORMAL' }
```

### When User Leaves Frame
```
[DEBUG] No faces detected in frame
[DEBUG] Trust score updated { trustScore: 0.65, state: 'WATCH' }
```

### When Anomaly Detected
```
[DEBUG] Face match completed { confidence: 0.3 }
[DEBUG] Trust score updated { trustScore: 0.45, state: 'RESTRICT' }
```

## Next Steps

1. **Refresh the Protected App page**
2. **Open browser console**
3. **Look for the detailed logs** added in this update
4. **Report back** with:
   - What stage is failing (camera, face detection, template loading, etc.)
   - Any new error messages with stack traces
   - Video element status
   - IndexedDB contents

This will help identify the exact cause of the verification failures.
