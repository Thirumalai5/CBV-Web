# Phase 6 - Bug Fix: Behavior Capture Initialization

## Issue Reported

**Error**: `targetElement.addEventListener is not a function`

**Location**: Protected App Page initialization

**Impact**: Verification service failed to start, showing "Not Verified" status

## Root Cause Analysis

### Problem 1: Incorrect Parameter Type
In `verification.service.js`, the `_initializeBehaviorCapture()` method was calling:
```javascript
behaviorCaptureService.startCapture(this.userId);
```

But `behaviorCaptureService.startCapture()` expects an HTMLElement (or defaults to `document`), not a string (userId).

### Problem 2: Missing Method
The `behaviorCaptureService.getCurrentWindow()` method was being called in verification service but didn't exist in the behavior-capture service.

## Fixes Applied

### Fix 1: Correct Behavior Capture Initialization
**File**: `app/src/services/verification.service.js`

**Before**:
```javascript
async _initializeBehaviorCapture() {
  logger.info('Initializing behavior capture');
  behaviorCaptureService.startCapture(this.userId);
  logger.info('Behavior capture initialized');
}
```

**After**:
```javascript
async _initializeBehaviorCapture() {
  logger.info('Initializing behavior capture');
  // Start behavior capture on document (default)
  behaviorCaptureService.startCapture();
  logger.info('Behavior capture initialized');
}
```

**Explanation**: Removed the incorrect `this.userId` parameter. The service will now use the default `document` element for event listeners.

### Fix 2: Add getCurrentWindow Method
**File**: `app/src/services/behavior-capture.service.js`

**Added**:
```javascript
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
```

**Explanation**: Added the missing method that returns the current behavior window with calculated features for real-time verification.

## Testing

### Before Fix
- ❌ Error: `targetElement.addEventListener is not a function`
- ❌ Verification status: "Not Verified"
- ❌ Trust score: 100% (incorrect, no actual verification)
- ❌ All scores showing N/A

### After Fix (Expected)
- ✅ No errors
- ✅ Verification status: "Active" (green)
- ✅ Trust score: Updates based on actual verification
- ✅ Scores update in real-time:
  - Face Match: Updates when face detected
  - Liveness: Updates based on blink detection
  - Behavior: Updates based on keystroke/mouse patterns

## Verification Steps

1. **Rebuild Application**
   ```bash
   cd app
   npm run build
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Test Protected App Page**
   - Navigate to Protected App page
   - Check for errors in console
   - Verify "Verified" badge shows (green)
   - Confirm trust score updates
   - Check individual scores update

4. **Expected Console Logs**
   ```
   [INFO] Starting verification on Protected App page
   [INFO] Loading templates for verification
   [INFO] Starting camera for verification
   [INFO] Camera started successfully
   [INFO] Initializing behavior capture
   [INFO] Behavior capture started
   [INFO] Behavior capture initialized
   [INFO] Starting verification loop
   [INFO] Continuous verification started successfully
   ```

## Impact Assessment

### Severity
- **Critical**: Blocked verification from starting

### Affected Components
- ✅ verification.service.js (Fixed - behavior capture initialization)
- ✅ behavior-capture.service.js (Fixed - added getCurrentWindow method)
- ✅ ProtectedAppPage.jsx (Fixed - added re-authentication handler)

### User Impact
- **Before**: Verification completely non-functional
- **After**: Full verification functionality restored

## Prevention

### Code Review Checklist
- ✅ Verify parameter types match function signatures
- ✅ Ensure all called methods exist
- ✅ Test with actual runtime data
- ✅ Check console for errors during development

### Testing Improvements
- Add unit tests for service initialization
- Add integration tests for verification flow
- Test with different scenarios (no templates, no camera, etc.)

## Related Files

### Modified (3 files)
1. `app/src/services/verification.service.js` - Fixed behavior capture initialization
2. `app/src/services/behavior-capture.service.js` - Added getCurrentWindow method
3. `app/src/pages/ProtectedAppPage.jsx` - Added re-authentication handler

### Affected (No changes needed)
1. `app/src/context/VerificationContext.jsx`
2. `app/src/components/verification/TrustScoreGauge.jsx`
3. `app/src/components/verification/VerificationStatus.jsx`

### Fix 3: Add Re-authentication Handler
**File**: `app/src/pages/ProtectedAppPage.jsx`

**Problem**: The "Re-authenticate Now" button in the REAUTH overlay had no onClick handler, making it non-functional.

**Added**:
```javascript
/**
 * Handle re-authentication
 */
const handleReauth = async () => {
  try {
    logger.info('Re-authentication requested');
    
    // For Phase 6, we'll simulate re-authentication by restarting verification
    // Phase 7 will implement proper WebAuthn/passkey re-authentication
    
    // Stop current verification
    if (isVerifying) {
      await stopVerification();
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Restart verification
    await startVerification(currentUser.userId, videoRef.current);
    
    logger.info('Re-authentication completed, verification restarted');
    alert('Re-authentication successful! Verification has been restarted.');
    
  } catch (error) {
    logger.error('Re-authentication failed', { error: error.message });
    alert('Re-authentication failed. Please try again or refresh the page.');
  }
};
```

**Updated Button**:
```javascript
{currentState.name === 'REAUTH' && (
  <Button 
    variant="primary" 
    size="large"
    onClick={handleReauth}
  >
    Re-authenticate Now
  </Button>
)}
```

**Explanation**: 
- Added `handleReauth` function that stops and restarts verification
- This simulates re-authentication for Phase 6
- Phase 7 will implement proper WebAuthn/passkey re-authentication
- Provides user feedback via alert messages

### Fix 4: Behavior Capture Service Conflict
**File**: `app/src/services/behavior-capture.service.js`

**Problem**: The behavior capture service is a singleton being used by both:
- Capture page (for enrollment data collection)
- Protected App page (for continuous verification)

When navigating between pages, the service could have conflicting event listeners, causing glitches on the Capture page.

**Changes**:
1. Store target element reference for proper cleanup
2. Use stored target element in stopCapture if not provided
3. Clear target element reference after stopping

**Before**:
```javascript
startCapture(targetElement = document) {
  // No target element storage
  targetElement.addEventListener('keydown', this.handleKeyDown);
  // ...
}

stopCapture(targetElement = document) {
  // Always uses provided or default document
  targetElement.removeEventListener('keydown', this.handleKeyDown);
  // ...
}
```

**After**:
```javascript
startCapture(targetElement = document) {
  // Store the target element for cleanup
  this.targetElement = targetElement;
  targetElement.addEventListener('keydown', this.handleKeyDown);
  // ...
}

stopCapture(targetElement = null) {
  // Use stored target element if not provided
  const element = targetElement || this.targetElement || document;
  element.removeEventListener('keydown', this.handleKeyDown);
  // ...
  // Clear target element reference
  this.targetElement = null;
}
```

**Benefits**:
- Proper cleanup of event listeners
- No conflicts between pages
- Prevents memory leaks
- Eliminates glitches on Capture page

### Fix 5: Camera Service Conflict Between Pages
**File**: `app/src/pages/ProtectedAppPage.jsx`

**Problem**: When navigating from Protected App to Capture page, the camera service wasn't being properly released, causing:
- Face Capture: Camera shuts down when clicking "Capture Now"
- Liveness Capture: Shows loading glitch

**Root Cause**: The useEffect cleanup had circular dependencies (`isVerifying` in deps), causing it to re-run when verification state changed instead of only on unmount.

**Before**:
```javascript
useEffect(() => {
  const initVerification = async () => {
    // ...
    await startVerification(currentUser.userId, videoRef.current);
  };
  
  initVerification();
  
  return () => {
    if (isVerifying) {  // Checking state in cleanup
      stopVerification();
    }
  };
}, [currentUser, isVerifying, stopVerification]); // isVerifying causes re-runs
```

**After**:
```javascript
useEffect(() => {
  let mounted = true;
  
  const initVerification = async () => {
    // ...
    await startVerification(currentUser.userId, videoRef.current);
  };
  
  initVerification();
  
  return () => {
    mounted = false;
    logger.info('Stopping verification on page unmount');
    stopVerification(); // Always stop on unmount
  };
}, [currentUser, startVerification, stopVerification]); // No isVerifying
```

**Changes**:
1. Removed `isVerifying` from dependencies
2. Always call `stopVerification()` in cleanup (no conditional check)
3. Added `mounted` flag to prevent state updates after unmount
4. Cleanup now properly releases camera when leaving page

**Benefits**:
- Camera properly released when navigating away
- No conflicts between Capture and Protected App pages
- Prevents memory leaks
- Eliminates camera shutdown issues
- Fixes loading glitches

## Status

- ✅ **Root cause identified**
- ✅ **Fixes applied (5 fixes)**
- ⏳ **Build in progress**
- ⏳ **Testing pending**

## Next Steps

1. Wait for build to complete
2. Test in browser
3. Verify all functionality works
4. Update testing guide if needed
5. Proceed with Phase 6 completion

---

**Date**: 2024-01-XX  
**Fixed By**: AI Assistant  
**Severity**: Critical  
**Status**: Fixed, pending verification
