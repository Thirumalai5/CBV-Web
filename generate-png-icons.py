#!/usr/bin/env python3
"""
CBV System - PNG Icon Generator
Converts SVG icon to PNG in multiple sizes using Python
"""

import os
import sys

try:
    from PIL import Image
    import cairosvg
except ImportError:
    print("❌ Required packages not installed")
    print("Installing required packages...")
    os.system(f"{sys.executable} -m pip install pillow cairosvg")
    from PIL import Image
    import cairosvg

def generate_png_icons():
    """Generate PNG icons from SVG"""
    
    svg_path = "app/public/icons/icon.svg"
    icons_dir = "app/public/icons"
    
    # Icon sizes to generate
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("=" * 70)
    print("CBV SYSTEM - PNG ICON GENERATOR")
    print("=" * 70)
    print()
    
    if not os.path.exists(svg_path):
        print(f"❌ SVG file not found: {svg_path}")
        return False
    
    print(f"📁 Source SVG: {svg_path}")
    print(f"📁 Output directory: {icons_dir}")
    print()
    
    success_count = 0
    
    for size in sizes:
        try:
            output_path = f"{icons_dir}/icon-{size}x{size}.png"
            
            # Convert SVG to PNG
            cairosvg.svg2png(
                url=svg_path,
                write_to=output_path,
                output_width=size,
                output_height=size
            )
            
            print(f"  ✓ Generated {size}x{size} icon")
            success_count += 1
            
        except Exception as e:
            print(f"  ❌ Failed to generate {size}x{size}: {e}")
    
    # Generate favicon
    try:
        favicon_path = "app/public/favicon.ico"
        cairosvg.svg2png(
            url=svg_path,
            write_to="app/public/favicon-temp.png",
            output_width=32,
            output_height=32
        )
        
        # Convert PNG to ICO
        img = Image.open("app/public/favicon-temp.png")
        img.save(favicon_path, format='ICO', sizes=[(32, 32)])
        os.remove("app/public/favicon-temp.png")
        
        print(f"  ✓ Generated favicon.ico")
        success_count += 1
        
    except Exception as e:
        print(f"  ❌ Failed to generate favicon: {e}")
    
    # Generate apple-touch-icon
    try:
        apple_icon_path = "app/public/apple-touch-icon.png"
        cairosvg.svg2png(
            url=svg_path,
            write_to=apple_icon_path,
            output_width=180,
            output_height=180
        )
        
        print(f"  ✓ Generated apple-touch-icon.png")
        success_count += 1
        
    except Exception as e:
        print(f"  ❌ Failed to generate apple-touch-icon: {e}")
    
    print()
    print("=" * 70)
    print(f"✅ ICON GENERATION COMPLETE")
    print("=" * 70)
    print()
    print(f"📊 Generated {success_count} icons successfully")
    print()
    print("📝 Next steps:")
    print("   1. Refresh your browser")
    print("   2. Check browser console for PWA install prompt")
    print("   3. Click install icon in address bar")
    print()
    print("=" * 70)
    
    return success_count > 0

if __name__ == "__main__":
    try:
        success = generate_png_icons()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
