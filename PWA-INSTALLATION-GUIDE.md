# CBV System - Progressive Web App (PWA) Installation Guide

## Overview

The CBV System is now a **Progressive Web App (PWA)**, which means you can install it as a desktop or mobile application that works like a native app!

## ✨ Features

### Desktop App Features:
- 🖥️ **Standalone Window** - Runs in its own window (no browser UI)
- 🚀 **Quick Launch** - Click desktop icon to open instantly
- 📱 **App-like Experience** - Feels like a native application
- 💾 **Offline Support** - Works without internet (cached content)
- 🔔 **Notifications** - Receive system notifications (future feature)
- ⚡ **Fast Loading** - Cached resources load instantly

### Mobile App Features:
- 📲 **Home Screen Icon** - Add to home screen like any app
- 🎨 **Custom Splash Screen** - Branded loading screen
- 📱 **Full Screen Mode** - No browser chrome
- 💪 **Native Feel** - Smooth, app-like experience
- 🔄 **Background Sync** - Sync data when back online

---

## 📥 Installation Instructions

### Chrome / Edge (Desktop)

1. **Open the CBV System** in Chrome or Edge browser
   - Navigate to: `https://localhost:8080` (or your deployment URL)

2. **Look for the Install Icon**
   - You'll see an install icon (⊕ or 💾) in the address bar
   - Or click the three-dot menu → "Install CBV System..."

3. **Click Install**
   - A dialog will appear: "Install CBV System?"
   - Click "Install" button

4. **Launch the App**
   - The app will open in a standalone window
   - A desktop shortcut will be created automatically
   - Find it in your Applications folder or Start Menu

**Keyboard Shortcut:**
- Windows: `Ctrl + Shift + A` (in Chrome)
- Mac: `Cmd + Shift + A` (in Chrome)

---

### Safari (macOS)

1. **Open the CBV System** in Safari
   - Navigate to: `https://localhost:8080` (or your deployment URL)

2. **Add to Dock**
   - Click **Share** button (square with arrow)
   - Select **"Add to Dock"**
   - Customize the name if desired
   - Click **"Add"**

3. **Launch from Dock**
   - Click the CBV System icon in your Dock
   - App opens in standalone mode

---

### Safari (iOS - iPhone/iPad)

1. **Open the CBV System** in Safari
   - Navigate to your deployment URL

2. **Add to Home Screen**
   - Tap the **Share** button (square with arrow up)
   - Scroll down and tap **"Add to Home Screen"**
   - Edit the name if desired (default: "CBV System")
   - Tap **"Add"** in the top right

3. **Launch from Home Screen**
   - Tap the CBV System icon on your home screen
   - App opens in full-screen mode

---

### Chrome (Android)

1. **Open the CBV System** in Chrome
   - Navigate to your deployment URL

2. **Install Prompt**
   - Chrome will show a banner: "Add CBV System to Home screen"
   - Tap **"Add"** or **"Install"**
   
   **Or manually:**
   - Tap the three-dot menu (⋮)
   - Select **"Add to Home screen"** or **"Install app"**
   - Tap **"Add"** or **"Install"**

3. **Launch from Home Screen**
   - Tap the CBV System icon
   - App opens in full-screen mode

---

### Firefox (Desktop)

1. **Open the CBV System** in Firefox
   - Navigate to: `https://localhost:8080` (or your deployment URL)

2. **Install as PWA**
   - Click the three-line menu (☰)
   - Select **"Install CBV System"**
   - Or look for the install icon in the address bar

3. **Launch the App**
   - Find CBV System in your Applications or Start Menu
   - Click to launch

---

## 🎨 App Icon

The CBV System uses a custom icon featuring:
- 🛡️ **Shield** - Representing security
- 👤 **Face** - Face recognition
- 🔐 **Fingerprint** - Biometric authentication
- 🎨 **Blue Theme** - Professional security colors

**Icon Sizes Available:**
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

---

## 🔧 Technical Details

### Manifest Configuration

```json
{
  "name": "CBV System - Continuous Biometric Verification",
  "short_name": "CBV System",
  "display": "standalone",
  "theme_color": "#0f3460",
  "background_color": "#1a1a2e"
}
```

### Service Worker

- **Caching Strategy**: Cache-first with network fallback
- **Offline Support**: Essential files cached for offline use
- **Background Sync**: Syncs data when connection restored
- **Update Notifications**: Alerts when new version available

### App Shortcuts

Quick access shortcuts (right-click app icon):
1. **Protected App** - Direct access to verification
2. **Data Capture** - Start biometric capture
3. **Settings** - Access settings page

---

## ✅ Verification

### Check if Installed Correctly:

1. **Desktop Icon** - Look for CBV System icon
2. **Standalone Window** - No browser address bar
3. **Console Logs** - Check browser console:
   ```
   ✅ Service Worker registered successfully
   🚀 Running as installed PWA
   ```

### Test PWA Features:

1. **Offline Mode**
   - Disconnect from internet
   - App should still load (cached content)
   - Reconnect to sync data

2. **App Shortcuts**
   - Right-click app icon (desktop)
   - Verify shortcuts appear

3. **Notifications** (future)
   - Grant notification permissions
   - Test system notifications

---

## 🔄 Updating the App

### Automatic Updates:

The PWA automatically checks for updates when:
- App is launched
- User navigates to a new page
- Service worker detects changes

### Manual Update:

1. **Close the app completely**
2. **Reopen the app**
3. **Check console** for update messages:
   ```
   🔄 Service Worker update found
   ✨ New content available, please refresh
   ```
4. **Refresh** the page (Ctrl+R / Cmd+R)

---

## 🗑️ Uninstalling the App

### Chrome / Edge (Desktop):

1. **Method 1: From Browser**
   - Open Chrome/Edge
   - Go to `chrome://apps` or `edge://apps`
   - Right-click CBV System
   - Select "Remove from Chrome/Edge"

2. **Method 2: From App**
   - Open CBV System app
   - Click three-dot menu (⋮)
   - Select "Uninstall CBV System"

3. **Method 3: From OS**
   - Windows: Settings → Apps → CBV System → Uninstall
   - Mac: Applications → CBV System → Move to Trash

### Safari (macOS):

1. **Remove from Dock**
   - Right-click CBV System icon in Dock
   - Select "Options" → "Remove from Dock"

### iOS:

1. **Remove from Home Screen**
   - Long-press CBV System icon
   - Tap "Remove App"
   - Confirm "Delete App"

### Android:

1. **Uninstall**
   - Long-press CBV System icon
   - Drag to "Uninstall" or tap "App info" → "Uninstall"

---

## 🐛 Troubleshooting

### Issue: Install button not showing

**Solutions:**
1. Ensure you're using HTTPS (required for PWA)
2. Check if manifest.json is loading correctly
3. Verify service worker is registered
4. Try a different browser

### Issue: App not working offline

**Solutions:**
1. Check service worker registration in console
2. Verify files are cached (DevTools → Application → Cache Storage)
3. Clear cache and reinstall app

### Issue: Icon not displaying

**Solutions:**
1. Check if icon files exist in `/icons/` folder
2. Verify manifest.json icon paths are correct
3. Clear browser cache and reinstall

### Issue: Updates not applying

**Solutions:**
1. Completely close the app
2. Clear browser cache
3. Unregister service worker (DevTools → Application → Service Workers)
4. Reinstall the app

---

## 📊 Browser Support

| Browser | Desktop | Mobile | PWA Support |
|---------|---------|--------|-------------|
| Chrome | ✅ | ✅ | Full |
| Edge | ✅ | ✅ | Full |
| Safari | ✅ | ✅ | Partial |
| Firefox | ✅ | ✅ | Partial |
| Opera | ✅ | ✅ | Full |

**Note:** Safari has limited PWA support but still works as a web app.

---

## 🚀 Deployment Checklist

Before deploying as PWA:

- [x] ✅ Manifest.json created
- [x] ✅ Service worker implemented
- [x] ✅ App icons generated (8 sizes)
- [x] ✅ Favicon added
- [x] ✅ Apple touch icon added
- [x] ✅ Meta tags configured
- [x] ✅ HTTPS enabled (required)
- [x] ✅ Service worker registered
- [x] ✅ Offline support tested
- [x] ✅ Install prompt tested

---

## 📝 Next Steps

### For Users:
1. Install the app using instructions above
2. Grant camera permissions when prompted
3. Complete enrollment process
4. Use verification features

### For Developers:
1. Deploy to HTTPS server (required for PWA)
2. Test installation on multiple devices
3. Monitor service worker updates
4. Implement push notifications (optional)
5. Add background sync for offline data

---

## 🎯 Benefits of Installing

### Performance:
- ⚡ **Faster Loading** - Cached resources
- 💾 **Offline Access** - Works without internet
- 🚀 **Instant Launch** - No browser startup delay

### User Experience:
- 🖥️ **Native Feel** - Standalone window
- 📱 **Mobile Optimized** - Full-screen mode
- 🎨 **Branded** - Custom icon and splash screen

### Security:
- 🔒 **HTTPS Required** - Secure by default
- 🛡️ **Isolated** - Runs in own context
- 🔐 **Permissions** - Controlled access to features

---

## 📚 Additional Resources

- **PWA Documentation**: https://web.dev/progressive-web-apps/
- **Service Workers**: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- **Web App Manifest**: https://developer.mozilla.org/en-US/docs/Web/Manifest

---

## 🆘 Support

If you encounter issues:

1. **Check Console Logs** - Look for error messages
2. **Verify HTTPS** - PWA requires secure connection
3. **Clear Cache** - Try fresh installation
4. **Update Browser** - Use latest version
5. **Contact Support** - Report persistent issues

---

**Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** ✅ Production Ready

---

*The CBV System is now installable as a Progressive Web App on all major platforms!*
