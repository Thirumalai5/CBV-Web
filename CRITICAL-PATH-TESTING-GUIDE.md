# Critical Path Testing Guide

## Overview
This guide provides step-by-step instructions for testing the bundle optimization and camera fixes.

---

## Test 1: Home Page Load & Bundle Optimization

### Objective
Verify initial load is under 244 KB target and lazy loading works.

### Steps

1. **Open Chrome DevTools**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to **Network** tab
   - Check "Disable cache"
   - Filter by "JS"

2. **Navigate to Application**
   - Open: `https://localhost:8080`
   - Watch Network tab during load

3. **Verify Initial Load**
   - Look for these files loaded initially:
     - `runtime.[hash].js` (~3 KB)
     - `react-vendor.[hash].js` (~136 KB)
     - `vendors.[hash].js` (~46 KB)
     - `main.[hash].js` (~212 KB)
     - `HomePage.chunk.js` (~28 KB)
   
4. **Check Gzip Encoding**
   - Click on any JS file in Network tab
   - Go to **Headers** section
   - Look for: `Content-Encoding: gzip`
   - Verify **Size** column shows smaller transfer size

5. **Calculate Total Initial Load**
   - Add up the **transferred** sizes (not uncompressed)
   - Should be approximately **141 KB** ✅
   - Target was 244 KB, so we're 42% under target ✅

### Expected Results
- ✅ Initial load: ~141 KB (gzipped)
- ✅ Home page loads in ~1 second
- ✅ No console errors
- ✅ Gzip encoding active
- ✅ No TensorFlow/ML libraries loaded yet

### Screenshot Checklist
- [ ] Network tab showing initial chunks
- [ ] Total transfer size ~141 KB
- [ ] Content-Encoding: gzip header

---

## Test 2: Navigation & Lazy Loading

### Objective
Verify pages load on-demand with lazy loading indicators.

### Steps

1. **Click "Register" Button**
   - Watch Network tab
   - Should see: `RegistrationPage.chunk.js` load (~30 KB)
   - Should see loading indicator briefly
   - Page should load smoothly

2. **Navigate Back to Home**
   - Click "Home" in navbar
   - Should be instant (cached)
   - No new network requests

3. **Click "Start Registration"**
   - Should navigate to Registration page
   - Should be instant (already loaded)

### Expected Results
- ✅ Loading indicator appears briefly
- ✅ Page chunks load on-demand
- ✅ Subsequent navigation is instant
- ✅ No console errors

---

## Test 3: Capture Page - Camera & Face Detection

### Objective
Verify camera doesn't reset and face capture works smoothly.

### Critical Test Steps

#### 3.1 Initial Camera Start

1. **Navigate to Capture Page**
   - Click "Go to Capture" or navigate to `/capture`
   - Watch Network tab
   - Should see ML chunks load:
     - `tensorflow.[hash].js` (~1.73 MiB → ~282 KB gzipped)
     - `face-models.[hash].js` (~130 KB → ~43 KB gzipped)
     - `mediapipe.[hash].js` (~63 KB → ~21 KB gzipped)
     - `CapturePage.chunk.js` (~180 KB → ~60 KB gzipped)

2. **Click "Start Capture" Button**
   - Camera permission dialog should appear
   - Click "Allow"
   - Camera should start
   - Video feed should appear
   - **Watch carefully**: Camera should NOT flicker or reset

3. **Observe Console Logs**
   - Open Console tab in DevTools
   - Should see:
     - "Initializing face capture..."
     - "Camera started successfully"
     - "Face capture started"
   - Should NOT see repeated initialization messages

#### 3.2 Face Detection & Quality Feedback

4. **Position Your Face**
   - Center your face in the frame
   - Ensure good lighting
   - Look at camera

5. **Watch for Detection Box**
   - Red box should appear around face (poor quality)
   - Box should turn **green** when quality is good
   - Quality feedback should update in real-time

6. **Verify Quality Indicators**
   - Should see metrics:
     - Confidence: ~80-100%
     - Brightness: ~100-200
     - Sharpness: ~50-100
   - Message should say "Quality good ✓" when green

#### 3.3 Auto-Capture (CRITICAL TEST)

7. **Wait for Auto-Capture**
   - When box turns green, wait 2-3 seconds
   - Sample should be captured automatically
   - **CRITICAL**: Watch camera feed carefully
   - Camera should **NOT reset** or flicker ✅
   - Video should continue smoothly ✅

8. **Verify Sample Captured**
   - Sample count should increment (1/10)
   - Thumbnail should appear in "Captured Samples"
   - Progress bar should update
   - Quality percentage should show on thumbnail

9. **Repeat Auto-Capture**
   - Keep face in frame with good quality
   - Wait for multiple auto-captures (3-5 samples)
   - **CRITICAL**: Camera should NEVER reset between captures ✅
   - Video feed should remain stable ✅

10. **Check Console Logs**
    - Should see: "Face sample captured" messages
    - Should NOT see: "Camera started" repeatedly
    - Should NOT see: "Initializing face capture" repeatedly

#### 3.4 Stop and Restart

11. **Click "Stop Capture"**
    - Intervals should stop
    - Detection box should disappear
    - **CRITICAL**: Camera should stay on ✅
    - Video feed should continue ✅

12. **Click "Start Capture" Again**
    - Should resume immediately
    - **CRITICAL**: Camera should NOT reset ✅
    - Should NOT see permission dialog again
    - Detection should resume immediately

13. **Check Console Logs**
    - Should see: "Face capture already initialized, skipping..."
    - Should see: "Face capture started"
    - Should NOT see: "Camera started" again

### Expected Results

✅ **Camera Stability**:
- Camera starts once on first "Start Capture"
- Camera NEVER resets during auto-capture
- Camera NEVER resets when stopping/restarting
- Video feed is smooth and continuous

✅ **Face Detection**:
- Detection box appears around face
- Box turns green when quality good
- Quality metrics update in real-time

✅ **Auto-Capture**:
- Samples captured automatically when quality good
- No camera reset between captures
- Samples accumulate correctly
- Progress bar updates

✅ **Console Logs**:
- No repeated initialization messages
- No repeated camera start messages
- Clean, expected log flow

### Common Issues to Watch For

❌ **Camera Reset Symptoms**:
- Video feed flickers
- Brief black screen
- Permission dialog appears again
- Console shows "Camera started" repeatedly

❌ **Initialization Issues**:
- Console shows "Initializing face capture" repeatedly
- Multiple "Camera started" messages
- Errors about camera already in use

If you see any of these, the fix didn't work properly.

---

## Test 4: Network Performance Verification

### Objective
Verify bundle sizes and loading performance.

### Steps

1. **Clear Cache and Reload**
   - In DevTools Network tab
   - Right-click → "Clear browser cache"
   - Reload page (`Cmd+R` or `Ctrl+R`)

2. **Measure Initial Load**
   - Note "DOMContentLoaded" time (should be < 2s)
   - Note "Load" time (should be < 3s)
   - Check total transferred size

3. **Navigate to Capture Page**
   - Note additional load time for ML chunks
   - Should be ~2-3 seconds for ML libraries
   - Total transferred should be ~487 KB

4. **Check Caching**
   - Navigate back to Home
   - Navigate to Capture again
   - Should be instant (from cache)
   - Network tab should show "(from disk cache)"

### Expected Results
- ✅ Initial load: < 3 seconds
- ✅ ML chunks load: < 3 seconds
- ✅ Cached navigation: instant
- ✅ Total transfer: ~487 KB (all pages visited)

---

## Test 5: Console Error Check

### Objective
Ensure no errors or warnings in console.

### Steps

1. **Clear Console**
   - Click "Clear console" button

2. **Navigate Through App**
   - Home → Registration → Capture → Settings
   - Start face capture
   - Capture a few samples
   - Stop capture

3. **Review Console**
   - Should see info/debug logs (normal)
   - Should NOT see errors (red)
   - Should NOT see warnings (yellow) except webpack warnings

### Expected Results
- ✅ No red errors
- ✅ No unexpected warnings
- ✅ Clean console output

---

## Success Criteria Summary

### Bundle Optimization ✅
- [ ] Initial load: 141 KB (42% under 244 KB target)
- [ ] Code splitting: 12 chunks visible in Network tab
- [ ] Lazy loading: Pages load on-demand
- [ ] Gzip compression: Content-Encoding header present
- [ ] ML libraries: Load only on Capture page

### Camera Stability ✅
- [ ] Camera starts once on first capture
- [ ] No reset during frame capture
- [ ] No reset during auto-capture
- [ ] No reset when stopping/restarting
- [ ] Video feed smooth and continuous

### Face Capture Functionality ✅
- [ ] Face detection works
- [ ] Quality feedback updates
- [ ] Green box appears when quality good
- [ ] Auto-capture works
- [ ] Samples accumulate correctly
- [ ] Progress bar updates

### Performance ✅
- [ ] Initial load < 3 seconds
- [ ] ML load < 3 seconds
- [ ] Cached navigation instant
- [ ] No console errors

---

## Troubleshooting

### If Camera Resets
1. Check console for repeated "Camera started" messages
2. Check for repeated "Initializing face capture" messages
3. Verify `isInitialized` state is working
4. Verify `cameraService.isRunning()` check is working

### If Bundle Too Large
1. Check Network tab for unexpected large files
2. Verify Gzip encoding is active
3. Check if ML libraries loading on initial page
4. Verify code splitting is working

### If Lazy Loading Not Working
1. Check for import errors in console
2. Verify Suspense wrapper is present
3. Check if loading indicator appears
4. Verify chunks load in Network tab

---

## Reporting Results

After testing, report:

1. **Bundle Optimization**:
   - Initial load size (should be ~141 KB)
   - Screenshot of Network tab

2. **Camera Stability**:
   - Did camera reset? (should be NO)
   - Screenshot of console logs

3. **Face Capture**:
   - Did auto-capture work? (should be YES)
   - How many samples captured?

4. **Any Issues**:
   - Errors in console?
   - Unexpected behavior?
   - Performance problems?

---

## Quick Test Checklist

For a quick verification:

- [ ] Open https://localhost:8080
- [ ] Check Network tab: ~141 KB initial load
- [ ] Navigate to Capture page
- [ ] Click "Start Capture"
- [ ] Allow camera
- [ ] Wait for green box
- [ ] Watch for auto-capture (camera should NOT reset)
- [ ] Capture 3-5 samples (camera should stay stable)
- [ ] Click "Stop Capture" (camera should stay on)
- [ ] Click "Start Capture" again (no camera reset)
- [ ] Check console: no errors

If all above pass: ✅ **TESTS PASSED**

---

**Testing Time**: ~10-15 minutes
**Priority**: Critical path only
**Status**: Ready for testing
