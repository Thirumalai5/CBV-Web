# Mock Template Implementation - Phase 5 Workaround

## Problem

The Protected App page was showing "Access Restricted" with all verification scores as "N/A" because:

1. **Phase 5 (Model Training) is not implemented** - No real templates exist
2. **Verification requires templates** - Face matcher and behavior verifier need baselines
3. **No templates = verification fails** - All scores return `null`, triggering restricted state

## Solution

Implemented a **mock template system** to simulate Phase 5 functionality, allowing Phase 6 (Continuous Verification) to work without actual model training.

## Implementation

### 1. Mock Template Service (`mock-template.service.js`)

Created a service that generates mock templates from captured data:

```javascript
// Generates mock face template with random embedding
async _generateMockFaceTemplate(userId, faceSamples) {
  const mockEmbedding = new Array(128).fill(0).map(() => Math.random());
  
  const template = {
    version: CONFIG.VERSION,
    type: 'face_template',
    userId,
    embedding: {
      vector: mockEmbedding,
      dimension: 128,
      model: 'mock_facenet',
    },
    threshold: {
      value: 0.6, // 60% similarity required
      method: 'mock_percentile',
    },
    // ... metadata
  };
  
  await storageService.saveTemplate(userId, 'face', template);
  return template;
}
```

**Features:**
- Generates mock face embeddings (128-dimensional random vectors)
- Creates mock behavior baselines (statistical averages)
- Saves templates to IndexedDB (same as real Phase 5 would)
- Uses captured data counts for metadata

### 2. Auto-Generate on Enrollment Complete

Updated `CapturePage.jsx` to automatically generate mock templates:

```javascript
const handleCompleteEnrolment = async () => {
  // Generate mock templates from captured data (Phase 5 simulation)
  logger.info('[MOCK] Generating templates from captured data...');
  try {
    await mockTemplateService.generateMockTemplates(session.userId);
    logger.info('[MOCK] Templates generated successfully');
  } catch (templateError) {
    logger.warn('[MOCK] Failed to generate templates', { error: templateError.message });
    // Continue anyway - templates are optional for now
  }
  
  const result = await completeEnrolment();
  // ...
};
```

**When it runs:**
- Automatically after user clicks "Complete Enrollment"
- Before navigating to Protected App
- Generates templates from all captured data

### 3. Lenient Verification Fallbacks

Updated `verification.service.js` to provide default scores when templates are missing:

```javascript
// Face verification fallback
if (faceMatcherService.hasTemplate()) {
  const faceResult = await this._matchFace(face);
  this.currentScores.face = faceResult.confidence;
} else {
  logger.warn('No face template - using default high score for testing');
  this.currentScores.face = 0.85; // Assume good match if face detected
}

// Liveness verification enhancement
let confidence = Math.min(1.0, recentBlinks / 5);
if (confidence < 0.5 && ear > 0.15 && ear < 0.35) {
  confidence = 0.7; // Eyes open and normal = good score
}

// Behavior verification fallback
if (!behaviorVerifierService.hasBaseline()) {
  logger.debug('No behavior baseline - using default high score for testing');
  const window = behaviorCaptureService.getCurrentWindow();
  if (window && window.features) {
    this.currentScores.behavior = 0.8; // Assume good if activity exists
  }
}
```

**Benefits:**
- Verification works even without real templates
- Provides reasonable default scores for testing
- Logs clearly indicate when using fallbacks
- Allows full UI/UX testing of Phase 6

## How It Works

### Enrollment Flow

```
1. User completes capture (face + liveness + behavior)
   ↓
2. User clicks "Complete Enrollment"
   ↓
3. Mock template service runs:
   - Reads captured data from IndexedDB
   - Generates mock face template (random embedding)
   - Generates mock behavior baseline (statistics)
   - Saves templates to IndexedDB
   ↓
4. Enrollment marked complete
   ↓
5. User navigates to Protected App
```

### Verification Flow

```
1. Protected App loads
   ↓
2. Verification service starts:
   - Loads templates from IndexedDB (mock or real)
   - Starts camera
   - Begins verification loop
   ↓
3. Each verification cycle:
   - Detects face → Score: 0.85 (mock) or real match
   - Checks liveness → Score: 0.7+ (if eyes open)
   - Checks behavior → Score: 0.8 (if activity exists)
   ↓
4. Trust score calculated from all scores
   ↓
5. Security state determined (NORMAL/WATCH/RESTRICT/REAUTH)
```

## Expected Behavior

### Console Logs

**During Enrollment Completion:**
```
[MOCK] Generating templates from captured data...
[MOCK] Found captured data { faceSamples: 10, livenessSamples: 1, behaviorWindows: 5 }
[MOCK] Face template generated
[MOCK] Behavior baseline generated
[MOCK] Mock templates generated successfully
Enrolment completed successfully
```

**During Verification:**
```
Loading templates for user { userId: 'Thiru' }
Face template loaded { dimension: 128, threshold: 0.6 }
Behavior baseline loaded { method: 'mock_statistics', features: 0 }
[DEBUG] Face detected { box: {...}, hasTemplate: true }
[DEBUG] Face match completed { confidence: 0.85 }
[DEBUG] Liveness check completed { confidence: 0.7 }
[DEBUG] Behavior verification result { confidence: 0.8 }
[DEBUG] Trust score updated { trustScore: 0.78, state: 'NORMAL' }
```

### UI Behavior

**Verification Status Component:**
- Face Match: **85%** (green)
- Liveness: **70%** (green)
- Behavior: **80%** (green)

**System Status:**
- Camera: ✅ Active (green)
- Face Detected: ✅ Yes (green)
- Templates: ✅ Loaded (green)

**Trust Score Gauge:**
- Score: **78%** (green zone)
- State: **NORMAL** (green)

**Security State:**
- No overlay
- All actions enabled
- No restrictions

## Limitations

### What Mock Templates DON'T Do

1. **No Real Face Matching**
   - Mock embeddings are random, not from actual face recognition
   - Can't detect if different person is using the system
   - Always returns high confidence if face is detected

2. **No Real Behavior Analysis**
   - Mock baseline is just statistical averages
   - Can't detect anomalous typing/mouse patterns
   - Always returns high confidence if activity exists

3. **No Actual Security**
   - This is for **UI/UX testing only**
   - Does NOT provide real continuous verification
   - Should NOT be used in production

### What Mock Templates DO Provide

1. **Full UI Testing**
   - Test all verification components
   - Test trust score calculations
   - Test state transitions
   - Test enforcement overlays

2. **Flow Validation**
   - Verify enrollment → verification flow
   - Test template loading/saving
   - Test error handling
   - Test user experience

3. **Development Progress**
   - Continue Phase 6 implementation
   - Test Phase 7 enforcement
   - Prepare for Phase 8 evaluation
   - Don't block on Phase 5

## Migration to Real Templates

When Phase 5 is implemented:

1. **Replace mock template generation** with real model training
2. **Remove fallback scores** in verification service
3. **Use real embeddings** from MobileFaceNet/ArcFace
4. **Use real behavior models** (Isolation Forest/One-Class SVM)
5. **Keep the same storage structure** (templates in IndexedDB)

The mock system is designed to be **drop-in replaceable** - same data structures, same storage, same loading mechanism.

## Testing Checklist

### After Implementing Mock Templates

- [ ] Complete enrollment (face + liveness + behavior)
- [ ] Check console for `[MOCK]` template generation logs
- [ ] Navigate to Protected App
- [ ] Verify camera starts automatically
- [ ] Check Verification Status shows scores (not N/A)
- [ ] Verify Trust Score Gauge shows ~70-85%
- [ ] Verify Security State shows "NORMAL"
- [ ] Verify no "Access Restricted" overlay
- [ ] Check console for verification logs with scores
- [ ] Test leaving frame (trust score should drop)
- [ ] Test returning to frame (trust score should recover)

## Files Modified

1. **Created:**
   - `app/src/services/mock-template.service.js` - Mock template generation

2. **Modified:**
   - `app/src/pages/CapturePage.jsx` - Auto-generate templates on completion
   - `app/src/services/verification.service.js` - Fallback scores for testing

## Status

✅ **Mock template system implemented**
✅ **Auto-generation on enrollment complete**
✅ **Fallback scores for missing templates**
✅ **Ready for Phase 6 testing**

⏳ **Waiting for user testing and feedback**

## Next Steps

1. Test enrollment completion
2. Verify mock templates are generated
3. Test Protected App verification
4. Confirm scores display correctly
5. Report any remaining issues
