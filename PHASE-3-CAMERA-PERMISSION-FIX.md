# Phase 3 - Camera Permission Fix

## Issue
Camera permission was being denied without prompting the user. The error message "Camera permission denied. Please allow camera access." appeared immediately without showing the browser's permission dialog.

## Root Cause
The capture components (FaceCapture and LivenessCapture) were calling `initialize()` on component mount via `useEffect()`. This caused the camera service to request camera access immediately when the page loaded, before the user had any chance to interact with the page.

**Browser Security**: Modern browsers require user interaction (like a button click) before requesting camera permissions. Auto-requesting on page load is blocked for security reasons.

## Files Modified

### 1. app/src/components/capture/FaceCapture.jsx
**Before**:
```javascript
// Initialize on mount
useEffect(() => {
  initialize().catch(err => {
    console.error('Failed to initialize face capture:', err);
  });
}, [initialize]);
```

**After**:
```javascript
// Don't auto-initialize camera - wait for user to click "Start Capture"
// Camera permission will be requested when user clicks the button

const handleStartCapture = async () => {
  try {
    // Initialize camera and face detection first
    if (!isInitialized) {
      await initialize();
    }
    // Then start capturing
    await startCapture();
  } catch (err) {
    console.error('Failed to start capture:', err);
  }
};
```

### 2. app/src/components/capture/LivenessCapture.jsx
**Before**:
```javascript
// Initialize on mount
useEffect(() => {
  initialize().catch(err => {
    console.error('Failed to initialize liveness capture:', err);
  });
}, [initialize]);
```

**After**:
```javascript
// Don't auto-initialize camera - wait for user to click "Start Liveness Check"
// Camera permission will be requested when user clicks the button

// In the button onClick:
onClick={async () => {
  try {
    if (!isInitialized) {
      await initialize();
    }
    await startCapture();
  } catch (err) {
    console.error('Failed to start liveness capture:', err);
  }
}}
```

## Solution
1. **Removed auto-initialization**: Removed the `useEffect` hooks that called `initialize()` on mount
2. **User-initiated initialization**: Camera initialization now happens only when the user clicks "Start Capture" or "Start Liveness Check" buttons
3. **Proper flow**: 
   - User clicks button
   - Browser shows permission dialog
   - User grants permission
   - Camera starts
   - Capture begins

## Testing
After the fix:
1. ✅ Navigate to Capture page - no permission request
2. ✅ Click "Start Capture" button - browser shows permission dialog
3. ✅ Grant permission - camera starts successfully
4. ✅ Face detection works
5. ✅ Same flow works for Liveness capture

## Browser Compatibility
This fix ensures compatibility with browser security policies:
- ✅ Chrome/Edge: Requires user gesture for camera access
- ✅ Firefox: Requires user gesture for camera access
- ✅ Safari: Requires user gesture for camera access

## Best Practices Applied
1. **User Consent**: Always request permissions after user interaction
2. **Clear Intent**: User knows what they're granting permission for
3. **Error Handling**: Proper error messages if permission is denied
4. **Progressive Enhancement**: Initialize only when needed

## Related Files
- `app/src/services/camera.service.js` - Camera service (no changes needed)
- `app/src/hooks/useFaceCapture.js` - Face capture hook (no changes needed)
- `app/src/hooks/useLivenessCapture.js` - Liveness capture hook (no changes needed)

## Status
✅ **FIXED** - Camera permission now works correctly with user-initiated requests

## Compilation Status
✅ Webpack compiled successfully
✅ No errors
✅ Hot reload working
