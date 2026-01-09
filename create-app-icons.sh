#!/bin/bash

# CBV System - App Icon Generator
# Creates PWA icons in various sizes

echo "======================================================================"
echo "CBV SYSTEM - APP ICON GENERATOR"
echo "======================================================================"

# Create icons directory
mkdir -p app/public/icons
mkdir -p app/public/screenshots

echo "📁 Created icons and screenshots directories"

# Create a simple SVG icon for CBV System
cat > app/public/icons/icon.svg << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="512" height="512" fill="#0f3460" rx="80"/>
  
  <!-- Shield outline -->
  <path d="M 256 80 L 400 140 L 400 280 Q 400 380 256 440 Q 112 380 112 280 L 112 140 Z" 
        fill="none" stroke="#16213e" stroke-width="20"/>
  
  <!-- Shield fill -->
  <path d="M 256 100 L 380 150 L 380 270 Q 380 360 256 410 Q 132 360 132 270 L 132 150 Z" 
        fill="#1a1a2e"/>
  
  <!-- Face icon -->
  <circle cx="256" cy="220" r="40" fill="#00d9ff" opacity="0.8"/>
  <ellipse cx="236" cy="210" rx="8" ry="12" fill="#0f3460"/>
  <ellipse cx="276" cy="210" rx="8" ry="12" fill="#0f3460"/>
  <path d="M 236 235 Q 256 245 276 235" fill="none" stroke="#0f3460" stroke-width="4" stroke-linecap="round"/>
  
  <!-- Fingerprint lines -->
  <g stroke="#00d9ff" stroke-width="3" fill="none" opacity="0.6">
    <path d="M 200 300 Q 220 290 240 300"/>
    <path d="M 272 300 Q 292 290 312 300"/>
    <path d="M 210 320 Q 230 310 250 320"/>
    <path d="M 262 320 Q 282 310 302 320"/>
    <path d="M 220 340 Q 240 330 260 340"/>
    <path d="M 252 340 Q 272 330 292 340"/>
  </g>
  
  <!-- CBV Text -->
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
        fill="#00d9ff" text-anchor="middle">CBV</text>
</svg>
EOF

echo "✅ Created SVG icon"

# Check if ImageMagick or similar tool is available
if command -v convert &> /dev/null; then
    echo "📸 ImageMagick found - generating PNG icons..."
    
    # Generate PNG icons in various sizes
    sizes=(72 96 128 144 152 192 384 512)
    
    for size in "${sizes[@]}"; do
        convert app/public/icons/icon.svg -resize ${size}x${size} app/public/icons/icon-${size}x${size}.png
        echo "  ✓ Generated ${size}x${size} icon"
    done
    
    echo "✅ All PNG icons generated"
else
    echo "⚠️  ImageMagick not found - creating placeholder PNGs"
    echo "   Install ImageMagick to generate proper icons:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo ""
    echo "   For now, using SVG icon (browsers will convert automatically)"
    
    # Create symbolic links to SVG for all sizes
    sizes=(72 96 128 144 152 192 384 512)
    for size in "${sizes[@]}"; do
        cp app/public/icons/icon.svg app/public/icons/icon-${size}x${size}.png
        echo "  ✓ Created placeholder for ${size}x${size}"
    done
fi

# Create favicon
if command -v convert &> /dev/null; then
    convert app/public/icons/icon.svg -resize 32x32 app/public/favicon.ico
    echo "✅ Generated favicon.ico"
else
    cp app/public/icons/icon.svg app/public/favicon.ico
    echo "✅ Created favicon placeholder"
fi

# Create apple-touch-icon
if command -v convert &> /dev/null; then
    convert app/public/icons/icon.svg -resize 180x180 app/public/apple-touch-icon.png
    echo "✅ Generated apple-touch-icon.png"
else
    cp app/public/icons/icon.svg app/public/apple-touch-icon.png
    echo "✅ Created apple-touch-icon placeholder"
fi

echo ""
echo "======================================================================"
echo "✅ APP ICONS CREATED SUCCESSFULLY"
echo "======================================================================"
echo ""
echo "📁 Generated files:"
echo "   • app/public/icons/icon.svg (source)"
echo "   • app/public/icons/icon-*.png (8 sizes)"
echo "   • app/public/favicon.ico"
echo "   • app/public/apple-touch-icon.png"
echo ""
echo "📝 Next steps:"
echo "   1. Update index.html to include manifest"
echo "   2. Rebuild the app: cd app && npm run build"
echo "   3. Deploy and test PWA installation"
echo ""
echo "💡 To install as desktop app:"
echo "   • Chrome: Click install icon in address bar"
echo "   • Safari: Share → Add to Home Screen"
echo "   • Edge: Settings → Apps → Install this site as an app"
echo ""
echo "======================================================================"
