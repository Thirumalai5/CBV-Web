# Import Enrollment Data Guide

## Overview
You can now import your existing enrollment JSON files to bypass the face detection issues and test the verification system with manual control buttons.

## Steps to Import Your Data

### 1. Prepare Your JSON Files
Make sure you have your 3 enrollment JSON files ready:
- Face samples data
- Liveness samples data  
- Behavior windows data

### 2. Navigate to Settings Page
1. Open the CBV System app in your browser
2. Make sure you're logged in as "Thiru" (or your user)
3. Click on "Settings" in the navigation bar

### 3. Import Your Data
1. In the Settings page, scroll to the "Export Data" section
2. You'll see two buttons:
   - **Export Data** - Downloads your current data
   - **Import Data** - Uploads enrollment data (NEW!)
3. Click the **"Import Data"** button
4. Select one of your JSON enrollment files
5. Wait for the success message: "Data imported successfully from [filename]! Reloading..."
6. The page will automatically reload and show your imported data

### 4. Import All Three Files
Repeat step 3 for each of your JSON files:
- Import face samples JSON
- Import liveness samples JSON
- Import behavior windows JSON

### 5. Verify Import
After importing, check the "Enrollment Data" section in Settings:
- ✅ Face Samples: Should show your imported count
- ✅ Liveness Duration: Should show your imported duration
- ✅ Behavior Duration: Should show your imported duration

### 6. Test Manual Verification Buttons
Once data is imported:
1. Navigate to the "Protected App" page
2. You should see the verification control panel with:
   - **Initiate Verification** button
   - **Terminate Verification** button
3. Click "Initiate Verification" to start the continuous verification loop
4. The system will:
   - Start face matching (using your imported face template)
   - Monitor liveness detection
   - Track behavior patterns
   - Update trust scores in real-time
5. Click "Terminate Verification" to stop

## Expected JSON Format

Your JSON files should have this structure:

```json
{
  "version": "1.0.0",
  "schemaVersion": "1.0",
  "exportDate": "2026-01-08T04:54:39.948Z",
  "userId": "Thiru",
  "data": {
    "faceSamples": [...],
    "livenessSamples": [...],
    "behaviorWindows": [...],
    "logs": [...]
  },
  "statistics": {
    "totalFaceSamples": 50,
    "totalLivenessSamples": 10,
    "totalBehaviorWindows": 60
  }
}
```

## Troubleshooting

### Import Fails
- **Error: "Invalid export data"**
  - Check that your JSON file is valid
  - Ensure it has the required fields (version, userId, data)
  
- **Error: "No user logged in"**
  - Make sure you're logged in before importing
  - Go to Home page and register/login first

### Data Not Showing
- Refresh the Settings page
- Check browser console for errors
- Verify the JSON file structure matches the expected format

### Verification Not Working
- Ensure all three types of data are imported (face, liveness, behavior)
- Check that enrollment status shows "Completed" in Settings
- Try logging out and logging back in

## Next Steps

After successful import:
1. ✅ Test manual verification buttons on Protected App page
2. ✅ Verify trust scores update in real-time
3. ✅ Test face matching with camera
4. ✅ Monitor behavior tracking
5. ✅ Check verification status changes (NORMAL → WATCH → RESTRICT → REAUTH)

## Notes

- Imported data will be associated with your current logged-in user
- You can import multiple times (data will be added, not replaced)
- Use "Purge All Data" in Settings to clear everything and start fresh
- The import preserves all metadata and timestamps from your original enrollment

---

**Status**: Import functionality ready ✅  
**Last Updated**: January 2026  
**Feature**: Settings Page → Import Data button
