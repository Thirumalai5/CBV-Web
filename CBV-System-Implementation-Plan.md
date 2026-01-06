# CBV System - Comprehensive Implementation Plan

## Project Overview
**Continuous Behavioral Verification (CBV) System** - Master's Thesis Project
A browser-based biometric authentication system combining face recognition, liveness detection, and behavioral biometrics for continuous user verification.

---

## Technology Stack

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Webpack 5 with webpack-dev-server (HTTPS support)
- **Styling**: CSS Modules / Tailwind CSS
- **State Management**: React Context API / Redux (if needed)

### Machine Learning & Biometrics
- **Face Detection**: TensorFlow.js with BlazeFace model
- **Face Landmarks**: FaceMesh model
- **Model Runtime**: onnxruntime-web for custom models
- **Face Embeddings**: MobileFaceNet (ONNX format)

### Storage & Security
- **Local Storage**: IndexedDB (via idb library)
- **Encryption**: Web Crypto API (AES-GCM)
- **Key Derivation**: PBKDF2

### Backend/Training
- **Python**: 3.x with virtual environment
- **ML Libraries**: scikit-learn, numpy, pandas
- **ONNX Export**: onnxruntime, skl2onnx
- **Image Processing**: OpenCV, PIL

---

## Project Structure

```
CBV-System/
├── app/                          # Frontend React application
│   ├── public/
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── common/           # Shared components
│   │   │   ├── auth/             # Authentication components
│   │   │   ├── capture/          # Data capture components
│   │   │   ├── verification/     # Runtime verification
│   │   │   └── debug/            # Debug panel
│   │   ├── pages/                # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── RegistrationPage.jsx
│   │   │   ├── CapturePage.jsx
│   │   │   ├── ProtectedPage.jsx
│   │   │   └── EvaluationPage.jsx
│   │   ├── services/             # Business logic
│   │   │   ├── camera.service.js
│   │   │   ├── face.service.js
│   │   │   ├── liveness.service.js
│   │   │   ├── behavior.service.js
│   │   │   ├── storage.service.js
│   │   │   ├── encryption.service.js
│   │   │   └── verification.service.js
│   │   ├── models/               # ML model loaders
│   │   │   ├── faceDetection.js
│   │   │   ├── faceEmbedding.js
│   │   │   ├── livenessModel.js
│   │   │   └── behaviorModel.js
│   │   ├── utils/                # Utility functions
│   │   │   ├── config.js
│   │   │   ├── logger.js
│   │   │   └── helpers.js
│   │   ├── hooks/                # Custom React hooks
│   │   │   ├── useCamera.js
│   │   │   ├── useVerification.js
│   │   │   └── useBehavior.js
│   │   ├── context/              # React context
│   │   │   ├── AuthContext.jsx
│   │   │   └── VerificationContext.jsx
│   │   ├── styles/               # Global styles
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   ├── webpack.config.js
│   └── .env
│
├── models/                       # Trained models and templates
│   ├── pretrained/               # Pre-trained models
│   │   ├── blazeface/
│   │   ├── facemesh/
│   │   └── mobilefacenet.onnx
│   ├── trained/                  # User-trained models
│   │   ├── face_template.json
│   │   ├── behavior.onnx
│   │   └── liveness.onnx
│   └── README.md
│
├── tools/                        # Python training scripts
│   ├── requirements.txt
│   ├── train_face_template.py
│   ├── train_behavior_model.py
│   ├── train_liveness_model.py
│   ├── export_to_onnx.py
│   ├── data_processor.py
│   └── utils.py
│
├── data/                         # Data exports and samples
│   ├── exports/                  # Exported session data
│   │   └── cbv_sessions.json
│   ├── samples/                  # Sample data for testing
│   └── README.md
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── EVALUATION.md
│
├── scripts/                      # Build and utility scripts
│   ├── setup.sh
│   ├── generate-certs.sh
│   └── start-dev.sh
│
├── .gitignore
├── README.md
└── package.json (root)
```

---

## Phase-by-Phase Implementation Plan

### **Phase 0: Foundation and Safety Rails**

**Goal**: Secure development environment with working camera and crypto APIs

**Tasks**:
1. **Project Initialization**
   - Create project structure
   - Initialize React app with webpack
   - Configure webpack-dev-server with HTTPS
   - Generate self-signed SSL certificates
   - Set up environment variables

2. **Global Configuration**
   - Create `config.js` with:
     - Sampling rates (face: 5-10 fps, behavior: continuous)
     - Window sizes (behavior: 3-5 seconds)
     - Thresholds (face similarity, liveness, behavior)
     - Feature schema versioning
   - Create constants for states: NORMAL, WATCH, RESTRICT, REAUTH

3. **Debug Panel Component**
   - Real-time FPS counter
   - Inference time display
   - Trust score gauge (0-100)
   - Current state indicator
   - Console log viewer
   - Toggle visibility

4. **Camera Service**
   - Request camera permissions
   - Initialize video stream
   - Handle errors gracefully
   - Provide frame capture utility

5. **Crypto Service**
   - Test Web Crypto API availability
   - Implement key derivation (PBKDF2)
   - Implement AES-GCM encryption/decryption
   - Generate random IVs and salts

**Deliverables**:
- ✅ App runs at https://localhost:8080
- ✅ Camera permission works
- ✅ WebCrypto available
- ✅ Debug panel shows metrics
- ✅ No blocking console errors

---

### **Phase 1: UX Flow and Navigation Skeleton**

**Goal**: Complete application navigation flow

**Tasks**:
1. **Routing Setup**
   - Install react-router-dom
   - Configure routes: /, /register, /capture, /protected, /evaluation
   - Implement protected route wrapper

2. **Home Page (index.html / HomePage.jsx)**
   - Project overview section
   - "Start Registration" button → /register
   - "Go to Verification" button → /protected
   - Feature highlights
   - System status indicator

3. **Registration Page**
   - Login form (userId, password)
   - Hardcoded credential validation
   - Session initialization
   - Redirect to /capture on success

4. **Capture Page**
   - Tab navigation: Face | Liveness | Behavior
   - Camera preview
   - Capture controls (start/stop/save)
   - Progress indicators
   - Quality feedback
   - Export data button

5. **Protected Page**
   - Simulated sensitive content (fake banking UI)
   - Runtime verification overlay
   - Trust score display
   - State-based UI modifications (blur, block)
   - Reauth modal

6. **Evaluation Page**
   - Scenario selector
   - Trust score timeline chart
   - State transition log
   - Metrics dashboard
   - Replay controls

**Deliverables**:
- ✅ All pages accessible via navigation
- ✅ Routing works without reload loops
- ✅ Can reach each stage in sequence
- ✅ Basic UI layout complete

---

### **Phase 2: Registration and Identity Enrolment Gate**

**Goal**: Secure enrolment flow with deterministic access control

**Tasks**:
1. **Credential Management**
   - Hardcode demo credentials:
     - `userId: "Thiru"`
     - `password: "thiru0509"`
   - Implement login validation
   - Create session management

2. **Enrolment Session**
   - Generate unique session ID (UUID)
   - Initialize user profile in IndexedDB
   - Store enrolment timestamp
   - Track enrolment status

3. **Encryption Key Generation**
   - Derive enrolment key from password using PBKDF2
   - Store key derivation parameters (salt, iterations)
   - Use key for encrypting templates
   - Implement key retrieval for verification

4. **Access Control**
   - Lock template updates behind authentication
   - Verification-only mode (no template modification)
   - Owner-only data export
   - Owner-only data purge

5. **User Profile Storage**
   - Create `users` store in IndexedDB
   - Store: userId, createdAt, lastUpdated, version
   - Implement profile retrieval
   - Implement profile update

**Deliverables**:
- ✅ Only "Thiru" with password "thiru0509" can enrol
- ✅ Enrolment key generated and stored securely
- ✅ Template updates locked to registered user
- ✅ Verification mode is read-only

---

### **Phase 3: Data Collection Session**

**Goal**: High-quality multi-modal biometric data capture

#### **3.1 Face Capture**

**Tasks**:
1. **Video Stream Processing**
   - Capture frames at 5-10 fps
   - Resize frames for processing (e.g., 640x480)
   - Convert to tensor format

2. **Face Detection**
   - Load BlazeFace model
   - Detect face in each frame
   - Extract bounding box coordinates
   - Crop face region

3. **Quality Checks**
   - **Lighting**: Check average brightness (50-200 range)
   - **Blur**: Compute Laplacian variance (threshold: >100)
   - **Face Present**: Confidence score >0.8
   - **Alignment**: Check face angle (pitch, yaw, roll within ±15°)
   - **Size**: Face occupies 20-60% of frame

4. **Data Storage**
   - Store face crops as base64 or blobs
   - Store metadata: timestamp, quality scores, bbox
   - Link to session ID
   - Aim for 50-100 good quality samples

5. **User Feedback**
   - Real-time quality indicators (green/yellow/red)
   - Instructions: "Move closer", "Better lighting", "Hold still"
   - Sample count progress bar

#### **3.2 Liveness Capture**

**Tasks**:
1. **Landmark Detection**
   - Load FaceMesh model
   - Extract 468 facial landmarks per frame
   - Focus on eye landmarks (indices for EAR calculation)

2. **Blink Detection (EAR - Eye Aspect Ratio)**
   - Calculate EAR for both eyes
   - Detect blink when EAR < 0.2
   - Track blink frequency and duration
   - Store time-series: [timestamp, left_EAR, right_EAR, blink_detected]

3. **Micro-Motion Detection**
   - Track landmark displacement between frames
   - Calculate motion vectors (dx, dy)
   - Compute motion magnitude and direction
   - Store motion features per window

4. **Challenge-Response (Optional)**
   - Prompt: "Blink twice", "Look left", "Look right", "Smile"
   - Verify user compliance
   - Store challenge-response pairs

5. **Data Storage**
   - Store liveness sequences in IndexedDB
   - Format: time-series arrays with timestamps
   - Link to session ID

#### **3.3 Behavior Capture**

**Tasks**:
1. **Keystroke Dynamics**
   - Listen to keydown/keyup events
   - Calculate dwell time (key press duration)
   - Calculate flight time (time between key releases)
   - Store per-key statistics
   - Aggregate into feature vectors

2. **Mouse Dynamics**
   - Track mouse movement (x, y, timestamp)
   - Calculate velocity (pixels/second)
   - Calculate acceleration
   - Calculate curvature (angle changes)
   - Detect click timing and patterns
   - Detect idle periods (no movement >2s)

3. **Windowing**
   - Create 3-5 second windows
   - Aggregate features per window:
     - Keystroke: mean/std dwell, mean/std flight, typing speed
     - Mouse: mean/std velocity, mean/std curvature, click rate
   - Store feature vectors with timestamps

4. **User Prompts**
   - "Type the following text: [sample sentence]"
   - "Move your mouse in circles"
   - "Click the buttons in sequence"
   - Provide visual targets for interaction

5. **Data Storage**
   - Store behavior windows in IndexedDB
   - Format: feature vectors with metadata
   - Link to session ID

#### **3.4 Session Management**

**Tasks**:
1. **Session Controller**
   - Start/stop capture session
   - Track session duration (60-120 seconds)
   - Coordinate face, liveness, behavior capture
   - Display overall progress

2. **Data Validation**
   - Ensure minimum samples collected:
     - Face: ≥50 good quality samples
     - Liveness: ≥30 seconds of data
     - Behavior: ≥20 windows
   - Warn if insufficient data

3. **Export Functionality**
   - Package all session data
   - Format: JSON with metadata
   - Download as `cbv_sessions.json`
   - Include schema version

**Deliverables**:
- ✅ 60-120s capture session produces:
  - Face samples (crops + metadata)
  - Liveness sequences (EAR time-series)
  - Behavior windows (feature vectors)
- ✅ All data timestamped and linked to session
- ✅ Quality feedback during capture
- ✅ Data exportable as JSON

---

### **Phase 4: Storage Layer (IndexedDB + Encryption + Export)**

**Goal**: Persistent, encrypted local storage with export/import capabilities

**Tasks**:
1. **IndexedDB Schema Design**
   - **Database**: `cbv_db`, version 1
   - **Stores**:
     - `users`: id (key), userId, createdAt, lastUpdated, version
     - `face_samples`: id (key), userId, sessionId, dataUrl, metadata, timestamp
     - `liveness_samples`: id (key), userId, sessionId, timeSeries, timestamp
     - `behavior_windows`: id (key), userId, sessionId, features, timestamp
     - `templates`: id (key), userId, faceTemplate (encrypted), behaviorBaseline (encrypted), thresholds, createdAt
     - `logs`: id (key), userId, timestamp, trustScore, state, event

2. **Storage Service Implementation**
   - Use `idb` library for promise-based API
   - Implement CRUD operations for each store
   - Implement batch operations
   - Handle version upgrades

3. **Encryption Service**
   - Encrypt sensitive objects before storage:
     - Face embeddings
     - Behavior baselines
     - Templates
   - Use AES-GCM with derived key
   - Store IV with encrypted data
   - Decrypt on retrieval

4. **Export Tool**
   - Select stores to export (all or specific)
   - Serialize to JSON
   - Include metadata: export date, version, userId
   - Trigger download as `cbv_sessions.json`
   - Option to include/exclude encrypted data

5. **Import Tool (Optional)**
   - Parse uploaded JSON
   - Validate schema version
   - Import into IndexedDB
   - Handle conflicts (overwrite/merge)

6. **Reset/Purge Tool**
   - Owner authentication required
   - Clear all stores
   - Reset to initial state
   - Confirmation dialog

7. **Data Integrity**
   - Implement checksums for critical data
   - Validate data on retrieval
   - Handle corruption gracefully

**Deliverables**:
- ✅ Data persists after page refresh
- ✅ Sensitive data encrypted at rest
- ✅ Export produces complete JSON file
- ✅ Purge tool wipes all data safely
- ✅ No data loss during normal operations

---

### **Phase 5: Model Training and ONNX Packaging**

**Goal**: Convert collected data into deployable models/templates

#### **5.1 Python Environment Setup**

**Tasks**:
1. Check Python installation
2. Create virtual environment: `python3 -m venv venv`
3. Install dependencies:
   ```
   numpy
   pandas
   scikit-learn
   opencv-python
   pillow
   onnx
   onnxruntime
   skl2onnx
   ```
4. Create `requirements.txt`

#### **5.2 Data Processing Tool**

**Tasks**:
1. **Load Exported Data**
   - Parse `cbv_sessions.json`
   - Extract face samples, liveness sequences, behavior windows
   - Validate data integrity

2. **Face Data Processing**
   - Decode base64 images
   - Resize to model input size (e.g., 112x112)
   - Normalize pixel values
   - Create numpy arrays

3. **Liveness Data Processing**
   - Extract EAR time-series
   - Normalize features
   - Create fixed-length sequences (padding/truncation)

4. **Behavior Data Processing**
   - Extract feature vectors from windows
   - Normalize features (z-score or min-max)
   - Handle missing values

#### **5.3 Face Template Generation**

**Tasks**:
1. **Pretrained Embedder**
   - Download MobileFaceNet ONNX model (or use TensorFlow.js in browser)
   - Load model in Python or run in browser
   - Generate embeddings for all face samples

2. **Template Creation**
   - Compute centroid (mean embedding)
   - Compute genuine distribution statistics (mean, std)
   - Set decision threshold (e.g., mean + 2*std)
   - Store as `face_template.json`

3. **Encryption**
   - Encrypt template with derived key
   - Store encrypted version

#### **5.4 Liveness Model Training (Optional)**

**Tasks**:
1. **Feature Engineering**
   - Extract statistical features from EAR sequences
   - Create labels (genuine vs. spoof - for demo, all genuine)

2. **Model Training**
   - Train simple classifier (Logistic Regression, SVM)
   - Or use heuristic rules (blink frequency, EAR variance)

3. **ONNX Export**
   - Convert model to ONNX format
   - Save as `liveness.onnx`
   - Test inference

#### **5.5 Behavior Model Training**

**Tasks**:
1. **One-Class Model**
   - Train Isolation Forest or One-Class SVM
   - Fit on genuine user behavior windows
   - Set anomaly threshold (e.g., 95th percentile)

2. **ONNX Export**
   - Convert to ONNX using skl2onnx
   - Save as `behavior.onnx`
   - Test inference

3. **Baseline Statistics (Alternative)**
   - If ONNX export is difficult, store baseline stats
   - Compute mean and covariance of features
   - Use Mahalanobis distance for scoring

#### **5.6 Model Packaging**

**Tasks**:
1. **Organize Models**
   - Place in `/models/trained/`
   - Include metadata: version, training date, performance metrics

2. **Create Model Loaders**
   - JavaScript loaders for each model
   - Use onnxruntime-web
   - Handle loading errors

3. **Testing**
   - Test each model with sample data
   - Verify output shapes and ranges
   - Benchmark inference time

**Deliverables**:
- ✅ `face_template.json` (encrypted)
- ✅ `behavior.onnx` or baseline stats
- ✅ Optional: `liveness.onnx`
- ✅ Models loadable in browser
- ✅ Inference time <100ms per frame

---

### **Phase 6: Continuous Verification Runtime Loop**

**Goal**: Real-time trust scoring and state management

**Tasks**:
1. **Runtime Loop Setup**
   - Initialize loop at 2-5 Hz (400-500ms interval)
   - Use `setInterval` or `requestAnimationFrame`
   - Ensure non-blocking execution

2. **Frame Processing Pipeline**
   - Capture current frame from webcam
   - Detect face with BlazeFace
   - Extract face crop
   - Generate embedding with MobileFaceNet
   - Compute face similarity score

3. **Face Similarity Scoring**
   - Calculate cosine similarity or Euclidean distance
   - Compare to stored template
   - Normalize to 0-1 range
   - Apply threshold

4. **Liveness Scoring**
   - Extract landmarks with FaceMesh
   - Calculate current EAR
   - Detect blinks in recent window
   - Compute liveness confidence (0-1)
   - Or run liveness model if available

5. **Behavior Scoring**
   - Collect recent behavior window (last 3-5 seconds)
   - Extract features (keystroke, mouse)
   - Run behavior model or compute distance to baseline
   - Normalize to 0-1 range (1 = normal, 0 = anomalous)

6. **Risk/Trust Fusion**
   - Combine scores: `trust = w1*face + w2*liveness + w3*behavior`
   - Weights: e.g., w1=0.5, w2=0.2, w3=0.3
   - Apply Exponential Moving Average (EMA) for smoothing:
     - `trust_smooth = alpha * trust + (1-alpha) * trust_prev`
     - alpha = 0.3

7. **State Machine with Hysteresis**
   - **NORMAL**: trust > 0.7
   - **WATCH**: 0.5 < trust ≤ 0.7
   - **RESTRICT**: 0.3 < trust ≤ 0.5
   - **REAUTH**: trust ≤ 0.3
   - Hysteresis: require trust to exceed threshold + margin to transition up

8. **Tamper/Failure Handling**
   - Camera off → RESTRICT
   - Face not detected for >5s → WATCH
   - Model load failure → RESTRICT
   - Repeated anomalies → REAUTH

9. **Logging**
   - Log trust score every cycle
   - Log state transitions
   - Store in IndexedDB `logs` store

10. **Debug Panel Integration**
    - Update FPS counter
    - Update inference time
    - Update trust score gauge
    - Update current state indicator

**Deliverables**:
- ✅ Trust score updates smoothly (2-5 Hz)
- ✅ State transitions make sense:
  - Normal owner use → NORMAL
  - Face absent → WATCH/RESTRICT
  - Different user → RESTRICT/REAUTH
- ✅ Tamper detection works
- ✅ Logs stored for analysis

---

### **Phase 7: Enforcement and Recovery**

**Goal**: Protect sensitive content based on trust state

**Tasks**:
1. **WATCH State Enforcement**
   - Identify sensitive DOM elements (class: `.sensitive`)
   - Apply CSS blur filter: `filter: blur(8px)`
   - Show warning banner: "Verification in progress..."
   - Allow read-only access

2. **RESTRICT State Enforcement**
   - Increase blur: `filter: blur(16px)`
   - Block high-risk actions:
     - Form submissions (preventDefault on submit)
     - Download links (disable)
     - Copy/paste (preventDefault on copy/paste events)
     - Privileged button clicks (e.g., "Transfer Money")
   - Show modal: "Access restricted. Please verify your identity."

3. **REAUTH State Enforcement**
   - Full screen overlay (semi-transparent)
   - Blur all content
   - Block all interactions
   - Show reauth challenge:
     - **Option 1**: WebAuthn/Passkey (if available)
     - **Option 2**: Password re-entry
     - **Option 3**: Face + liveness challenge

4. **WebAuthn Integration (Optional)**
   - Register passkey during enrolment
   - Request assertion during reauth
   - Verify signature
   - Restore access on success

5. **Recovery Flow**
   - After successful reauth:
     - Reset trust score to 0.8
     - Transition to NORMAL state
     - Remove enforcement
   - Gradual restoration:
     - Monitor for 10-15 seconds
     - If stable, fully restore
     - If anomalies persist, re-restrict

6. **Enforcement Manager**
   - Centralized service to apply/remove enforcement
   - State-driven enforcement rules
   - Smooth transitions (fade in/out)

7. **User Feedback**
   - Clear visual indicators for each state
   - Instructions for recovery
   - Avoid false alarm frustration

**Deliverables**:
- ✅ Demo scenarios work:
  - Shoulder surf → blur + action block
  - Handover → full restriction + reauth
  - Owner returns → gradual restoration
- ✅ Repeated anomalies → forced reauth
- ✅ Recovery flow is smooth

---

### **Phase 8: Evaluation Harness and Demo Script**

**Goal**: Reproducible evaluation and examiner-friendly demo

**Tasks**:
1. **Scenario Runner**
   - **Scenario 1: Legitimate Use**
     - Owner uses app normally for 60s
     - Expected: NORMAL state throughout
     - Measure: false restriction rate
   
   - **Scenario 2: Shoulder Surf**
     - Owner looks away for 10s
     - Expected: WATCH → RESTRICT
     - Measure: time to blur
   
   - **Scenario 3: Handover**
     - Different person takes over
     - Expected: RESTRICT → REAUTH
     - Measure: time to restrict
   
   - **Scenario 4: Camera Blocked**
     - Cover camera for 10s
     - Expected: RESTRICT
     - Measure: tamper detection time
   
   - **Scenario 5: Recovery**
     - Owner returns after handover
     - Expected: Reauth → NORMAL
     - Measure: recovery time

2. **Automated Scenario Execution**
   - Trigger scenarios programmatically
   - Simulate events (face absent, behavior change)
   - Record outcomes

3. **KPI Logging**
   - Time-to-blur (WATCH state)
   - Time-to-restrict (RESTRICT state)
   - Time-to-reauth (REAUTH state)
   - False restriction rate during normal use
   - Recovery time
   - Inference time per frame

4. **Evaluation Page**
   - Scenario selector dropdown
   - "Run Scenario" button
   - Real-time trust score chart (line graph)
   - State transition timeline
   - KPI dashboard (cards with metrics)
   - Export results as CSV/JSON

5. **Visualization**
   - Use Chart.js or Recharts
   - Trust score over time (line chart)
   - State transitions (timeline with color coding)
   - Histogram of trust scores
   - Confusion matrix (if applicable)

6. **Demo Script Preparation**
   - **Duration**: 3-5 minutes
   - **Flow**:
     1. Introduction (30s): Explain CBV concept
     2. Enrolment (60s): Show data capture
     3. Normal Use (30s): Show NORMAL state
     4. Attack Scenario (60s): Show shoulder surf → blur
     5. Handover Scenario (60s): Show REAUTH
     6. Recovery (30s): Show restoration
     7. Evaluation (30s): Show metrics
   - **Script**: Write step-by-step narration
   - **Practice**: Ensure repeatability

7. **Replay/Inspect Tool**
   - Load logged session data
   - Replay trust score timeline
   - Inspect state transitions
   - Analyze anomalies

**Deliverables**:
- ✅ 5 scenarios run reliably
- ✅ KPIs logged and displayed
- ✅ Trust score chart shows clear patterns
- ✅ Demo script is repeatable
- ✅ Results exportable for thesis

---

## Implementation Timeline (Estimated)

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 0 | Foundation & Setup | 4-6 hours |
| Phase 1 | UX Flow & Navigation | 6-8 hours |
| Phase 2 | Registration & Auth | 4-6 hours |
| Phase 3 | Data Collection | 12-16 hours |
| Phase 4 | Storage Layer | 6-8 hours |
| Phase 5 | Model Training | 8-12 hours |
| Phase 6 | Verification Loop | 10-14 hours |
| Phase 7 | Enforcement | 8-10 hours |
| Phase 8 | Evaluation & Demo | 6-8 hours |
| **Total** | | **64-88 hours** |

*Note: This is a working prototype timeline. Additional time may be needed for debugging, testing, and refinement.*

---

## Key Technical Decisions

### 1. **Why React?**
   - Component-based architecture for modularity
   - Rich ecosystem for UI and state management
   - Easy integration with TensorFlow.js and ONNX Runtime

### 2. **Why TensorFlow.js + BlazeFace/FaceMesh?**
   - Lightweight and fast face detection
   - Runs entirely in browser (no server needed)
   - Good accuracy for real-time applications

### 3. **Why ONNX Runtime?**
   - Cross-platform model format
   - Supports custom models trained in Python
   - Optimized for inference

### 4. **Why IndexedDB?**
   - Large storage capacity (>50MB)
   - Asynchronous API (non-blocking)
   - Structured data storage

### 5. **Why Web Crypto API?**
   - Native browser encryption (no external libraries)
   - Secure key derivation and storage
   - FIPS-compliant algorithms

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Camera permission denied | Provide clear instructions, fallback to file upload |
| Model loading failure | Implement retry logic, show error messages |
| Poor lighting conditions | Real-time quality feedback, guide user |
| Insufficient training data | Set minimum sample requirements, validate before training |
| False positives (legitimate user restricted) | Tune thresholds, use hysteresis, allow manual override |
| Performance issues (slow inference) | Optimize frame rate, use Web Workers, reduce model size |
| Browser compatibility | Test on Chrome/Edge (primary), provide compatibility warnings |

---

## Testing Strategy

1. **Unit Tests**: Test individual services (encryption, storage, scoring)
2. **Integration Tests**: Test data flow between components
3. **User Testing**: Test with real users (owner + impostor)
4. **Performance
