# Phase 5 - Testing Guide

## Quick Start Testing

### 1. Test Python Training Tools

#### Setup Environment
```bash
cd tools
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Test Data Loader
```bash
# First, export data from browser (Settings page)
# Then test loading:
python utils/data_loader.py path/to/cbv_export_Thiru_*.json
```

Expected output:
```
=== Export Statistics ===
userId: Thiru
exportDate: 2024-01-01T...
totalFaceSamples: 100
totalLivenessSamples: 3
totalBehaviorWindows: 59
...

=== Loading Face Images ===
Loaded 100 face images
First image shape: (480, 640, 3)

=== Extracting Behavior Features ===
Feature matrix shape: (59, 20)
Feature range: [0.00, 500.00]
```

#### Test Face Template Generation
```bash
python face_template_generator.py path/to/export.json --output test_face.json
```

Expected output:
```
======================================================================
CBV System - Face Template Generation
======================================================================

User: Thiru
Face samples: 100

Using 100 face samples
Computing embeddings for 100 images
...
Calculated centroid: shape (261,)
Distance statistics:
  Mean: 0.1234
  Std: 0.0456
  Threshold (95th percentile): 0.1500

======================================================================
Generation Complete!
======================================================================
Template saved to: test_face.json
Samples used: 100
Embedding dimension: 261
Threshold: 0.1500
```

#### Test Behavior Baseline Training
```bash
python behavior_baseline_trainer.py path/to/export.json --output test_behavior.json
```

Expected output:
```
======================================================================
CBV System - Behavior Baseline Training
======================================================================

User: Thiru
Behavior windows: 59

Feature matrix shape: (59, 20)
Calculating statistical baseline on 59 samples
Statistical baseline calculated

======================================================================
Training Complete!
======================================================================
Template saved to: test_behavior.json
Method: statistical
Samples used: 59
Features per sample: 20
```

#### Test Full Training Pipeline
```bash
python train_models.py path/to/export.json
```

Expected output:
```
======================================================================
CBV SYSTEM - MODEL TRAINING
======================================================================

Loading export from: ...

======================================================================
EXPORT STATISTICS
======================================================================
User ID: Thiru
Export Date: 2024-01-01T...
Face Samples: 100
Liveness Samples: 3
Behavior Windows: 59
Export Size: 2.50 MB

======================================================================
STEP 1: FACE TEMPLATE GENERATION
======================================================================
...
✓ Face template saved: data/templates/face_template.json

======================================================================
STEP 2: BEHAVIOR BASELINE TRAINING
======================================================================
...
✓ Behavior baseline saved: data/templates/behavior_baseline.json

======================================================================
TRAINING COMPLETE
======================================================================
Output directory: data/templates

Generated files:
  ✓ data/templates/face_template.json
  ✓ data/templates/behavior_baseline.json

Next steps:
  1. Review generated templates
  2. Load templates into browser (Phase 6)
  3. Test verification with templates
======================================================================
```

### 2. Test Browser Services

#### Test Template Loader Service

Open browser console and test:

```javascript
// Import template loader
import templateLoaderService from './services/template-loader.service.js';

// Load templates for current user
await templateLoaderService.loadTemplates('Thiru');

// Check status
console.log('Templates loaded:', templateLoaderService.isTemplatesLoaded());
console.log('Has face template:', templateLoaderService.hasFaceTemplate());
console.log('Has behavior baseline:', templateLoaderService.hasBehaviorBaseline());

// Get statistics
console.log('Statistics:', templateLoaderService.getStatistics());
```

Expected output:
```javascript
{
  faceTemplate: {
    available: true,
    dimension: 261,
    threshold: 0.15,
    samplesUsed: 100,
    createdAt: "2024-01-01T..."
  },
  behaviorBaseline: {
    available: true,
    method: "statistical",
    windowsUsed: 59,
    createdAt: "2024-01-01T..."
  }
}
```

#### Test Face Matcher Service

```javascript
import faceMatcherService from './services/face-matcher.service.js';
import templateLoaderService from './services/template-loader.service.js';

// Load template
await templateLoaderService.loadTemplates('Thiru');
const faceTemplate = templateLoaderService.getFaceTemplate();
faceMatcherService.setTemplate(faceTemplate);

// Test with a face image (from video or canvas)
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
// ... draw face image to canvas
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Match
const result = faceMatcherService.match(imageData);
console.log('Match result:', result);
```

Expected output:
```javascript
{
  isMatch: true,
  similarity: 0.85,
  distance: 0.15,
  threshold: 0.15,
  confidence: 0.85,
  timestamp: 1234567890
}
```

#### Test Behavior Verifier Service

```javascript
import behaviorVerifierService from './services/behavior-verifier.service.js';
import templateLoaderService from './services/template-loader.service.js';

// Load baseline
await templateLoaderService.loadTemplates('Thiru');
const behaviorBaseline = templateLoaderService.getBehaviorBaseline();
behaviorVerifierService.setBaseline(behaviorBaseline);

// Test with a behavior window
const window = {
  features: {
    keystroke: {
      dwellTimes: [100, 120, 110, 130],
      flightTimes: [150, 160, 140, 170]
    },
    mouse: {
      velocities: [200, 220, 210, 230],
      curvatures: [0.5, 0.6, 0.4, 0.7]
    }
  }
};

// Verify
const result = behaviorVerifierService.verify(window);
console.log('Verification result:', result);
```

Expected output:
```javascript
{
  isAccepted: true,
  confidence: 0.78,
  anomalyScore: 0.22,
  method: "statistical",
  deviations: [...],
  timestamp: 1234567890
}
```

## Integration Testing

### End-to-End Workflow

1. **Enroll in Browser**
   - Navigate to Registration page
   - Complete enrollment (face, liveness, behavior)
   - Verify data is captured

2. **Export Data**
   - Go to Settings page
   - Click "Export Data"
   - Save file: `cbv_export_Thiru_2024-01-01.json`

3. **Train Models**
   ```bash
   cd tools
   source venv/bin/activate
   python train_models.py ../data/cbv_export_Thiru_2024-01-01.json
   ```

4. **Import Templates** (Manual for now, UI in Phase 6)
   - Open browser console
   - Load template JSON files
   - Import using templateLoaderService

5. **Test Verification**
   - Test face matching with live camera
   - Test behavior verification with live input
   - Verify results are reasonable

## Troubleshooting

### Python Issues

**"ModuleNotFoundError: No module named 'numpy'"**
- Solution: Activate virtual environment and install dependencies
  ```bash
  source venv/bin/activate
  pip install -r requirements.txt
  ```

**"No face images found in export"**
- Solution: Ensure enrollment was completed in browser
- Check export file contains `faceSamples` array
- Verify images are base64 encoded

**"Only X samples available"**
- Warning only - training will proceed
- For better results, re-enroll with more samples
- Minimum: 10 face samples, 5 behavior windows

### Browser Issues

**"Template not found in storage"**
- Solution: Import templates first using templateLoaderService
- Or complete training and import via UI (Phase 6)

**"Feature dimension mismatch"**
- Solution: Ensure Python and JS feature extraction match
- Re-train templates if code was modified

**"Invalid template format"**
- Solution: Check template JSON structure
- Verify version and type fields are present

## Performance Benchmarks

### Python Training
- Data loading: < 5 seconds
- Face template: 10-30 seconds (100 samples)
- Behavior baseline: 5-15 seconds (50 windows)
- Total: < 1 minute

### Browser Verification
- Template loading: < 100ms
- Face matching: < 50ms per frame
- Behavior verification: < 20ms per window

## Success Criteria

✅ **Python tools work**
- [ ] Data loader loads export successfully
- [ ] Face template generates without errors
- [ ] Behavior baseline trains successfully
- [ ] Output files are valid JSON

✅ **Browser services work**
- [ ] Templates load from storage
- [ ] Face matcher produces results
- [ ] Behavior verifier produces results
- [ ] No console errors

✅ **Integration works**
- [ ] Export → Train → Import workflow complete
- [ ] Verification produces reasonable results
- [ ] Performance is acceptable

## Next Steps

After successful testing:
1. Proceed to Phase 6 (Continuous Verification)
2. Integrate services into verification loop
3. Implement trust score fusion
4. Add state machine for access control
