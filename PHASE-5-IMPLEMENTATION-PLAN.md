# Phase 5 — Model Training and ONNX Packaging

## Goal
Turn collected enrollment data into deployable models/templates that can be used for in-browser verification.

## Overview

Phase 5 focuses on creating a practical training pipeline for a Master's thesis demo. Instead of training complex deep learning models from scratch, we'll use:
- **Pretrained face embedding model** (already available in browser via TensorFlow.js)
- **Template-based face matching** (centroid + threshold)
- **Statistical behavior baseline** (one-class model or simple statistics)
- **Liveness heuristics** (EAR-based, already implemented)

## Current Status Assessment

### ✅ Already Available
1. **Face Detection**: BlazeFace model running in browser (TensorFlow.js)
2. **Liveness Detection**: EAR calculation and blink detection implemented
3. **Data Collection**: Face samples, liveness data, behavior windows captured
4. **Data Export**: JSON export functionality ready (Phase 4)
5. **Storage**: IndexedDB with encryption for templates

### 🔍 What Needs to Be Done

## Tasks

### 1. Python Training Environment Setup 📦
**Status**: Not implemented

**Requirements**:
- Python 3.8+ environment
- Required libraries: numpy, scikit-learn, opencv-python, pillow, onnx, onnxruntime
- Data loading utilities
- Model export utilities

**Action Required**:
- Create `tools/requirements.txt` with dependencies
- Create `tools/train_models.py` main training script
- Create `tools/utils/` for helper functions

### 2. Face Template Generation 👤
**Status**: Not implemented

**Approach**: Template-based (no training needed)
- Load exported face samples
- Extract embeddings using pretrained model (or compute in browser)
- Calculate centroid (mean embedding)
- Calculate threshold (based on genuine distribution)
- Save as `face_template.json`

**Action Required**:
- Create `tools/face_template_generator.py`
- Load face samples from export
- Compute centroid and threshold
- Save encrypted template

### 3. Liveness Model (Optional) 👁️
**Status**: Heuristic already implemented

**Approach**: Use existing EAR-based heuristics
- No ML model needed for demo
- EAR threshold already working
- Blink detection already implemented

**Action Required**:
- Document liveness approach
- No additional training needed

### 4. Behavior Baseline Training ⌨️
**Status**: Not implemented

**Approach**: One-class model or statistical baseline
- Load behavior windows from export
- Train Isolation Forest or One-Class SVM
- Export to ONNX (if using sklearn)
- Or save statistical baseline (mean, std, percentiles)

**Action Required**:
- Create `tools/behavior_baseline_trainer.py`
- Load behavior features
- Train one-class model
- Export to ONNX or save statistics

### 5. Model Packaging and Deployment 📦
**Status**: Not implemented

**Requirements**:
- Package models for browser use
- Create model loading service
- Integrate with verification loop

**Action Required**:
- Create `app/src/services/model-loader.service.js`
- Load face template
- Load behavior baseline
- Provide inference methods

## Implementation Plan

### Step 1: Setup Python Training Environment

**New Files to Create**:
- `tools/requirements.txt` - Python dependencies
- `tools/train_models.py` - Main training script
- `tools/utils/data_loader.py` - Load exported JSON
- `tools/utils/model_exporter.py` - Export utilities

**Tasks**:
- [ ] Create requirements.txt
- [ ] Create virtual environment setup script
- [ ] Create data loader for JSON exports
- [ ] Test data loading with real export

### Step 2: Face Template Generation

**New Files to Create**:
- `tools/face_template_generator.py` - Generate face template
- `data/templates/face_template.json` - Output template

**Tasks**:
- [ ] Load face samples from export
- [ ] Decode base64 images
- [ ] Extract embeddings (use browser model or Python equivalent)
- [ ] Calculate centroid embedding
- [ ] Calculate threshold (e.g., 95th percentile of distances)
- [ ] Save template with metadata
- [ ] Encrypt template

### Step 3: Behavior Baseline Training

**New Files to Create**:
- `tools/behavior_baseline_trainer.py` - Train behavior model
- `data/templates/behavior_baseline.json` - Output baseline
- `models/trained/behavior.onnx` - ONNX model (optional)

**Tasks**:
- [ ] Load behavior windows from export
- [ ] Extract features (dwell times, flight times, velocities, etc.)
- [ ] Train Isolation Forest or One-Class SVM
- [ ] Export to ONNX (if using sklearn)
- [ ] Or calculate statistical baseline
- [ ] Save baseline with metadata
- [ ] Test inference

### Step 4: Model Loading Service

**New Files to Create**:
- `app/src/services/model-loader.service.js` - Load and manage models
- `app/src/services/template-matcher.service.js` - Face template matching
- `app/src/services/behavior-verifier.service.js` - Behavior verification

**Tasks**:
- [ ] Create model loader service
- [ ] Load face template from storage
- [ ] Load behavior baseline from storage
- [ ] Implement face matching (cosine similarity)
- [ ] Implement behavior verification
- [ ] Add caching and error handling

### Step 5: Integration and Testing

**Tasks**:
- [ ] Integrate with verification loop (Phase 6 prep)
- [ ] Test face matching accuracy
- [ ] Test behavior verification
- [ ] Validate thresholds
- [ ] Document model performance

## Done Means

Phase 5 is complete when:
- ✅ Python training environment set up
- ✅ Face template generated from enrollment data
- ✅ Behavior baseline trained/calculated
- ✅ Models packaged for browser use
- ✅ Model loading service implemented
- ✅ Templates stored in IndexedDB
- ✅ Ready for Phase 6 (verification loop)

## Technical Specifications

### Face Template Format
```json
{
  "version": "1.0",
  "userId": "Thiru",
  "createdAt": "2024-01-01T00:00:00Z",
  "type": "face_template",
  "embedding": {
    "vector": [0.123, 0.456, ...],  // 128 or 512 dimensions
    "dimension": 128,
    "model": "facenet_mobilenet"
  },
  "threshold": {
    "value": 0.6,
    "method": "percentile_95",
    "genuine_scores": [0.8, 0.85, 0.9, ...]
  },
  "metadata": {
    "samples_used": 50,
    "quality_mean": 0.85
  }
}
```

### Behavior Baseline Format
```json
{
  "version": "1.0",
  "userId": "Thiru",
  "createdAt": "2024-01-01T00:00:00Z",
  "type": "behavior_baseline",
  "keystroke": {
    "dwell_time": {
      "mean": 120,
      "std": 30,
      "percentiles": [80, 100, 120, 140, 160]
    },
    "flight_time": {
      "mean": 150,
      "std": 40,
      "percentiles": [90, 120, 150, 180, 210]
    }
  },
  "mouse": {
    "velocity": {
      "mean": 200,
      "std": 50,
      "percentiles": [100, 150, 200, 250, 300]
    },
    "curvature": {
      "mean": 0.5,
      "std": 0.2,
      "percentiles": [0.2, 0.4, 0.5, 0.6, 0.8]
    }
  },
  "threshold": {
    "anomaly_score": 0.7,
    "method": "isolation_forest"
  },
  "metadata": {
    "windows_used": 20,
    "training_duration": 60
  }
}
```

### Model Files Structure
```
models/
├── pretrained/
│   └── facenet_mobilenet/  (already available via TensorFlow.js)
└── trained/
    ├── behavior.onnx       (optional, if using sklearn)
    └── README.md

data/
└── templates/
    ├── face_template.json
    ├── behavior_baseline.json
    └── README.md
```

## Training Strategy (Practical for Master's Demo)

### Face Recognition
**Approach**: Template-based matching
- **No training needed**: Use pretrained FaceNet/MobileFaceNet
- **Template**: Centroid of enrollment embeddings
- **Matching**: Cosine similarity > threshold
- **Threshold**: Based on genuine distribution (e.g., 95th percentile)

**Advantages**:
- Fast and simple
- No training data needed beyond enrollment
- Works well for single-user verification
- Easy to update

### Liveness Detection
**Approach**: Heuristic-based (already implemented)
- **EAR threshold**: < 0.2 for blink
- **Blink frequency**: 15-30 bpm normal range
- **No ML model needed**

**Advantages**:
- Already working
- No training needed
- Fast and reliable

### Behavior Biometrics
**Approach**: One-class model or statistical baseline
- **Option A**: Isolation Forest (sklearn → ONNX)
- **Option B**: Statistical baseline (mean ± 2σ)
- **Features**: Dwell time, flight time, velocity, curvature

**Advantages**:
- Simple to train
- Works with limited data
- Fast inference

## Dependencies

### Python (tools/requirements.txt)
```
numpy>=1.21.0
scikit-learn>=1.0.0
opencv-python>=4.5.0
Pillow>=9.0.0
onnx>=1.12.0
onnxruntime>=1.12.0
tensorflow>=2.8.0  # Optional, for face embeddings
```

### JavaScript (already installed)
- TensorFlow.js (face detection)
- ONNX Runtime Web (behavior model)
- IndexedDB (template storage)

## Timeline Estimate

- **Step 1** (Python setup): 1-2 hours
- **Step 2** (Face template): 2-3 hours
- **Step 3** (Behavior baseline): 3-4 hours
- **Step 4** (Model loading): 2-3 hours
- **Step 5** (Integration): 2-3 hours
- **Testing**: 2-3 hours

**Total**: 12-18 hours

## Priority Order

1. **High Priority**: Python environment setup
2. **High Priority**: Face template generation
3. **Medium Priority**: Behavior baseline training
4. **Medium Priority**: Model loading service
5. **Low Priority**: ONNX export (can use JSON baseline)

## Practical Considerations

### For Master's Thesis Demo

1. **Keep it Simple**:
   - Template-based face matching (no deep learning training)
   - Statistical behavior baseline (no complex models)
   - Heuristic liveness (already working)

2. **Focus on Integration**:
   - Models should load quickly in browser
   - Inference should be fast (< 100ms)
   - Templates should be small (< 1MB)

3. **Demonstrate Concepts**:
   - Show that biometric templates can be generated
   - Show that verification works
   - Show that system is secure (encryption)

4. **Avoid Pitfalls**:
   - Don't train complex models (not enough data)
   - Don't try to beat state-of-the-art (not the goal)
   - Don't over-engineer (keep it practical)

## Testing Checklist

### Python Training
- [ ] Environment setup works
- [ ] Can load exported JSON
- [ ] Can decode face images
- [ ] Can extract features
- [ ] Can train models
- [ ] Can export templates

### Model Loading
- [ ] Templates load in browser
- [ ] Face matching works
- [ ] Behavior verification works
- [ ] Performance is acceptable
- [ ] Error handling works

### Integration
- [ ] Templates stored in IndexedDB
- [ ] Templates encrypted
- [ ] Can update templates
- [ ] Can delete templates
- [ ] Ready for verification loop

## Next Steps After Phase 5

### Phase 6 (Continuous Verification)
- Use face template for matching
- Use behavior baseline for verification
- Combine scores into trust score
- Implement state machine (NORMAL/WATCH/RESTRICT/REAUTH)

---

**Status**: Ready to begin Phase 5 implementation
**Prerequisites**: Phase 4 complete (export functionality working)
**Estimated Duration**: 12-18 hours
