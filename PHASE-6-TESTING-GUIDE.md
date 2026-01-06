# Phase 6 - Continuous Verification Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Phase 6 continuous verification system.

## Prerequisites

### 1. System Requirements
- ✅ Modern browser (Chrome 90+, Edge 90+, Firefox 88+)
- ✅ Webcam/camera access
- ✅ HTTPS or localhost environment
- ✅ Phase 0-5 completed

### 2. Data Requirements
- ✅ User registered (userId: "Thiru", password: "thiru0509")
- ✅ Enrollment data captured (Phase 3)
- ✅ Templates trained (Phase 5) - **Optional for initial testing**

### 3. Environment Setup
```bash
# Start development server
cd app
npm start

# Server should start at https://localhost:8080
```

## Testing Checklist

### Part 1: Basic Functionality ✅

#### Test 1.1: Application Startup
**Steps:**
1. Open browser to `https://localhost:8080`
2. Accept self-signed certificate warning
3. Navigate to Home page

**Expected Results:**
- ✅ Application loads without errors
- ✅ No console errors
- ✅ Navigation bar visible
- ✅ All pages accessible

**Pass/Fail:** ___________

---

#### Test 1.2: Login and Navigation
**Steps:**
1. Click "Start Registration" or "Login"
2. Enter credentials (Thiru / thiru0509)
3. Click "Login"
4. Navigate to "Protected App" page

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to appropriate page
- ✅ Protected App page loads
- ✅ No console errors

**Pass/Fail:** ___________

---

### Part 2: Verification Service ✅

#### Test 2.1: Verification Initialization
**Steps:**
1. Navigate to Protected App page
2. Open browser console (F12)
3. Look for initialization logs

**Expected Console Logs:**
```
[INFO] Starting verification on Protected App page
[INFO] Loading templates for verification
[INFO] Starting camera for verification
[INFO] Camera started successfully
[INFO] Starting verification loop
[INFO] Continuous verification started successfully
```

**Expected UI:**
- ✅ Camera permission requested
- ✅ Verification badge shows "Verified" (green)
- ✅ Trust Score Gauge visible
- ✅ Verification Status panel visible

**Pass/Fail:** ___________

---

#### Test 2.2: Camera Permission
**Steps:**
1. When prompted, click "Allow" for camera access
2. Observe verification status

**Expected Results:**
- ✅ Camera permission granted
- ✅ Camera status indicator: Green dot
- ✅ No error messages
- ✅ Verification starts automatically

**Alternative Test (Permission Denied):**
1. Click "Block" for camera access
2. Observe error handling

**Expected Results:**
- ✅ Error message displayed
- ✅ Verification status shows camera inactive
- ✅ Trust score remains at 0 or low value
- ✅ State transitions to RESTRICT

**Pass/Fail:** ___________

---

### Part 3: Trust Score Display ✅

#### Test 3.1: Trust Score Gauge
**Steps:**
1. Locate Trust Score Gauge on Protected App page
2. Observe the gauge display

**Expected UI Elements:**
- ✅ Gauge bar visible
- ✅ Percentage value displayed (0-100%)
- ✅ Color coding:
  - Green (≥70%): NORMAL
  - Orange (≥50%): WATCH
  - Red (≥30%): RESTRICT
  - Purple (<30%): REAUTH
- ✅ State label visible
- ✅ State description visible
- ✅ Threshold markers visible

**Pass/Fail:** ___________

---

#### Test 3.2: Verification Status Panel
**Steps:**
1. Locate Verification Status panel
2. Check all status indicators

**Expected UI Elements:**
- ✅ Status header with "Active/Inactive" indicator
- ✅ Face Match score (0-100% or N/A)
- ✅ Liveness score (0-100% or N/A)
- ✅ Behavior score (0-100% or N/A)
- ✅ System status indicators:
  - Camera (green/red dot)
  - Face Detected (green/orange dot)
  - Templates (green/red dot)
- ✅ Color coding for scores:
  - Green: ≥70%
  - Orange: 50-69%
  - Red: <50%
  - Gray: N/A

**Pass/Fail:** ___________

---

### Part 4: Real-Time Updates ✅

#### Test 4.1: Score Updates
**Steps:**
1. Sit normally in front of camera
2. Observe trust score for 10 seconds
3. Watch for score updates

**Expected Behavior:**
- ✅ Trust score updates every ~500ms
- ✅ Smooth transitions (no jumping)
- ✅ Individual scores update independently
- ✅ Gauge bar animates smoothly
- ✅ No flickering or rapid changes

**Console Logs to Check:**
```
[DEBUG] Trust score updated: 0.XXX
[DEBUG] Face match result: {...}
[DEBUG] Liveness check result: {...}
[DEBUG] Behavior verification result: {...}
```

**Pass/Fail:** ___________

---

#### Test 4.2: State Transitions
**Steps:**
1. Start in NORMAL state (trust score ≥70%)
2. Perform actions to trigger state changes (see scenarios below)
3. Observe state transitions

**Expected Behavior:**
- ✅ State changes reflected in gauge color
- ✅ State label updates
- ✅ State description updates
- ✅ Transitions are smooth (not instant)
- ✅ Hysteresis prevents rapid switching
- ✅ Minimum 2-second state duration

**Console Logs to Check:**
```
[INFO] State transition: from NORMAL to WATCH, trustScore: 0.XXX
```

**Pass/Fail:** ___________

---

### Part 5: Verification Scenarios ✅

#### Test 5.1: Normal Operation (NORMAL State)
**Steps:**
1. Sit normally in front of camera
2. Look at screen
3. Type occasionally
4. Move mouse naturally
5. Observe for 30 seconds

**Expected Results:**
- ✅ Trust score: 70-100%
- ✅ State: NORMAL (green)
- ✅ Face Match: High (if templates available)
- ✅ Liveness: High
- ✅ Behavior: High (if baseline available)
- ✅ All actions enabled
- ✅ No warnings or restrictions

**Pass/Fail:** ___________

---

#### Test 5.2: Face Not Detected (WATCH State)
**Steps:**
1. Start in NORMAL state
2. Turn head away from camera
3. Wait 3-5 seconds
4. Observe state change

**Expected Results:**
- ✅ Face Detected indicator: Orange
- ✅ Face Match score: 0% or N/A
- ✅ Trust score decreases
- ✅ State transitions to WATCH (orange)
- ✅ Warning message may appear
- ✅ Actions still enabled but with warning

**Recovery Test:**
1. Turn head back to camera
2. Wait 3-5 seconds

**Expected Results:**
- ✅ Face Detected indicator: Green
- ✅ Face Match score increases
- ✅ Trust score recovers
- ✅ State transitions back to NORMAL
- ✅ Warning disappears

**Pass/Fail:** ___________

---

#### Test 5.3: Camera Blocked (RESTRICT State)
**Steps:**
1. Start in NORMAL state
2. Cover camera with hand or object
3. Wait 3-5 seconds
4. Observe state change

**Expected Results:**
- ✅ Camera indicator: Red
- ✅ All scores: 0% or N/A
- ✅ Trust score drops to 0%
- ✅ State transitions to RESTRICT (red)
- ✅ Overlay may appear
- ✅ Sensitive actions blocked:
  - Transfer form disabled
  - Document view buttons disabled
  - "Blocked" badges visible

**Recovery Test:**
1. Uncover camera
2. Wait 5-10 seconds

**Expected Results:**
- ✅ Camera indicator: Green
- ✅ Scores start recovering
- ✅ Trust score increases
- ✅ State transitions back through WATCH to NORMAL
- ✅ Actions re-enabled

**Pass/Fail:** ___________

---

#### Test 5.4: Prolonged Anomaly (REAUTH State)
**Steps:**
1. Start in NORMAL state
2. Keep camera blocked for 10+ seconds
3. Or turn away for extended period
4. Observe state progression

**Expected Results:**
- ✅ State: WATCH → RESTRICT → REAUTH
- ✅ Trust score: <30%
- ✅ State: REAUTH (purple)
- ✅ Full-screen overlay appears
- ✅ "Re-authentication Required" message
- ✅ All actions completely blocked
- ✅ Re-auth button visible

**Pass/Fail:** ___________

---

### Part 6: UI Enforcement ✅

#### Test 6.1: Action Blocking in RESTRICT State
**Steps:**
1. Trigger RESTRICT state (cover camera)
2. Try to interact with protected elements

**Elements to Test:**
- ✅ Transfer form:
  - Input fields disabled
  - Submit button disabled
  - "Transfer Blocked" text shown
- ✅ Document buttons:
  - All "View" buttons disabled
  - "Blocked" badge visible
- ✅ Other sensitive actions blocked

**Pass/Fail:** ___________

---

#### Test 6.2: Warning in WATCH State
**Steps:**
1. Trigger WATCH state (turn head away briefly)
2. Try to perform transfer

**Expected Results:**
- ✅ Actions still enabled
- ✅ "Warning" badge visible
- ✅ Confirmation dialog may appear
- ✅ User can proceed with caution

**Pass/Fail:** ___________

---

### Part 7: Performance Testing ✅

#### Test 7.1: CPU Usage
**Steps:**
1. Open Task Manager / Activity Monitor
2. Navigate to Protected App page
3. Let verification run for 2 minutes
4. Monitor CPU usage

**Expected Results:**
- ✅ CPU usage: <10% average
- ✅ No CPU spikes
- ✅ Stable performance
- ✅ No browser freezing

**Actual CPU Usage:** __________%

**Pass/Fail:** ___________

---

#### Test 7.2: Memory Usage
**Steps:**
1. Open browser DevTools → Performance/Memory tab
2. Take heap snapshot before starting
3. Let verification run for 5 minutes
4. Take heap snapshot after
5. Compare memory usage

**Expected Results:**
- ✅ Memory increase: <50MB
- ✅ No memory leaks
- ✅ Stable memory usage
- ✅ Garbage collection working

**Memory Before:** __________MB  
**Memory After:** __________MB  
**Increase:** __________MB

**Pass/Fail:** ___________

---

#### Test 7.3: Frame Rate / Smoothness
**Steps:**
1. Observe UI animations
2. Watch gauge updates
3. Monitor state transitions
4. Check for lag or stuttering

**Expected Results:**
- ✅ Smooth animations (60 FPS)
- ✅ No UI lag
- ✅ No stuttering
- ✅ Responsive interactions

**Pass/Fail:** ___________

---

### Part 8: Error Handling ✅

#### Test 8.1: No Templates Available
**Steps:**
1. Ensure no templates are loaded
2. Navigate to Protected App page
3. Observe behavior

**Expected Results:**
- ✅ Verification starts anyway
- ✅ Face Match: N/A
- ✅ Behavior: N/A
- ✅ Only Liveness score available
- ✅ Warning message about missing templates
- ✅ No crashes or errors

**Pass/Fail:** ___________

---

#### Test 8.2: Camera Disconnected
**Steps:**
1. Start verification
2. Physically disconnect camera (if possible)
3. Or revoke camera permission
4. Observe error handling

**Expected Results:**
- ✅ Error detected
- ✅ Error message displayed
- ✅ State transitions to RESTRICT
- ✅ Graceful degradation
- ✅ No application crash

**Pass/Fail:** ___________

---

#### Test 8.3: Page Navigation
**Steps:**
1. Start verification on Protected App page
2. Navigate to another page
3. Return to Protected App page

**Expected Results:**
- ✅ Verification stops on navigation away
- ✅ Camera released
- ✅ No memory leaks
- ✅ Verification restarts on return
- ✅ Clean state reset

**Pass/Fail:** ___________

---

### Part 9: Browser Compatibility ✅

#### Test 9.1: Chrome/Edge
**Browser:** Chrome/Edge __________  
**Version:** __________

**Test Results:**
- ✅ All features working
- ✅ Camera access working
- ✅ Verification running
- ✅ UI rendering correctly
- ✅ Performance acceptable

**Pass/Fail:** ___________

---

#### Test 9.2: Firefox
**Browser:** Firefox __________  
**Version:** __________

**Test Results:**
- ✅ All features working
- ✅ Camera access working
- ✅ Verification running
- ✅ UI rendering correctly
- ✅ Performance acceptable

**Pass/Fail:** ___________

---

### Part 10: Console Logs Verification ✅

#### Test 10.1: Check Console Logs
**Steps:**
1. Open browser console (F12)
2. Filter for verification logs
3. Verify log messages

**Expected Log Patterns:**
```
[INFO] Starting verification on Protected App page
[INFO] Loading templates for verification
[INFO] Starting camera for verification
[INFO] Camera started successfully
[INFO] Starting verification loop
[INFO] Continuous verification started successfully
[DEBUG] Trust score updated: 0.XXX
[DEBUG] Face match result: {...}
[DEBUG] Liveness check result: {...}
[DEBUG] Behavior verification result: {...}
[INFO] State transition: from X to Y
```

**Check for:**
- ✅ No error logs (unless expected)
- ✅ Regular update logs
- ✅ Proper log levels (INFO, DEBUG, WARN, ERROR)
- ✅ Meaningful log messages

**Pass/Fail:** ___________

---

## Summary

### Test Results Overview

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Basic Functionality | 2 | ___ | ___ | |
| Verification Service | 2 | ___ | ___ | |
| Trust Score Display | 2 | ___ | ___ | |
| Real-Time Updates | 2 | ___ | ___ | |
| Verification Scenarios | 4 | ___ | ___ | |
| UI Enforcement | 2 | ___ | ___ | |
| Performance | 3 | ___ | ___ | |
| Error Handling | 3 | ___ | ___ | |
| Browser Compatibility | 2 | ___ | ___ | |
| Console Logs | 1 | ___ | ___ | |
| **TOTAL** | **23** | **___** | **___** | |

### Critical Issues Found
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### Minor Issues Found
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

### Performance Metrics
- **CPU Usage:** __________%
- **Memory Usage:** __________MB
- **Frame Rate:** __________FPS
- **Latency:** __________ms

### Overall Assessment
- [ ] All critical tests passed
- [ ] Performance within acceptable limits
- [ ] No blocking issues
- [ ] Ready for Phase 7

### Recommendations
___________________________________________
___________________________________________
___________________________________________

---

## Troubleshooting

### Issue: Verification Not Starting
**Possible Causes:**
- Camera permission denied
- No camera available
- Templates not loaded
- Service initialization failed

**Solutions:**
1. Check camera permissions in browser settings
2. Verify camera is connected and working
3. Check console for error messages
4. Reload page and try again

### Issue: Trust Score Always 0
**Possible Causes:**
- No templates available
- Camera not working
- Face not detected
- Model loading failed

**Solutions:**
1. Ensure templates are trained (Phase 5)
2. Check camera is working
3. Position face in camera view
4. Check console for errors

### Issue: State Not Changing
**Possible Causes:**
- Hysteresis preventing transition
- Minimum state duration not met
- Trust score not crossing threshold

**Solutions:**
1. Wait at least 2 seconds
2. Ensure trust score crosses threshold + margin
3. Check console logs for state transition attempts

### Issue: UI Not Updating
**Possible Causes:**
- React rendering issue
- Event system not working
- Context not providing updates

**Solutions:**
1. Check console for errors
2. Verify VerificationProvider is wrapping app
3. Check browser DevTools React tab
4. Reload page

---

## Next Steps After Testing

1. **Document all issues found**
2. **Report critical issues for fixing**
3. **Verify fixes with re-testing**
4. **Proceed to Phase 7** (if all tests pass)

---

**Tester Name:** ___________________________________________  
**Date:** ___________________________________________  
**Environment:** ___________________________________________  
**Overall Result:** ✅ PASS / ❌ FAIL
