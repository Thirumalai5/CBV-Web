# Phase 3 - Behavior Capture Guide

## Current Status
The behavior capture is showing: **"Need 20 more windows"**

This means you need to interact with the system to collect behavioral data.

## How Behavior Capture Works

### Requirements
- **Window Size**: 5 seconds per window
- **Target Windows**: 20 windows
- **Total Time Needed**: ~100 seconds (20 windows × 5 seconds)
- **Per Window Minimum**: 
  - 5 keystrokes OR
  - 10 mouse events (movements/clicks)

### Steps to Complete Behavior Capture

1. **Click "Start Behavior Capture"** button

2. **Type in the text area**:
   - Type the provided prompt naturally
   - Don't rush - type at your normal speed
   - The system captures keystroke timing (dwell time, flight time)
   - Aim for at least 5 keystrokes every 5 seconds

3. **Move your mouse**:
   - Move the mouse around the interaction area
   - Click the "Click Me" buttons
   - Make natural mouse movements
   - The system captures velocity, acceleration, curvature
   - Aim for at least 10 mouse movements/clicks every 5 seconds

4. **Continue for ~100 seconds**:
   - Keep typing and moving the mouse
   - Watch the progress bar fill up
   - You'll see windows being captured in the list below
   - Each window shows keystroke and click counts

5. **Automatic Completion**:
   - The capture will stop automatically after 20 windows
   - Or you can click "Stop Capture" early (but you'll need 20 windows)

## What's Being Captured

### Keystroke Dynamics
- **Dwell Time**: How long you hold each key down (50-500ms)
- **Flight Time**: Time between releasing one key and pressing the next (50-2000ms)
- **Typing Rhythm**: Consistency of your typing pattern
- **Key Count**: Number of keys pressed

### Mouse Dynamics
- **Velocity**: Speed of mouse movement (px/s)
- **Acceleration**: Changes in velocity
- **Curvature**: Direction changes (smoothness of movement)
- **Click Timing**: When and where you click
- **Total Distance**: How far the mouse travels
- **Idle Time**: Periods of no movement

## Tips for Good Data Collection

### DO:
✅ Type naturally at your normal speed
✅ Move the mouse smoothly and naturally
✅ Click on different areas
✅ Take your time - quality over speed
✅ Keep interacting for the full duration

### DON'T:
❌ Type too fast or too slow (be natural)
❌ Make jerky, unnatural mouse movements
❌ Stop typing/moving for long periods
❌ Try to "game" the system

## Troubleshooting

### "Need 20 more windows" - No windows captured
**Problem**: You haven't started capture or haven't been interacting
**Solution**: 
1. Click "Start Behavior Capture"
2. Start typing in the text area
3. Move your mouse around
4. Wait for windows to appear in the list

### Windows not being created
**Problem**: Not enough interaction per window
**Solution**: Each 5-second window needs either:
- 5+ keystrokes, OR
- 10+ mouse movements/clicks
- Make sure you're actively typing AND moving the mouse

### Progress stuck at low percentage
**Problem**: Windows are being discarded due to insufficient data
**Solution**: Increase your interaction rate:
- Type more frequently
- Move the mouse more
- Click the buttons
- Don't let 5 seconds pass without interaction

## Expected Timeline

```
Time    | Windows | Progress | What to Do
--------|---------|----------|------------------
0-5s    | 0-1     | 0-5%     | Start typing & moving mouse
5-25s   | 1-5     | 5-25%    | Continue natural interaction
25-50s  | 5-10    | 25-50%   | Keep typing the prompt
50-75s  | 10-15   | 50-75%   | Maintain interaction pace
75-100s | 15-20   | 75-100%  | Final windows, almost done!
100s+   | 20      | 100%     | ✅ Complete!
```

## Validation

After capturing 20 windows, the system validates:
- ✅ Sufficient windows collected (20)
- ✅ Each window has enough data
- ✅ Keystroke timing is within valid ranges
- ✅ Mouse dynamics are within valid ranges

## What Happens Next

Once behavior capture is complete:
1. Data is saved to IndexedDB
2. The "Behavior Capture Complete ✓" message appears
3. You can proceed to the next step in enrollment
4. The data will be used to train your behavioral baseline

## Current Configuration

```javascript
WINDOW_SIZE: 5000ms (5 seconds)
TARGET_WINDOWS: 20
MIN_KEYSTROKES_PER_WINDOW: 5
MIN_MOUSE_EVENTS_PER_WINDOW: 10
TYPING_PROMPT: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs."
```

## Debug Information

If you're having issues, check the browser console (F12) for:
- "Behavior window finalized" messages (should appear every 5 seconds)
- "Window discarded - insufficient data" warnings
- Keystroke and mouse event counts

## Summary

**To complete behavior capture:**
1. Click "Start Behavior Capture"
2. Type naturally in the text area for ~100 seconds
3. Move your mouse around the interaction area
4. Click the buttons occasionally
5. Watch the progress bar reach 100%
6. Wait for "Capture Complete ✓" message

**Time Required**: ~2 minutes of active interaction

---

**Status**: Waiting for user interaction
**Next Step**: Start behavior capture and interact for ~100 seconds
