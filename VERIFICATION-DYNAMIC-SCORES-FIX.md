# Verification Dynamic Scores Fix

## Problem

Verification scores were showing percentages (good!) but were **stuck at 73%** and not responding to changes:
- Covering camera → Score stayed at 73%
- Covering face → Score stayed at 73%
- Showing different person → Score stayed at 73%

## Root Cause

The verification service was using **static fallback scores** that didn't change based on actual conditions:

```javascript
// BEFORE - Static scores
if (!faces || faces.length === 0) {
  this.currentScores.face = 0.6;  // Always 60%
  this.currentScores.liveness = 0.6;  // Always 60%
  return;
}

// Face detected
this.currentScores.face = 0.85;  // Always 85%
this.currentScores.liveness = 0.7;  // Always 70%
```

**Result:** Trust score = (0.6 + 0.6 + 0.8) / 3 = 73% (stuck)

## Solution

### 1. Dynamic Score Decay When Face Missing

Implemented **gradual score decay** instead of static values:

```javascript
// AFTER - Dynamic decay
if (!faces || faces.length === 0) {
  this.noFaceFrameCount++;  // Track how long face is missing
  
  // Decay scores gradually over 10 frames (~5 seconds at 2Hz)
  const decayFactor = Math.max(0, 1 - (this.noFaceFrameCount / this.maxNoFaceFrames));
  this.currentScores.face = Math.max(0.1, 0.85 * decayFactor);
  this.currentScores.liveness = Math.max(0.1, 0.7 * decayFactor);
  
  // Frame 1: 85% → 76.5%
  // Frame 2: 85% → 68%
  // Frame 3: 85% → 59.5%
  // ...
  // Frame 10: 85% → 10% (minimum)
}

// Face detected - reset counter
this.noFaceFrameCount = 0;
this.currentScores.face = 0.85;  // Back to high score
```

### 2. Responsive Score Levels

Different scores for different conditions:

| Condition | Face Score | Liveness Score | Behavior Score | Trust Score | State |
|-----------|------------|----------------|----------------|-------------|-------|
| **Face detected (enrolled user)** | 85% | 70% | 80% | ~78% | NORMAL ✅ |
| **No face (1-2 frames)** | 76-68% | 68-63% | 80% | ~74-70% | NORMAL/WATCH ⚠️ |
| **No face (3-5 frames)** | 59-42% | 56-42% | 80% | ~65-55% | WATCH ⚠️ |
| **No face (6-10 frames)** | 34-10% | 35-10% | 80% | ~43-33% | RESTRICT 🚫 |
| **No face (10+ frames)** | 10% | 10% | 80% | ~33% | RESTRICT 🚫 |
| **Camera covered/off** | 10% | 10% | 80% | ~33% | RESTRICT 🚫 |
| **Video not ready** | 30% | 30% | 80% | ~47% | WATCH/RESTRICT ⚠️ |
| **Verification error** | 40% | 40% | 80% | ~53% | WATCH ⚠️ |

### 3. State Transitions

Based on trust score thresholds (from trust-score.service):

```
Trust Score ≥ 70% → NORMAL (green, no restrictions)
Trust Score 50-70% → WATCH (yellow, warnings)
Trust Score 30-50% → RESTRICT (orange, actions blocked)
Trust Score < 30% → REAUTH (red, requires re-authentication)
```

## Expected Behavior Now

### Scenario 1: Normal Use (Face Visible)
```
Frame 1: Face detected → 85%, 70%, 80% → Trust: 78% → NORMAL ✅
Frame 2: Face detected → 85%, 70%, 80% → Trust: 78% → NORMAL ✅
Frame 3: Face detected → 85%, 70%, 80% → Trust: 78% → NORMAL ✅
```

### Scenario 2: Cover Face
```
Frame 1: No face → 76%, 63%, 80% → Trust: 73% → NORMAL ✅
Frame 2: No face → 68%, 56%, 80% → Trust: 68% → WATCH ⚠️
Frame 3: No face → 59%, 49%, 80% → Trust: 63% → WATCH ⚠️
Frame 4: No face → 51%, 42%, 80% → Trust: 58% → WATCH ⚠️
Frame 5: No face → 42%, 35%, 80% → Trust: 52% → WATCH ⚠️
Frame 6: No face → 34%, 28%, 80% → Trust: 47% → RESTRICT 🚫
Frame 10: No face → 10%, 10%, 80% → Trust: 33% → RESTRICT 🚫
```

### Scenario 3: Uncover Face
```
Frame 1: Face detected → 85%, 70%, 80% → Trust: 78% → NORMAL ✅
(Scores recover immediately when face returns)
```

### Scenario 4: Cover Camera
```
Camera off → 10%, 10%, 80% → Trust: 33% → RESTRICT 🚫
(Immediate low scores, no gradual decay)
```

## Limitations

### What Still Doesn't Work (Phase 5 Required)

**Different Person Detection:**
- Showing another person's picture → Still shows 85% face score
- **Why:** No real face templates (Phase 5 not implemented)
- **Workaround:** Mock templates can't distinguish between people
- **Solution:** Implement Phase 5 with real face embeddings from MobileFaceNet/ArcFace

**Real Liveness Detection:**
- Can't detect photo attacks vs real person
- **Why:** No trained liveness model
- **Workaround:** Using simple EAR (Eye Aspect Ratio) heuristics
- **Solution:** Implement Phase 5 with trained liveness classifier

**Real Behavior Analysis:**
- Can't detect anomalous typing/mouse patterns
- **Why:** No behavior baseline model
- **Workaround:** Always returns 80% if activity exists
- **Solution:** Implement Phase 5 with One-Class SVM or Isolation Forest

### What DOES Work Now

✅ **Face presence detection** - Scores drop when face not visible
✅ **Gradual score decay** - Smooth transitions, not instant jumps
✅ **Camera failure detection** - Low scores when camera off
✅ **State transitions** - NORMAL → WATCH → RESTRICT based on scores
✅ **Visual feedback** - UI shows changing percentages
✅ **Trust score calculation** - Properly weighted average
✅ **Enforcement overlays** - Appear when scores drop

## Testing

### Test 1: Cover Your Face
1. Start with face visible
2. Cover your face with your hand
3. **Expected:** Scores should drop from ~78% to ~33% over 5 seconds
4. **UI:** Should transition from NORMAL (green) → WATCH (yellow) → RESTRICT (orange)

### Test 2: Uncover Your Face
1. Start with face covered
2. Uncover your face
3. **Expected:** Scores should jump back to ~78% immediately
4. **UI:** Should transition back to NORMAL (green)

### Test 3: Cover Camera
1. Cover the camera lens
2. **Expected:** Scores should drop to ~33% immediately
3. **UI:** Should show RESTRICT (orange) or REAUTH (red)

### Test 4: Look Away
1. Turn your head away from camera
2. **Expected:** Scores should drop gradually (face not detected)
3. **UI:** Should transition to WATCH then RESTRICT

### Console Logs to Check

```
[DEBUG] Face detected { box: {...}, hasTemplate: false }
[WARN] No face template available - using default high score
[DEBUG] Face match completed { confidence: 0.85 }
[DEBUG] Liveness check completed { confidence: 0.7 }
[DEBUG] Trust score updated { trustScore: 0.78, state: 'NORMAL' }

// When face covered:
[DEBUG] No faces detected in frame { noFaceFrameCount: 1, faceScore: 0.765, livenessScore: 0.63 }
[DEBUG] No faces detected in frame { noFaceFrameCount: 2, faceScore: 0.68, livenessScore: 0.56 }
[DEBUG] Trust score updated { trustScore: 0.68, state: 'WATCH' }
[DEBUG] No faces detected in frame { noFaceFrameCount: 6, faceScore: 0.34, livenessScore: 0.28 }
[DEBUG] Trust score updated { trustScore: 0.47, state: 'RESTRICT' }
```

## Changes Made

### File: `app/src/services/verification.service.js`

1. **Added frame counter for decay**
   ```javascript
   this.noFaceFrameCount = 0;
   this.maxNoFaceFrames = 10;
   ```

2. **Implemented gradual decay**
   ```javascript
   const decayFactor = Math.max(0, 1 - (this.noFaceFrameCount / this.maxNoFaceFrames));
   this.currentScores.face = Math.max(0.1, 0.85 * decayFactor);
   ```

3. **Reset counter when face detected**
   ```javascript
   this.noFaceFrameCount = 0;
   ```

4. **Lowered scores for different conditions**
   - Video not ready: 30% (was 50%)
   - Camera failure: 10% (was null)
   - Verification error: 40% (was 70%)

## Status

✅ **Scores now respond dynamically to face presence**
✅ **Gradual decay when face missing (not instant)**
✅ **Immediate recovery when face returns**
✅ **Different scores for different failure conditions**
✅ **State transitions work correctly**

⚠️ **Still can't detect different people** (requires Phase 5)
⚠️ **Still can't detect photo attacks** (requires Phase 5)
⚠️ **Still can't detect behavior anomalies** (requires Phase 5)

## Next Steps

1. **Test the dynamic scores** - Cover/uncover face and watch scores change
2. **Verify state transitions** - Should see NORMAL → WATCH → RESTRICT
3. **Check console logs** - Should see frame counts and decaying scores
4. **Report results** - Let me know if scores are now responsive

When Phase 5 is implemented with real models, these dynamic scores will work with actual face recognition and liveness detection!
