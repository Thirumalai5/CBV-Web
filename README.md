# CBV System - Continuous Behavioral Verification

A browser-based biometric authentication system combining face recognition, liveness detection, and behavioral biometrics for continuous user verification.

**Master's Thesis Project** by Thirumalai Arumugam

## 🎯 Project Overview

The CBV System provides continuous authentication by monitoring multiple biometric modalities:
- **Face Recognition**: Real-time face detection and matching using TensorFlow.js
- **Liveness Detection**: Blink detection and micro-motion analysis
- **Behavioral Biometrics**: Keystroke dynamics and mouse movement patterns
- **Trust-Based Enforcement**: Dynamic access control based on continuous verification

## 🏗️ Architecture

```
CBV-System/
├── app/                    # React frontend application
├── models/                 # ML models (pretrained & trained)
├── tools/                  # Python training scripts
├── data/                   # Data exports and samples
├── docs/                   # Documentation
└── scripts/                # Build and utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+ (for model training)
- Modern browser (Chrome, Edge, or Firefox)

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd /Users/thirumalaiarumugam/Desktop/CBV-System
   ```

2. **Install frontend dependencies:**
   ```bash
   cd app
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Access the application:**
   - Open browser to: `https://localhost:8080`
   - Accept the self-signed certificate warning (development only)

## 📋 Current Status: Phase 0 - Foundation ✅

### Completed Features

- ✅ Project structure created
- ✅ React + Webpack setup with HTTPS
- ✅ Global configuration system
- ✅ Logger utility with multiple levels
- ✅ Helper utilities (math, crypto, performance)
- ✅ Encryption service (Web Crypto API)
- ✅ Storage service (IndexedDB)
- ✅ Camera service (MediaDevices API)
- ✅ Debug panel component
- ✅ Main app with system status

### Next Steps (Phase 1)

- [ ] Implement routing with react-router-dom
- [ ] Create page components (Home, Registration, Capture, Protected, Evaluation)
- [ ] Set up navigation flow

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Webpack 5 with webpack-dev-server
- **ML Runtime**: TensorFlow.js, ONNX Runtime Web
- **Storage**: IndexedDB (via idb)
- **Encryption**: Web Crypto API

### Backend/Training
- **Language**: Python 3
- **ML Libraries**: scikit-learn, TensorFlow, ONNX
- **Image Processing**: OpenCV, PIL

## 📖 Documentation

- [Implementation Plan](./CBV-System-Implementation-Plan.md) - Complete technical specification
- [TODO List](./CBV-System-TODO.md) - Step-by-step checklist
- Architecture (Coming in Phase 1)
- API Reference (Coming in Phase 2)

## 🔧 Configuration

Key configuration in `app/src/utils/config.js`:

```javascript
CONFIG = {
  VERSION: '1.0.0',
  SAMPLING_RATES: {
    FACE_DETECTION: 5,        // 5 fps
    VERIFICATION_LOOP: 2,     // 2 Hz
  },
  TRUST: {
    WEIGHTS: {
      FACE: 0.5,
      LIVENESS: 0.2,
      BEHAVIOR: 0.3,
    },
    THRESHOLDS: {
      NORMAL: 0.7,
      WATCH: 0.5,
      RESTRICT: 0.3,
    },
  },
  DEMO_CREDENTIALS: {
    USER_ID: 'Thiru',
    PASSWORD: 'thiru0509',
  },
}
```

## 🧪 Testing

### Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ⚠️ Safari 14+ (limited WebGL support)

### Required Features

- Camera access (getUserMedia)
- Web Crypto API
- IndexedDB
- WebGL (for TensorFlow.js)

## 📊 Project Phases

1. **Phase 0**: Foundation and Safety Rails ✅ (Current)
2. **Phase 1**: UX Flow and Navigation Skeleton
3. **Phase 2**: Registration and Identity Enrolment Gate
4. **Phase 3**: Data Collection Session
5. **Phase 4**: Storage Layer (IndexedDB + Encryption + Export)
6. **Phase 5**: Model Training and ONNX Packaging
7. **Phase 6**: Continuous Verification Runtime Loop
8. **Phase 7**: Enforcement and Recovery
9. **Phase 8**: Evaluation Harness and Demo Script

## 🔐 Security Considerations

- All sensitive data encrypted at rest (AES-GCM)
- Password-based key derivation (PBKDF2, 100k iterations)
- HTTPS required for camera and crypto APIs
- No data transmitted to external servers
- Local-only processing and storage

## 📝 License

MIT License - Master's Thesis Project

## 👤 Author

**Thirumalai Arumugam**
- Master's in Cybersecurity
- Email: [Your Email]
- GitHub: [Your GitHub]

## 🙏 Acknowledgments

- TensorFlow.js team for face detection models
- ONNX Runtime team for cross-platform inference
- Web Crypto API for secure encryption

---

**Note**: This is a research prototype for academic purposes. Not intended for production use without further security auditing and testing.
