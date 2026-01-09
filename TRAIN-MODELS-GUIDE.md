# Train ML Models with Imported Data

## Quick Start

### Step 1: Locate Your Imported JSON File
Your imported JSON file should be in one of these locations:
- `data/exports/` - If you saved it there
- `data/templates/` - Check for files like `cbv_export_Thiru_*.json`
- Or wherever you saved your enrollment JSON file

### Step 2: Run Training Script

```bash
# Navigate to tools directory
cd tools

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Train both face template and behavior baseline
python train_models.py --export-file ../data/exports/YOUR_FILE.json

# Or if your file is elsewhere:
python train_models.py --export-file /path/to/your/file.json
```

### Step 3: Check Output
The trained models will be saved to `data/templates/`:
- `face_template.json` - Face recognition template
- `behavior_baseline.json` - Behavior biometrics baseline

### Step 4: Use in Application
The templates are automatically loaded by the app from:
- `app/src/utils/production-face-template.json`
- `app/src/utils/production-behavior-baseline.json`

## Training Options

### Train Only Face Template
```bash
python train_models.py --export-file ../data/exports/YOUR_FILE.json --face-only
```

### Train Only Behavior Baseline
```bash
python train_models.py --export-file ../data/exports/YOUR_FILE.json --behavior-only
```

### Use ML Model for Behavior (Isolation Forest)
```bash
python train_models.py --export-file ../data/exports/YOUR_FILE.json --use-ml
```

### Adjust Face Recognition Threshold
```bash
# More strict (lower threshold = fewer false positives)
python train_models.py --export-file ../data/exports/YOUR_FILE.json --threshold-percentile 90

# More lenient (higher threshold = fewer false negatives)
python train_models.py --export-file ../data/exports/YOUR_FILE.json --threshold-percentile 98
```

## What Gets Trained

### Face Template
- Generates average face embedding from all face samples
- Calculates similarity threshold based on sample variance
- Creates quality metrics and metadata
- Output: `face_template.json`

### Behavior Baseline
- Analyzes keystroke dynamics (dwell time, flight time)
- Analyzes mouse dynamics (velocity, acceleration, click patterns)
- Creates statistical baseline (mean, std, min, max for each feature)
- Optional: Trains Isolation Forest ML model for anomaly detection
- Output: `behavior_baseline.json`

## Troubleshooting

### Error: "Export file not found"
- Check the file path is correct
- Use absolute path if relative path doesn't work
- Ensure the JSON file exists

### Error: "No face samples found"
- Your JSON file might not have face sample data
- Check the JSON structure has `data.faceSamples` array

### Error: "Insufficient behavior data"
- Need at least 10 behavior windows for training
- Check the JSON has `data.behaviorWindows` array

### Error: "Module not found"
```bash
# Install dependencies
cd tools
pip install -r requirements.txt
```

## Expected Output

```
======================================================================
CBV SYSTEM - MODEL TRAINING
======================================================================
Export file: ../data/exports/cbv_export_Thiru_2026-01-08.json
Output directory: ../data/templates
Face template: Yes
Behavior baseline: Yes
Behavior method: Statistical
======================================================================

📂 Loading enrollment data...
✅ User ID: Thiru

📊 Data Summary:
   Face samples: 50 (avg quality: 0.85)
   Liveness duration: 30s (blinks: 15)
   Behavior windows: 60 (total: 300.0s)

======================================================================
TRAINING FACE TEMPLATE
======================================================================
Processing 50 face samples...
✅ Face template generated successfully
   Output: ../data/templates/face_template.json
   Embedding dimension: 128
   Threshold: 0.750

======================================================================
TRAINING BEHAVIOR BASELINE
======================================================================
Processing 60 behavior windows...
✅ Behavior baseline generated successfully
   Output: ../data/templates/behavior_baseline.json
   Method: statistical
   Features: 12

======================================================================
✅ TRAINING COMPLETE
======================================================================

📁 Output files in: ../data/templates
   ✓ face_template.json
   ✓ behavior_baseline.json
```

## Next Steps After Training

1. **Copy templates to app:**
   ```bash
   cp data/templates/face_template.json app/src/utils/production-face-template.json
   cp data/templates/behavior_baseline.json app/src/utils/production-behavior-baseline.json
   ```

2. **Rebuild the app:**
   ```bash
   cd app
   npm run build
   ```

3. **Test verification:**
   - Go to Protected App page
   - Click "Initiate Verification"
   - Verify scores update correctly

## Advanced: Automated Training Script

Create `train_and_deploy.sh`:

```bash
#!/bin/bash

# Train models
cd tools
python train_models.py --export-file ../data/exports/cbv_export_Thiru_*.json

# Copy to app
cp ../data/templates/face_template.json ../app/src/utils/production-face-template.json
cp ../data/templates/behavior_baseline.json ../app/src/utils/production-behavior-baseline.json

# Rebuild app
cd ../app
npm run build

echo "✅ Models trained and deployed!"
```

Make it executable:
```bash
chmod +x train_and_deploy.sh
./train_and_deploy.sh
```

---

**Note:** The training script requires Python 3.7+ and the dependencies in `tools/requirements.txt`.
