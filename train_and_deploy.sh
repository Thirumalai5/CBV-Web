#!/bin/bash

# CBV System - Automated Model Training and Deployment
# This script trains ML models from your imported enrollment data
# and deploys them to the production app

set -e  # Exit on error

echo "======================================================================"
echo "CBV SYSTEM - AUTOMATED MODEL TRAINING & DEPLOYMENT"
echo "======================================================================"

# Find the most recent export file
EXPORT_FILE=$(ls -t data/templates/cbv_export_*.json 2>/dev/null | head -1)

if [ -z "$EXPORT_FILE" ]; then
    echo "❌ Error: No export file found in data/templates/"
    echo "   Looking for: cbv_export_*.json"
    exit 1
fi

echo "📂 Found export file: $EXPORT_FILE"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "   Please install Python 3.7 or higher"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"
echo ""

# Check if tools directory exists
if [ ! -d "tools" ]; then
    echo "❌ Error: tools directory not found"
    exit 1
fi

# Install Python dependencies if needed
echo "📦 Checking Python dependencies..."
cd tools

if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found in tools/"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import numpy, sklearn" 2>/dev/null; then
    echo "📥 Installing Python dependencies..."
    pip3 install -r requirements.txt
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "======================================================================"
echo "STEP 1: TRAINING ML MODELS"
echo "======================================================================"
echo ""

# Train models
python3 train_models.py --export-file "../$EXPORT_FILE" --output-dir ../data/templates

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Training failed!"
    exit 1
fi

cd ..

echo ""
echo "======================================================================"
echo "STEP 2: DEPLOYING TO PRODUCTION APP"
echo "======================================================================"
echo ""

# Check if templates were generated
if [ ! -f "data/templates/face_template.json" ]; then
    echo "❌ Error: face_template.json not found"
    exit 1
fi

if [ ! -f "data/templates/behavior_baseline.json" ]; then
    echo "❌ Error: behavior_baseline.json not found"
    exit 1
fi

# Copy templates to app
echo "📋 Copying face_template.json to app..."
cp data/templates/face_template.json app/src/utils/production-face-template.json

echo "📋 Copying behavior_baseline.json to app..."
cp data/templates/behavior_baseline.json app/src/utils/production-behavior-baseline.json

echo "✅ Templates deployed to app"
echo ""

echo "======================================================================"
echo "STEP 3: REBUILDING APPLICATION"
echo "======================================================================"
echo ""

cd app

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📥 Installing npm dependencies..."
    npm install
fi

echo "🔨 Building production app..."
npm run build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

cd ..

echo ""
echo "======================================================================"
echo "✅ SUCCESS! MODELS TRAINED AND DEPLOYED"
echo "======================================================================"
echo ""
echo "📁 Generated files:"
echo "   ✓ data/templates/face_template.json"
echo "   ✓ data/templates/behavior_baseline.json"
echo "   ✓ app/src/utils/production-face-template.json"
echo "   ✓ app/src/utils/production-behavior-baseline.json"
echo "   ✓ app/dist/ (production build)"
echo ""
echo "🎉 Your ML models are now trained and deployed!"
echo ""
echo "📝 Next steps:"
echo "   1. Refresh your browser (the app should auto-reload)"
echo "   2. Go to Protected App page"
echo "   3. Click 'Initiate Verification'"
echo "   4. Verify that scores update correctly"
echo ""
echo "💡 Tips:"
echo "   - Face Recognition should use your trained template"
echo "   - Behavior Biometrics should use your trained baseline"
echo "   - Trust score should reflect real-time verification"
echo ""
echo "======================================================================"
