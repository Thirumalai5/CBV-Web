# Phase 7 - Enforcement and Recovery Testing Guide

## Quick Start

### 1. Start Development Server
```bash
cd CBV-System/app
npm start
```

Access at: `https://localhost:8080`

### 2. Navigate to Protected App
1. Click "Protected App" in navigation
2. Click "🚀 Initiate Verification"
3. Allow camera access
4. Observe trust score and state

---

## Test Scenarios

### ✅ Test 1: Visual Enforcement (Blur Overlay)

**Objective**: Verify blur increases as trust drops

**Steps**:
1. Start verification (trust should be ~70-80%, NORMAL state)
2. Cover camera with hand
3. Wait 5-10 seconds
4. Observe blur increasing
5. Uncover camera
6. Observe blur decreasing

**Expected Results**:
- ✅ NORMAL (≥70%): No blur, no banner
- ✅ WATCH (50-70%): 3px blur, yellow warning banner
- ✅ RESTRICT (30-50%): 8px blur, red warning banner
- ✅ REAUTH (<30%): 15px blur (with pulse), dark red banner, modal opens

**Success Criteria**:
- Blur transitions smoothly (0.5s)
- Banner appears/disappears correctly
- Trust score updates in real-time
- No performance issues

---

### ✅ Test 2: Warning Banner

**Objective**: Verify state-specific warning banners

**Steps**:
1. Start verification
2. Let trust drop to WATCH state (50-70%)
3. Observe yellow warning banner at top
4. Click "Dismiss" button
5. Let trust drop to RESTRICT state (30-50%)
6. Observe red warning banner
7. Click "Re-Authenticate Now" button

**Expected Results**:
- ✅ WATCH banner: Yellow, dismissible, shows trust score
- ✅ RESTRICT banner: Red, not dismissible, re-auth button
- ✅ REAUTH banner: Dark red, countdown timer, pulsing
- ✅ Banner slides down smoothly
- ✅ Trust score displayed correctly

**Success Criteria**:
- Correct banner for each state
- Dismiss works in WATCH
- Re-auth button opens modal
- Countdown timer accurate

---

### ✅ Test 3: Form Blocking

**Objective**: Verify forms blocked in RESTRICT/REAUTH

**Steps**:
1. Start verification
2. Scroll to "Quick Transfer" card
3. Enter recipient and amount
4. Let trust drop to RESTRICT state
5. Try to click "Transfer Funds" button
6. Observe button disabled
7. Try to submit form (should be blocked)

**Expected Results**:
- ✅ NORMAL: Form enabled, can submit
- ✅ WATCH: Form enabled, confirmation dialog
- ✅ RESTRICT: Form disabled, "Transfer Blocked" text
- ✅ REAUTH: Form disabled, overlay blocks interaction
- ✅ Blocked message appears if submission attempted

**Success Criteria**:
- Form submission prevented
- Visual feedback provided
- No console errors
- Overlay message clear

---

### ✅ Test 4: Re-Authentication Modal

**Objective**: Complete full re-authentication flow

**Steps**:
1. Start verification
2. Let trust drop to REAUTH state (<30%)
3. Modal should open automatically
4. Observe 30-second countdown timer
5. Enter password: `thiru0509`
6. Click "Continue"
7. Position face in camera frame
8. Click "Capture Face"
9. Wait for face detection
10. Blink naturally for liveness check
11. Click "Check Liveness"
12. Observe success and modal close

**Expected Results**:
- ✅ Modal opens automatically in REAUTH
- ✅ Countdown timer counts down from 30
- ✅ Password verification works
- ✅ Face capture shows video feed
- ✅ Face detection indicator appears
- ✅ Liveness check detects blinks
- ✅ Success closes modal
- ✅ Trust score resets to ~70%
- ✅ Verification restarts

**Success Criteria**:
- All 3 steps complete successfully
- Camera access works
- Trust score resets
- No errors in console
- Smooth transitions

---

### ✅ Test 5: Recovery Monitoring

**Objective**: Verify 60-second monitoring after re-auth

**Steps**:
1. Complete re-authentication (Test 4)
2. Observe trust score after re-auth
3. Check console for "Started recovery monitoring" log
4. Wait 60 seconds
5. Check console for "Recovery monitoring period ended" log
6. Observe normal operation resumes

**Expected Results**:
- ✅ Trust score resets to ~70% after re-auth
- ✅ Monitoring flag set for 60 seconds
- ✅ Console logs monitoring start/end
- ✅ Normal operation after 60 seconds

**Success Criteria**:
- Monitoring period tracked correctly
- No issues during monitoring
- Normal operation after monitoring
- Logs show correct timing

---

### ✅ Test 6: Skip Options

**Objective**: Test fallback authentication

**Steps**:
1. Let trust drop to REAUTH
2. Modal opens
3. Enter password: `thiru0509`
4. Click "Continue"
5. On face capture step, click "Skip (Password Only)"
6. Observe modal closes
7. Verify trust score resets

**Expected Results**:
- ✅ Skip button available on face step
- ✅ Skip button available on liveness step
- ✅ Password-only auth works
- ✅ Trust score resets
- ✅ Verification restarts

**Success Criteria**:
- Fallback authentication works
- No errors
- Trust score resets correctly

---

### ✅ Test 7: Modal Timeout

**Objective**: Verify modal timeout behavior

**Steps**:
1. Let trust drop to REAUTH
2. Modal opens with 30s countdown
3. Wait without taking action
4. Observe countdown reach 0
5. Observe timeout message

**Expected Results**:
- ✅ Countdown displays correctly
- ✅ Progress bar decreases
- ✅ At 0 seconds, timeout message appears
- ✅ Modal closes after timeout

**Success Criteria**:
- Countdown accurate
- Timeout handled gracefully
- Clear error message
- Modal closes properly

---

### ✅ Test 8: Multiple State Transitions

**Objective**: Test rapid state changes

**Steps**:
1. Start verification (NORMAL)
2. Cover camera → WATCH
3. Wait → RESTRICT
4. Wait → REAUTH
5. Re-authenticate → NORMAL
6. Repeat cycle

**Expected Results**:
- ✅ Smooth transitions between states
- ✅ Blur updates correctly
- ✅ Banners change appropriately
- ✅ No visual glitches
- ✅ No memory leaks

**Success Criteria**:
- All transitions smooth
- No performance degradation
- No console errors
- UI remains responsive

---

### ✅ Test 9: Camera Permission Denied

**Objective**: Handle camera permission denial

**Steps**:
1. Block camera permissions in browser
2. Try to start verification
3. Observe error handling
4. Try to open re-auth modal
5. Observe camera error message

**Expected Results**:
- ✅ Clear error message about camera
- ✅ Graceful degradation
- ✅ Option to retry
- ✅ No crashes

**Success Criteria**:
- Error handled gracefully
- User informed clearly
- Can retry after granting permission
- No console errors

---

### ✅ Test 10: Responsive Design

**Objective**: Test on different screen sizes

**Steps**:
1. Test on desktop (1920x1080)
2. Test on tablet (768x1024)
3. Test on mobile (375x667)
4. Verify all components responsive

**Expected Results**:
- ✅ Blur overlay works on all sizes
- ✅ Warning banner responsive
- ✅ Modal fits on mobile
- ✅ Forms usable on all sizes
- ✅ No horizontal scroll

**Success Criteria**:
- All components responsive
- Text readable on mobile
- Buttons accessible
- No layout issues

---

## Performance Testing

### CPU Usage
**Target**: < 10% additional  
**Test**: Monitor CPU during enforcement  
**Tool**: Browser DevTools Performance tab

### Memory Usage
**Target**: < 50 MB additional  
**Test**: Monitor memory during state changes  
**Tool**: Browser DevTools Memory tab

### Blur Performance
**Target**: 60 FPS maintained  
**Test**: Check FPS during blur transitions  
**Tool**: Browser DevTools Performance monitor

### Modal Load Time
**Target**: < 100ms  
**Test**: Time from REAUTH to modal visible  
**Tool**: Console timestamps

---

## Browser Compatibility

### ✅ Chrome/Edge
- Full support expected
- Test all features

### ✅ Firefox
- Full support expected
- Test all features

### ✅ Safari
- Partial support (WebGL limitations)
- Test core features

---

## Common Issues & Solutions

### Issue: Blur not appearing
**Solution**: Check CSS filter support, try different browser

### Issue: Modal not opening
**Solution**: Check console for errors, verify trust score < 0.3

### Issue: Camera not working
**Solution**: Check permissions, ensure HTTPS, try different browser

### Issue: Form blocking not working
**Solution**: Check console for service initialization, verify state

### Issue: Trust score not updating
**Solution**: Verify verification is running, check console logs

---

## Success Checklist

- [ ] ✅ Blur overlay works smoothly
- [ ] ✅ Warning banners display correctly
- [ ] ✅ Form blocking prevents submissions
- [ ] ✅ Re-auth modal opens in REAUTH
- [ ] ✅ Password verification works
- [ ] ✅ Face capture works
- [ ] ✅ Liveness check works
- [ ] ✅ Trust score resets after re-auth
- [ ] ✅ Recovery monitoring tracks 60s
- [ ] ✅ Skip options work
- [ ] ✅ Timeout handled gracefully
- [ ] ✅ State transitions smooth
- [ ] ✅ No performance issues
- [ ] ✅ Responsive on all devices
- [ ] ✅ No console errors

---

## Reporting Issues

If you find any issues during testing:

1. **Note the scenario** (which test)
2. **Capture console logs** (F12 → Console)
3. **Take screenshots** (especially of errors)
4. **Note browser/OS** (Chrome 120 on macOS, etc.)
5. **Describe steps to reproduce**

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark Phase 7 as tested
2. ✅ Document any issues found
3. ✅ Fix critical issues
4. ✅ Proceed to Phase 8 (Evaluation & Demo)

---

**Testing Guide Version**: 1.0  
**Created**: January 8, 2026  
**Status**: Ready for Testing
