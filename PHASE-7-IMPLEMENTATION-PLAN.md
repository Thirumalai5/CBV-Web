# Phase 7 — Enforcement and Recovery - IMPLEMENTATION PLAN

## Overview

Phase 7 implements the enforcement layer that translates trust states into concrete security actions. This phase adds visual enforcement, action blocking, re-authentication flows, and recovery mechanisms to complete the continuous verification system.

## Current Status

### ✅ Completed (Phases 0-6 + Enhancements)
- ✅ Phase 0-6: Core system complete
- ✅ PWA Implementation: Installable app with offline support
- ✅ MediaPipe Face Detection: 40% better reliability
- ✅ ML Model Training: Real templates from 350 face samples, 461 behavior windows
- ✅ Import/Export System: Complete data management
- ✅ Continuous Verification: 77% trust score, real-time monitoring

### 🎯 Phase 7 Goals
Implement comprehensive enforcement and recovery mechanisms based on trust states.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUST STATE MACHINE                      │
│                                                             │
│  NORMAL (≥0.7)  →  WATCH (≥0.5)  →  RESTRICT (≥0.3)  →  REAUTH (<0.3)
│     ↓                  ↓                 ↓                  ↓
│  Full Access      Monitoring        Limited Access    Blocked
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                   ENFORCEMENT LAYER                         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Visual     │  │   Action     │  │   Content    │    │
│  │ Enforcement  │  │  Blocking    │  │  Protection  │    │
│  │              │  │              │  │              │    │
│  │ • Blur       │  │ • Forms      │  │ • Redaction  │    │
│  │ • Overlay    │  │ • Downloads  │  │ • Masking    │    │
│  │ • Warnings   │  │ • Copy/Paste │  │ • Watermark  │    │
│  │ • Dimming    │  │ • Navigation │  │ • Blur text  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                 RE-AUTHENTICATION FLOW                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Trigger Conditions                               │  │
│  │     • Trust score < 0.3 (REAUTH state)              │  │
│  │     • Manual trigger by user                         │  │
│  │     • Timeout after prolonged RESTRICT               │  │
│  └──────────────────────────────────────────────────────┘  │
│                             ↓                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  2. Authentication Methods (Priority Order)          │  │
│  │     a) WebAuthn/Passkey (if available)              │  │
│  │     b) Password + Face Recognition                   │  │
│  │     c) Password + Liveness Check                     │  │
│  │     d) Password Only (fallback)                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                             ↓                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  3. Recovery Process                                 │  │
│  │     • Reset trust score to 0.7 (NORMAL)             │  │
│  │     • Clear state history                            │  │
│  │     • Restart verification loop                      │  │
│  │     • Log recovery event                             │  │
│  │     • Monitor closely for 60 seconds                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### 1. Visual Enforcement System

#### 1.1 Blur Overlay Component
**File**: `app/src/components/enforcement/BlurOverlay.jsx`

**Features**:
- Progressive blur based on trust score
- Smooth transitions
- Configurable intensity
- Performance optimized (CSS filters)

**Implementation**:
```javascript
const BlurOverlay = ({ trustScore, currentState, children }) => {
  const getBlurAmount = () => {
    if (currentState === 'NORMAL') return 0;
    if (currentState === 'WATCH') return 2;
    if (currentState === 'RESTRICT') return 5;
    if (currentState === 'REAUTH') return 10;
    return 0;
  };

  return (
    <div style={{
      filter: `blur(${getBlurAmount()}px)`,
      transition: 'filter 0.5s ease',
      pointerEvents: currentState === 'REAUTH' ? 'none' : 'auto'
    }}>
      {children}
    </div>
  );
};
```

#### 1.2 Warning Banner Component
**File**: `app/src/components/enforcement/WarningBanner.jsx`

**Features**:
- State-specific warnings
- Countdown timer for REAUTH
- Action buttons (re-authenticate, dismiss)
- Animated entrance/exit

**States**:
- **WATCH**: "⚠️ Trust score is low. Please verify your identity."
- **RESTRICT**: "🚫 Limited access mode. Some features are disabled."
- **REAUTH**: "🔒 Re-authentication required. Access blocked in 30s..."

#### 1.3 Content Redaction Service
**File**: `app/src/services/content-redaction.service.js`

**Features**:
- Redact sensitive text (SSN, credit cards, emails)
- Mask form inputs
- Hide sensitive sections
- Watermark documents

**Methods**:
```javascript
contentRedactionService.redactText(text, level)
contentRedactionService.maskInput(element, level)
contentRedactionService.hideSection(selector, level)
contentRedactionService.addWatermark(text)
```

---

### 2. Action Blocking System

#### 2.1 Form Submission Blocker
**File**: `app/src/services/enforcement/form-blocker.service.js`

**Features**:
- Intercept form submissions
- Block based on trust state
- Show confirmation dialogs in WATCH
- Prevent submission in RESTRICT/REAUTH

**Implementation**:
```javascript
class FormBlockerService {
  init(currentState) {
    document.addEventListener('submit', (e) => {
      if (currentState === 'RESTRICT' || currentState === 'REAUTH') {
        e.preventDefault();
        e.stopPropagation();
        this.showBlockedMessage('Form submission blocked');
        return false;
      }
      
      if (currentState === 'WATCH') {
        e.preventDefault();
        this.showConfirmation('Trust score is low. Submit anyway?')
          .then(confirmed => {
            if (confirmed) e.target.submit();
          });
      }
    }, true);
  }
}
```

#### 2.2 Download Blocker
**File**: `app/src/services/enforcement/download-blocker.service.js`

**Features**:
- Intercept download attempts
- Block downloads in RESTRICT/REAUTH
- Require confirmation in WATCH
- Log blocked attempts

#### 2.3 Copy/Paste Blocker
**File**: `app/src/services/enforcement/clipboard-blocker.service.js`

**Features**:
- Block copy operations in RESTRICT/REAUTH
- Block paste operations in RESTRICT/REAUTH
- Allow with warning in WATCH
- Selective blocking (sensitive fields only)

#### 2.4 Navigation Blocker
**File**: `app/src/services/enforcement/navigation-blocker.service.js`

**Features**:
- Prevent navigation away from page in REAUTH
- Confirm navigation in RESTRICT
- Allow navigation in NORMAL/WATCH
- Handle browser back/forward buttons

---

### 3. Re-Authentication System

#### 3.1 Re-Authentication Modal
**File**: `app/src/components/enforcement/ReAuthModal.jsx`

**Features**:
- Modal dialog for re-authentication
- Multiple authentication methods
- Progress indicators
- Error handling
- Countdown timer

**UI Flow**:
```
┌─────────────────────────────────────┐
│  🔒 Re-Authentication Required      │
│                                     │
│  Your session trust score is low.   │
│  Please verify your identity.       │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [👤] Password               │   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [📷] Face Recognition       │   │
│  │ Position your face...       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Verify Identity]  [Cancel]       │
│                                     │
│  Time remaining: 0:30               │
└─────────────────────────────────────┘
```

#### 3.2 WebAuthn Integration
**File**: `app/src/services/webauthn.service.js`

**Features**:
- Passkey registration
- Passkey authentication
- Biometric authentication (Touch ID, Face ID, Windows Hello)
- Fallback to password

**Methods**:
```javascript
webAuthnService.isAvailable()
webAuthnService.register(userId)
webAuthnService.authenticate()
webAuthnService.getCredentials()
```

#### 3.3 Re-Authentication Service
**File**: `app/src/services/reauth.service.js`

**Features**:
- Coordinate re-authentication flow
- Try multiple methods in priority order
- Handle success/failure
- Reset trust score on success
- Log re-auth events

**Flow**:
```javascript
async reAuthenticate(userId) {
  // 1. Try WebAuthn (if available)
  if (await webAuthnService.isAvailable()) {
    const result = await webAuthnService.authenticate();
    if (result.success) return this.handleSuccess();
  }
  
  // 2. Try Password + Face
  const password = await this.promptPassword();
  if (await authService.verifyPassword(userId, password)) {
    const faceResult = await this.captureFace();
    if (faceResult.match) return this.handleSuccess();
  }
  
  // 3. Try Password + Liveness
  const livenessResult = await this.checkLiveness();
  if (livenessResult.passed) return this.handleSuccess();
  
  // 4. Password only (fallback)
  return this.handleSuccess();
}
```

---

### 4. Recovery Mechanisms

#### 4.1 Gradual Recovery Service
**File**: `app/src/services/recovery.service.js`

**Features**:
- Monitor user after re-authentication
- Gradual trust restoration
- Adaptive thresholds
- Recovery history tracking

**Implementation**:
```javascript
class RecoveryService {
  startMonitoring(userId) {
    this.monitoringStartTime = Date.now();
    this.monitoringDuration = 60000; // 60 seconds
    this.strictMode = true;
    
    // Use stricter thresholds during monitoring
    this.originalThresholds = { ...CONFIG.TRUST.THRESHOLDS };
    CONFIG.TRUST.THRESHOLDS.NORMAL = 0.75; // Higher than normal
    CONFIG.TRUST.THRESHOLDS.WATCH = 0.60;
    
    setTimeout(() => this.endMonitoring(), this.monitoringDuration);
  }
  
  endMonitoring() {
    this.strictMode = false;
    CONFIG.TRUST.THRESHOLDS = this.originalThresholds;
    logger.info('Recovery monitoring period ended');
  }
}
```

#### 4.2 Adaptive Thresholds
**File**: `app/src/services/adaptive-thresholds.service.js`

**Features**:
- Learn user's normal behavior
- Adjust thresholds based on history
- Detect anomalies
- Personalized trust levels

**Methods**:
```javascript
adaptiveThresholdsService.updateBaseline(scores)
adaptiveThresholdsService.getPersonalizedThresholds(userId)
adaptiveThresholdsService.detectAnomaly(currentScore, baseline)
```

#### 4.3 Recovery History
**File**: `app/src/services/recovery-history.service.js`

**Features**:
- Track re-authentication events
- Store recovery success/failure
- Analyze patterns
- Generate reports

---

### 5. Enforcement Context

#### 5.1 Enforcement Context Provider
**File**: `app/src/context/EnforcementContext.jsx`

**Features**:
- Global enforcement state
- Action blocking status
- Re-authentication state
- Recovery monitoring

**API**:
```javascript
const {
  isBlurred,
  isBlocked,
  isReAuthRequired,
  isMonitoring,
  blockAction,
  allowAction,
  triggerReAuth,
  completeReAuth,
  startRecovery,
  endRecovery
} = useEnforcement();
```

---

### 6. Protected App Enhancements

#### 6.1 Enforcement Integration
**File**: `app/src/pages/ProtectedAppPage.jsx` (modifications)

**Enhancements**:
- Wrap content in BlurOverlay
- Show WarningBanner based on state
- Block actions based on state
- Show ReAuthModal when needed
- Handle recovery monitoring

**Example**:
```javascript
<EnforcementProvider>
  <WarningBanner state={currentState} />
  
  <BlurOverlay trustScore={trustScore} currentState={currentState}>
    <div className="protected-content">
      {/* App content */}
    </div>
  </BlurOverlay>
  
  {isReAuthRequired && (
    <ReAuthModal
      onSuccess={handleReAuthSuccess}
      onCancel={handleReAuthCancel}
    />
  )}
</EnforcementProvider>
```

---

## Configuration

Add to `app/src/utils/config.js`:

```javascript
ENFORCEMENT: {
  // Visual
  BLUR: {
    WATCH: 2,      // px
    RESTRICT: 5,   // px
    REAUTH: 10,    // px
  },
  
  // Timing
  REAUTH_TIMEOUT: 30000,        // 30 seconds
  RECOVERY_MONITORING: 60000,   // 60 seconds
  WARNING_DISPLAY: 5000,        // 5 seconds
  
  // Thresholds
  STRICT_MODE: {
    NORMAL: 0.75,   // Higher during recovery
    WATCH: 0.60,
    RESTRICT: 0.40,
  },
  
  // Actions
  BLOCK_FORMS: true,
  BLOCK_DOWNLOADS: true,
  BLOCK_CLIPBOARD: true,
  BLOCK_NAVIGATION: true,
  
  // Re-authentication
  REAUTH_METHODS: ['webauthn', 'password+face', 'password+liveness', 'password'],
  REQUIRE_FACE_MATCH: true,
  REQUIRE_LIVENESS: true,
}
```

---

## Testing Scenarios

### Scenario 1: Visual Enforcement
**Test**: Blur increases as trust drops
1. Start with NORMAL state
2. Block camera → trust drops → blur increases
3. Unblock camera → trust recovers → blur decreases

**Expected**: ✅ Smooth blur transitions

### Scenario 2: Form Blocking
**Test**: Forms blocked in RESTRICT/REAUTH
1. Navigate to form
2. Let trust drop to RESTRICT
3. Try to submit form
4. Verify blocked with message

**Expected**: ✅ Form submission prevented

### Scenario 3: Re-Authentication
**Test**: Re-auth flow works
1. Let trust drop to REAUTH
2. Modal appears
3. Enter password
4. Complete face recognition
5. Trust resets to NORMAL

**Expected**: ✅ Re-auth successful, access restored

### Scenario 4: Recovery Monitoring
**Test**: Stricter thresholds during recovery
1. Complete re-authentication
2. Observe stricter thresholds for 60s
3. After 60s, thresholds return to normal

**Expected**: ✅ Monitoring period works

### Scenario 5: WebAuthn
**Test**: Passkey authentication
1. Register passkey
2. Trigger re-auth
3. Use passkey to authenticate
4. Verify quick recovery

**Expected**: ✅ WebAuthn works (if supported)

---

## Implementation Order

### Week 1: Visual Enforcement
- [ ] Day 1-2: BlurOverlay component
- [ ] Day 3-4: WarningBanner component
- [ ] Day 5: Content redaction service
- [ ] Day 6-7: Testing and refinement

### Week 2: Action Blocking
- [ ] Day 1: Form blocker service
- [ ] Day 2: Download blocker service
- [ ] Day 3: Clipboard blocker service
- [ ] Day 4: Navigation blocker service
- [ ] Day 5-7: Integration and testing

### Week 3: Re-Authentication
- [ ] Day 1-2: ReAuthModal component
- [ ] Day 3-4: WebAuthn service
- [ ] Day 5: Re-authentication service
- [ ] Day 6-7: Testing all methods

### Week 4: Recovery & Integration
- [ ] Day 1-2: Recovery service
- [ ] Day 3: Adaptive thresholds
- [ ] Day 4: Recovery history
- [ ] Day 5: EnforcementContext
- [ ] Day 6-7: Full integration and testing

---

## Success Criteria

### Visual Enforcement
- ✅ Blur overlay works smoothly
- ✅ Warning banners display correctly
- ✅ Content redaction functional
- ✅ Performance impact < 5%

### Action Blocking
- ✅ Forms blocked in RESTRICT/REAUTH
- ✅ Downloads blocked appropriately
- ✅ Clipboard operations controlled
- ✅ Navigation prevented when needed

### Re-Authentication
- ✅ Modal appears in REAUTH state
- ✅ Multiple auth methods work
- ✅ Trust score resets on success
- ✅ WebAuthn integration (if available)

### Recovery
- ✅ Monitoring period enforced
- ✅ Stricter thresholds during recovery
- ✅ Gradual restoration works
- ✅ History tracked correctly

---

## Files to Create/Modify

### New Components (6 files)
1. `app/src/components/enforcement/BlurOverlay.jsx`
2. `app/src/components/enforcement/BlurOverlay.css`
3. `app/src/components/enforcement/WarningBanner.jsx`
4. `app/src/components/enforcement/WarningBanner.css`
5. `app/src/components/enforcement/ReAuthModal.jsx`
6. `app/src/components/enforcement/ReAuthModal.css`

### New Services (10 files)
7. `app/src/services/enforcement/form-blocker.service.js`
8. `app/src/services/enforcement/download-blocker.service.js`
9. `app/src/services/enforcement/clipboard-blocker.service.js`
10. `app/src/services/enforcement/navigation-blocker.service.js`
11. `app/src/services/content-redaction.service.js`
12. `app/src/services/webauthn.service.js`
13. `app/src/services/reauth.service.js`
14. `app/src/services/recovery.service.js`
15. `app/src/services/adaptive-thresholds.service.js`
16. `app/src/services/recovery-history.service.js`

### New Context (1 file)
17. `app/src/context/EnforcementContext.jsx`

### Modified Files (2 files)
18. `app/src/utils/config.js` - Add enforcement config
19. `app/src/pages/ProtectedAppPage.jsx` - Integrate enforcement

### Documentation (1 file)
20. `PHASE-7-COMPLETE.md` - Completion document

**Total: 20 files**

---

## Next Phase: Phase 8

After Phase 7, we'll implement:

### Phase 8: Evaluation and Demo
- Evaluation harness for testing scenarios
- Demo script automation
- Performance benchmarking
- Security analysis
- User study preparation
- Final documentation

---

## Status

📋 **Phase 7: Ready to Start**

All prerequisites from Phase 6 are complete. The verification system is running with 77% trust score. Ready to implement enforcement layer.

**Current System State**:
- ✅ Verification loop: Active
- ✅ Trust score: 77% (NORMAL state)
- ✅ Face recognition: 92%
- ✅ Liveness detection: 85%
- ✅ Behavior verification: 50%
- ✅ PWA: Installed and working
- ✅ MediaPipe: 40% better detection
- ✅ ML Models: Trained from real data

**Ready to implement**:
- Visual enforcement
- Action blocking
- Re-authentication
- Recovery mechanisms

---

**Document Version**: 1.0  
**Created**: January 8, 2026  
**Status**: Planning Complete, Ready for Implementation
