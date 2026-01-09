# Phase 2 - Detailed Implementation Plan

## Overview
Phase 1 already implemented the core Phase 2 requirements. Phase 2 will focus on:
1. Enhanced security and access control
2. Enrollment progress tracking
3. Session management improvements
4. Better error handling and validation

## What's Already Working (Phase 1)
✅ Demo credentials (Thiru/thiru0509)
✅ Login validation
✅ Session management with sessionStorage
✅ User profile in IndexedDB
✅ Encryption key derivation
✅ Basic enrollment completion tracking
✅ Protected routes

## Phase 2 Enhancements

### 1. Enhanced Config (Add to config.js)
```javascript
ENROLLMENT: {
  STATUS: {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
  },
  REQUIREMENTS: {
    MIN_FACE_SAMPLES: 50,
    MIN_LIVENESS_DURATION: 30,  // seconds
    MIN_BEHAVIOR_WINDOWS: 20,
  },
  SESSION_TIMEOUT: 1800000,  // 30 minutes
},
AUTH: {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 300000,  // 5 minutes
  SESSION_TIMEOUT: 3600000,  // 1 hour
},
PERMISSIONS: {
  OWNER_ONLY: ['update_template', 'export_data', 'purge_data'],
  VERIFICATION_ONLY: ['view_data', 'verify'],
},
```

### 2. Enhanced Auth Service
- Add login attempt tracking
- Add account lockout
- Add session timeout
- Add permission checking
- Add enrollment status management

### 3. Enhanced Storage Service
- Add enrollment metadata storage
- Add salt storage for encryption
- Add version tracking
- Add data quality metrics

### 4. New Permission Service
- Check if user is owner
- Check if user can update templates
- Check if user can export data
- Check if user can purge data

### 5. Enhanced Capture Page
- Show enrollment progress
- Show enrollment status
- Show requirements checklist
- Add resume/restart logic

### 6. Enhanced User Profile Schema
```javascript
{
  userId: string,
  createdAt: timestamp,
  lastLogin: timestamp,
  loginAttempts: number,
  lockedUntil: timestamp | null,
  enrollment: {
    status: 'not_started' | 'in_progress' | 'completed',
    startedAt: timestamp | null,
    completedAt: timestamp | null,
    progress: {
      faceSamples: number,
      livenessDuration: number,
      behaviorWindows: number,
    },
    attempts: number,
  },
  templates: {
    version: number,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  salt: Uint8Array,  // For encryption
  permissions: string[],
}
```

## Implementation Order

1. ✅ Update CONFIG with new settings
2. ✅ Create permission.service.js
3. ✅ Enhance auth.service.js
4. ✅ Enhance storage.service.js  
5. ✅ Update AuthContext with new features
6. ✅ Enhance CapturePage with progress tracking
7. ✅ Add enrollment status components
8. ✅ Test all features

## Testing Checklist
- [ ] Login with correct credentials
- [ ] Login with wrong credentials (track attempts)
- [ ] Account lockout after 5 failed attempts
- [ ] Session timeout after 1 hour
- [ ] Enrollment progress tracking
- [ ] Template update permission check
- [ ] Export data permission check
- [ ] Purge data permission check
- [ ] Enrollment completion requirements
