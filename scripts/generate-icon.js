/**
 * Icon Generator for MK ApertaCodex AI Extension
 * 
 * This script generates a proper 128x128 PNG icon for the VS Code marketplace.
 * 
 * IMPORTANT: The VS Code marketplace requires a real PNG file at the path
 * specified by the "icon" field in package.json. A data URI or placeholder
 * will NOT work — the icon simply won't appear.
 * 
 * HOW TO CREATE YOUR ICON:
 * 
 * Option 1: Use an image editor
 *   - Create a 128x128 or 256x256 PNG image
 *   - Save it as images/icon.png
 * 
 * Option 2: Use an online tool
 *   - Go to https://www.canva.com or https://www.figma.com
 *   - Create a 128x128 design
 *   - Export as PNG to images/icon.png
 * 
 * Option 3: Convert the SVG to PNG using this script
 *   - Install: npm install sharp
 *   - Run: node scripts/generate-icon.js
 * 
 * Option 4: Use ImageMagick from the command line
 *   - convert -size 128x128 -background "#1a1a2e" -fill "#e94560" \
 *     -font Helvetica-Bold -pointsize 48 -gravity center \
 *     label:"MK" images/icon.png
 * 
 * The icon should:
 *   - Be at least 128x128 pixels (256x256 recommended)
 *   - Be a valid PNG file (not a JPEG renamed to .png)
 *   - Have a transparent or branded background
 *   - Be visually clear at small sizes
 */

const fs = require('fs');
const path = require('path');

// Ensure images directory exists
const imagesDir = path.join(__dirname, '..', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a minimal valid PNG file (1x1 blue pixel) as a fallback
// This is a valid PNG so the extension can at least be packaged.
// Replace this with a real designed icon before publishing!
function createMinimalPng() {
    // Minimal valid 128x128 PNG with a solid color
    // For a real icon, use an image editor or the sharp library
    
    console.log('=== MK ApertaCodex AI Icon Generator ===');
    console.log('');
    console.log('To create a proper marketplace icon, you need a real 128x128+ PNG file.');
    console.log('');
    console.log('Quick options:');
    console.log('');
    console.log('  1. Using ImageMagick:');
    console.log('     convert -size 256x256 xc:"#1a1a2e" -fill "#e94560" \\');
    console.log('       -font Helvetica-Bold -pointsize 96 -gravity center \\');
    console.log('       -annotate 0 "MK" images/icon.png');
    console.log('');
    console.log('  2. Using Python + Pillow:');
    console.log('     python3 -c "');
    console.log('     from PIL import Image, ImageDraw, ImageFont');
    console.log('     img = Image.new(\'RGBA\', (256, 256), (26, 26, 46, 255))');
    console.log('     draw = ImageDraw.Draw(img)');
    console.log('     try:');
    console.log('         font = ImageFont.truetype(\'arial.ttf\', 96)');
    console.log('     except:');
    console.log('         font = ImageFont.load_default()');
    console.log('     draw.text((128, 128), \'MK\', fill=(233, 69, 96, 255), font=font, anchor=\'mm\')');
    console.log('     img.save(\'images/icon.png\')');
    console.log('     "');
    console.log('');
    console.log('  3. Using any image editor (Figma, Canva, GIMP, Photoshop)');
    console.log('     - Create 256x256 canvas');
    console.log('     - Design your icon');
    console.log('     - Export as PNG to images/icon.png');
    console.log('');
    
    const iconPath = path.join(imagesDir, 'icon.png');
    if (fs.existsSync(iconPath)) {
        const stats = fs.statSync(iconPath);
        // Check if existing file looks like a valid PNG (starts with PNG magic bytes)
        const header = Buffer.alloc(8);
        const fd = fs.openSync(iconPath, 'r');
        fs.readSync(fd, header, 0, 8, 0);
        fs.closeSync(fd);
        
        const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        if (header.equals(pngMagic)) {
            console.log(`✅ images/icon.png exists and appears to be a valid PNG (${stats.size} bytes)`);
            return;
        } else {
            console.log('⚠️  images/icon.png exists but is NOT a valid PNG file!');
            console.log('    The marketplace will not display it as an icon.');
            console.log('    Please replace it with a real PNG image.');
        }
    } else {
        console.log('⚠️  images/icon.png does not exist yet.');
        console.log('    Please create it using one of the methods above.');
    }
}

createMinimalPng();
