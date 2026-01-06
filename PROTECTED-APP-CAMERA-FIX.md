# Protected App Camera Service Fix

## Issue

Protected App page immediately showed "Access Restricted - Anomaly Detected" and "Limited Access" warnings upon loading.

## Root Cause

The `verification.service.js` was importing and using the old `camera.service` instead of the new `verification-camera.service`:

```javascript
// BEFORE - Wrong service
import cameraService from './camera.service';

await cameraService.start(this.videoElement);
if (cameraService.isRunning()) {
  cameraService.stop();
}
```

**The Problem:**
1. `camera.service` is now a legacy wrapper that delegates to `verification-camera.service`
2. The delegation adds an extra layer and deprecation warnings
3. More importantly, the verification service should directly use the dedicated verification camera service
4. Using the wrong service could cause initialization issues or conflicts

## Solution

Updated `verification.service.js` to use the correct `verification-camera.service`:

```javascript
// AFTER - Correct service
import verificationCameraService from './verification-camera.service';

await verificationCameraService.start(this.videoElement);
if (verificationCameraService.isRunning()) {
  verificationCameraService.stop();
}
```

## Changes Made

### File: `app/src/services/verification.service.js`

1. **Import Statement**
   ```javascript
   // Before
   import cameraService from './camera.service';
   
   // After
   import verificationCameraService from './verification-camera.service';
   ```

2. **Start Camera Method**
   ```javascript
   // Before
   await cameraService.start(this.videoElement);
   
   // After
   await verificationCameraService.start(this.videoElement);
   ```

3. **Stop Camera Method**
   ```javascript
   // Before
   if (cameraService.isRunning()) {
     cameraService.stop();
   }
   
   // After
   if (verificationCameraService.isRunning()) {
     verificationCameraService.stop();
   }
   ```

## Benefits

✅ **Correct Service Usage**: Verification phase now uses dedicated verification camera
✅ **No Legacy Warnings**: Avoids deprecation warnings from legacy camera service
✅ **Better Performance**: Direct service usage without delegation layer
✅ **Clearer Logging**: Console shows `[VERIFICATION]` prefix correctly
✅ **Proper Architecture**: Follows the camera separation design

## Expected Behavior After Fix

### Console Logs
```
[VERIFICATION] Verification camera service initialized
[VERIFICATION] Requesting camera access for continuous verification...
[VERIFICATION] Camera started successfully { instanceId: 'verification', width: 640, height: 480 }
Starting continuous verification { userId: 'Thiru' }
Loading templates for verification
Starting camera for verification
Camera started successfully
Continuous verification started successfully
```

### Protected App Page
- Camera starts automatically
- Continuous verification runs in background
- Trust score updates in real-time
- Security state shows "NORMAL" initially
- No immediate "Access Restricted" warnings
- Smooth user experience

## Testing Checklist

### Before Fix
- ❌ Protected App shows "Access Restricted" immediately
- ❌ "Limited Access - Anomaly Detected" warning
- ❌ Camera may not start properly
- ❌ Verification may fail to initialize

### After Fix
- [ ] Navigate to Protected App page
- [ ] Verify camera starts automatically
- [ ] Check console for `[VERIFICATION]` logs
- [ ] Verify no immediate "Access Restricted" warnings
- [ ] Verify trust score displays correctly
- [ ] Verify security state shows "NORMAL" initially
- [ ] Verify continuous verification runs smoothly

## Related Fixes

This fix complements the camera separation implementation:
1. **Camera Separation** - Created dedicated capture and verification camera services
2. **Capture Phase** - Updated face and liveness capture to use capture-camera.service
3. **Verification Phase** - Updated verification service to use verification-camera.service

## Architecture Alignment

```
┌─────────────────────────────────────────────────────────┐
│                  Verification Phase                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐                                   │
│  │ ProtectedAppPage │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐                                   │
│  │ VerificationCtx  │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
│           ▼                                              │
│  ┌──────────────────┐       ┌──────────────────┐       │
│  │ verification     │──────>│ verification-    │       │
│  │ .service         │       │ camera.service   │       │
│  └──────────────────┘       └──────────────────┘       │
│           │                          ✅                 │
│           │                    (Now using correct       │
│           │                     camera service)         │
│           ▼                                              │
│  ┌──────────────────┐                                   │
│  │ trust-score      │                                   │
│  │ .service         │                                   │
│  └──────────────────┘                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Files Modified

1. `app/src/services/verification.service.js`
   - Changed import from `camera.service` to `verification-camera.service`
   - Updated 3 references to use `verificationCameraService`

## Status

✅ **FIXED** - Verification service now uses correct camera service
⏳ **Testing** - Ready for user verification on Protected App page

## Next Steps

1. Test Protected App page
2. Verify camera starts automatically
3. Confirm continuous verification runs
4. Check trust score updates
5. Verify no immediate "Access Restricted" warnings
