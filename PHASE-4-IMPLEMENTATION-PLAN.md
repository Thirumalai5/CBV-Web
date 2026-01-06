# Phase 4 — Storage Layer (IndexedDB + Encryption + Export)

## Goal
Store enrolment datasets locally and make them retrievable for training and runtime verification.

## Current Status Assessment

### ✅ Already Implemented (Phase 0-3)
1. **Storage Service** (`app/src/services/storage.service.js`)
   - IndexedDB wrapper with idb library
   - Basic CRUD operations
   - Store structure defined

2. **Encryption Service** (`app/src/services/encryption.service.js`)
   - AES-GCM encryption/decryption
   - PBKDF2 key derivation
   - Web Crypto API integration

3. **Data Collection** (Phase 3)
   - Face samples being captured
   - Liveness samples being captured
   - Behavior windows being captured
   - Data being saved to IndexedDB

### 🔍 What Needs to Be Done

Based on the original task description, Phase 4 requires:

## Tasks

### 1. Create IndexedDB Schema ✅ (Mostly Done)
**Status**: Schema already defined in storage.service.js

**Existing Stores**:
- ✅ `users` (id, createdAt, versions)
- ✅ `face_samples` (userId, sessionId, dataUrl/blob, metadata)
- ✅ `liveness_samples` (userId, timeSeries features)
- ✅ `behavior_windows` (userId, window features)
- ✅ `templates` (face centroid embedding, behaviour baseline, thresholds)
- ✅ `logs` (trust score timeline, state transitions)

**Action Required**: Verify schema is complete and add any missing fields

### 2. Encrypt Sensitive Objects ⚠️ (Partially Done)
**Status**: Encryption service exists but may not be fully integrated

**What to Encrypt**:
- Templates (face embeddings, behavior baselines)
- Face samples (images/crops)
- Liveness sequences
- Behavior features

**Action Required**:
- Verify encryption is applied to all sensitive data before storage
- Test encryption/decryption roundtrip
- Ensure keys are properly derived from user password

### 3. Implement Export Tool 📦 (NEW)
**Status**: Not implemented

**Requirements**:
- Export selected stores into `cbv_sessions.json`
- Download file locally
- Include all enrollment data
- Maintain data structure for re-import

**Action Required**:
- Create export service/utility
- Add export UI (button on settings/profile page)
- Format data as JSON
- Trigger browser download

### 4. Implement Reset/Purge Tool 🗑️ (NEW)
**Status**: Not implemented

**Requirements**:
- Owner can wipe baseline and all data
- Confirmation dialog before deletion
- Clear all stores
- Reset enrollment status

**Action Required**:
- Create purge service/utility
- Add purge UI (button with confirmation)
- Clear IndexedDB stores
- Reset auth context state

## Implementation Plan

### Step 1: Verify and Enhance Storage Schema
**Files to Review**:
- `app/src/services/storage.service.js`
- `app/src/utils/config.js` (DB schema config)

**Tasks**:
- [ ] Review existing schema
- [ ] Add any missing fields
- [ ] Add indexes for performance
- [ ] Test data persistence

### Step 2: Verify Encryption Integration
**Files to Review**:
- `app/src/services/encryption.service.js`
- `app/src/services/storage.service.js`
- All capture hooks (face, liveness, behavior)

**Tasks**:
- [ ] Verify templates are encrypted before storage
- [ ] Verify face samples are encrypted
- [ ] Test encryption/decryption
- [ ] Add encryption status indicators

### Step 3: Implement Export Functionality
**New Files to Create**:
- `app/src/services/export.service.js` - Export logic
- `app/src/components/settings/ExportData.jsx` - Export UI
- `app/src/utils/export-helpers.js` - Export utilities

**Tasks**:
- [ ] Create export service
- [ ] Implement data serialization
- [ ] Add download trigger
- [ ] Create export UI component
- [ ] Add to settings/profile page
- [ ] Test export with real data

### Step 4: Implement Purge Functionality
**New Files to Create**:
- `app/src/services/purge.service.js` - Purge logic
- `app/src/components/settings/PurgeData.jsx` - Purge UI with confirmation

**Tasks**:
- [ ] Create purge service
- [ ] Implement store clearing
- [ ] Add confirmation dialog
- [ ] Create purge UI component
- [ ] Add to settings/profile page
- [ ] Test purge functionality

### Step 5: Create Settings/Profile Page
**New Files to Create**:
- `app/src/pages/SettingsPage.jsx` - Settings page
- `app/src/pages/SettingsPage.css` - Styles

**Tasks**:
- [ ] Create settings page layout
- [ ] Add export data section
- [ ] Add purge data section
- [ ] Add data statistics display
- [ ] Add to navigation
- [ ] Test all functionality

## Done Means

Phase 4 is complete when:
- ✅ Data persists after refresh
- ✅ Can be exported as a single file (`cbv_sessions.json`)
- ✅ Can be wiped safely (purge functionality)
- ✅ Sensitive data is encrypted at rest
- ✅ Export includes all enrollment data
- ✅ Purge requires confirmation and clears all data

## Technical Specifications

### Export Format (`cbv_sessions.json`)
```json
{
  "version": "1.0",
  "exportDate": "2024-01-01T00:00:00Z",
  "userId": "Thiru",
  "sessionId": "session_123",
  "data": {
    "user": { /* user profile */ },
    "faceSamples": [ /* array of face samples */ ],
    "livenessSamples": [ /* array of liveness data */ ],
    "behaviorWindows": [ /* array of behavior windows */ ],
    "templates": { /* trained templates */ },
    "metadata": { /* session metadata */ }
  }
}
```

### Encryption Details
- **Algorithm**: AES-GCM
- **Key Length**: 256 bits
- **IV Length**: 12 bytes
- **Salt Length**: 16 bytes
- **PBKDF2 Iterations**: 100,000
- **Key Derivation**: From user password

### Storage Estimates
- Face samples: ~50 samples × 100KB = ~5MB
- Liveness data: ~30s × 10fps × 1KB = ~300KB
- Behavior windows: 20 windows × 10KB = ~200KB
- Templates: ~1MB
- **Total**: ~6.5MB per enrollment

## Testing Checklist

### Storage Tests
- [ ] Data persists after page refresh
- [ ] Data persists after browser restart
- [ ] Multiple sessions can be stored
- [ ] Data can be retrieved correctly
- [ ] Indexes work for queries

### Encryption Tests
- [ ] Templates are encrypted
- [ ] Face samples are encrypted
- [ ] Decryption works correctly
- [ ] Key derivation is consistent
- [ ] Encrypted data is not readable

### Export Tests
- [ ] Export creates valid JSON file
- [ ] Export includes all data
- [ ] Export file downloads correctly
- [ ] Export can be re-imported (future)
- [ ] Export handles large datasets

### Purge Tests
- [ ] Purge requires confirmation
- [ ] Purge clears all stores
- [ ] Purge resets enrollment status
- [ ] Purge cannot be undone
- [ ] UI updates after purge

## Dependencies

### Existing
- `idb` - IndexedDB wrapper (already installed)
- Web Crypto API (browser native)

### New (if needed)
- None - use existing libraries

## Timeline Estimate

- **Step 1** (Schema verification): 1-2 hours
- **Step 2** (Encryption verification): 2-3 hours
- **Step 3** (Export implementation): 3-4 hours
- **Step 4** (Purge implementation): 2-3 hours
- **Step 5** (Settings page): 2-3 hours
- **Testing**: 2-3 hours

**Total**: 12-18 hours

## Priority Order

1. **High Priority**: Verify encryption is working
2. **High Priority**: Implement export functionality
3. **Medium Priority**: Implement purge functionality
4. **Medium Priority**: Create settings page
5. **Low Priority**: Add data statistics/visualization

## Next Steps

1. Review existing storage and encryption services
2. Verify data is being encrypted before storage
3. Implement export service
4. Implement purge service
5. Create settings page UI
6. Test all functionality end-to-end

---

**Status**: Ready to begin Phase 4 implementation
**Prerequisites**: Phase 3 data collection should be complete (or at least testable)
