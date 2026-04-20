/**
 * Icon Generator for MK ApertaCodex AI Extension
 *
 * Generates a valid 256x256 PNG icon using pure Node.js (no external dependencies).
 * This creates a real binary PNG file that the VS Code marketplace can display.
 *
 * Usage: node scripts/generate-icon.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure images directory exists
const imagesDir = path.join(__dirname, '..', 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const WIDTH = 256;
const HEIGHT = 256;

/**
 * Create a CRC32 lookup table
 */
function makeCrcTable() {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            if (c & 1) {
                c = 0xEDB88320 ^ (c >>> 1);
            } else {
                c = c >>> 1;
            }
        }
        table[n] = c;
    }
    return table;
}

const crcTable = makeCrcTable();

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Write a 4-byte big-endian unsigned integer
 */
function writeUInt32BE(value) {
    const buf = Buffer.alloc(4);
    buf.writeUInt32BE(value, 0);
    return buf;
}

/**
 * Create a PNG chunk
 */
function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcValue = writeUInt32BE(crc32(crcData));
    return Buffer.concat([length, typeBuffer, data, crcValue]);
}

/**
 * Calculate distance from center
 */
function distance(x, y, cx, cy) {
    return Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
}

/**
 * Render a character glyph using a simple bitmap font approach
 * Each character is defined on a 7x9 grid
 */
function getCharBitmap(ch) {
    const chars = {
        'M': [
            [1,0,0,0,0,0,1],
            [1,1,0,0,0,1,1],
            [1,0,1,0,1,0,1],
            [1,0,0,1,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1],
            [1,0,0,0,0,0,1]
        ],
        'K': [
            [1,0,0,0,0,1,0],
            [1,0,0,0,1,0,0],
            [1,0,0,1,0,0,0],
            [1,0,1,0,0,0,0],
            [1,1,0,0,0,0,0],
            [1,0,1,0,0,0,0],
            [1,0,0,1,0,0,0],
            [1,0,0,0,1,0,0],
            [1,0,0,0,0,1,0]
        ]
    };
    return chars[ch] || [];
}

/**
 * Draw a character onto the pixel buffer
 */
function drawChar(pixels, ch, startX, startY, scale, r, g, b) {
    const bitmap = getCharBitmap(ch);
    for (let row = 0; row < bitmap.length; row++) {
        for (let col = 0; col < bitmap[row].length; col++) {
            if (bitmap[row][col]) {
                // Draw a scaled block for each pixel
                for (let sy = 0; sy < scale; sy++) {
                    for (let sx = 0; sx < scale; sx++) {
                        const px = startX + col * scale + sx;
                        const py = startY + row * scale + sy;
                        if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
                            const idx = (py * WIDTH + px) * 3;
                            pixels[idx] = r;
                            pixels[idx + 1] = g;
                            pixels[idx + 2] = b;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Draw a filled rounded rectangle
 */
function drawRoundedRect(pixels, x1, y1, x2, y2, radius, r, g, b) {
    for (let y = y1; y <= y2; y++) {
        for (let x = x1; x <= x2; x++) {
            let inside = false;

            // Check if point is in the main rectangle (excluding corners)
            if (x >= x1 + radius && x <= x2 - radius) {
                inside = true;
            } else if (y >= y1 + radius && y <= y2 - radius) {
                inside = true;
            } else {
                // Check corners
                const corners = [
                    [x1 + radius, y1 + radius],
                    [x2 - radius, y1 + radius],
                    [x1 + radius, y2 - radius],
                    [x2 - radius, y2 - radius]
                ];
                for (const [cx, cy] of corners) {
                    if (distance(x, y, cx, cy) <= radius) {
                        inside = true;
                        break;
                    }
                }
            }

            if (inside && x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                const idx = (y * WIDTH + x) * 3;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
            }
        }
    }
}

/**
 * Draw a small 4-pointed star (sparkle)
 */
function drawSparkle(pixels, cx, cy, size, r, g, b) {
    for (let y = cy - size; y <= cy + size; y++) {
        for (let x = cx - size; x <= cx + size; x++) {
            if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) continue;
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            // Diamond/star shape: dx/size + dy/size <= 1
            if (dx + dy <= size) {
                const idx = (y * WIDTH + x) * 3;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
            }
        }
    }
}

/**
 * Generate the icon pixel data
 */
function generatePixels() {
    // RGB pixel data (no alpha for simplicity, use color type 2)
    const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

    // Background: dark blue-purple (#1a1a2e)
    const bgR = 26, bgG = 26, bgB = 46;
    for (let i = 0; i < WIDTH * HEIGHT; i++) {
        pixels[i * 3] = bgR;
        pixels[i * 3 + 1] = bgG;
        pixels[i * 3 + 2] = bgB;
    }

    // Draw a subtle rounded rectangle background (#16213e)
    drawRoundedRect(pixels, 16, 16, 239, 239, 32, 22, 33, 62);

    // Draw inner rounded rectangle (#0f3460)
    drawRoundedRect(pixels, 28, 28, 227, 227, 24, 15, 52, 96);

    // Draw "MK" text in bright coral/red (#e94560)
    const scale = 8;
    const charWidth = 7 * scale;
    const charHeight = 9 * scale;
    const totalWidth = charWidth * 2 + 12; // 2 chars + spacing
    const startX = Math.floor((WIDTH - totalWidth) / 2);
    const startY = Math.floor((HEIGHT - charHeight) / 2) - 10;

    drawChar(pixels, 'M', startX, startY, scale, 233, 69, 96);
    drawChar(pixels, 'K', startX + charWidth + 12, startY, scale, 233, 69, 96);

    // Draw AI sparkles
    drawSparkle(pixels, 195, 55, 10, 233, 69, 96);
    drawSparkle(pixels, 210, 75, 6, 200, 60, 80);
    drawSparkle(pixels, 55, 200, 8, 233, 69, 96);

    // Draw a subtle line under the text (#e94560 with slight offset)
    const lineY = startY + charHeight + 12;
    const lineStartX = startX + 10;
    const lineEndX = startX + totalWidth - 10;
    for (let y = lineY; y < lineY + 4; y++) {
        for (let x = lineStartX; x <= lineEndX; x++) {
            if (x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT) {
                const idx = (y * WIDTH + x) * 3;
                pixels[idx] = 233;
                pixels[idx + 1] = 69;
                pixels[idx + 2] = 96;
            }
        }
    }

    return pixels;
}

/**
 * Create a valid PNG file buffer from RGB pixel data
 */
function createPng(pixels) {
    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(WIDTH, 0);   // width
    ihdrData.writeUInt32BE(HEIGHT, 4);  // height
    ihdrData.writeUInt8(8, 8);          // bit depth
    ihdrData.writeUInt8(2, 9);          // color type (2 = RGB)
    ihdrData.writeUInt8(0, 10);         // compression
    ihdrData.writeUInt8(0, 11);         // filter
    ihdrData.writeUInt8(0, 12);         // interlace
    const ihdr = createChunk('IHDR', ihdrData);

    // IDAT chunk - raw pixel data with filter bytes
    // Each row needs a filter byte (0 = None) prepended
    const rawData = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
    for (let y = 0; y < HEIGHT; y++) {
        const rowOffset = y * (1 + WIDTH * 3);
        rawData[rowOffset] = 0; // filter type: None
        pixels.copy(rawData, rowOffset + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
    }

    const compressed = zlib.deflateSync(rawData, { level: 9 });
    const idat = createChunk('IDAT', compressed);

    // IEND chunk
    const iend = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdr, idat, iend]);
}

// Generate and write the icon
console.log('Generating MK ApertaCodex AI icon (256x256 PNG)...');
const pixels = generatePixels();
const pngBuffer = createPng(pixels);

const outputPath = path.join(imagesDir, 'icon.png');
fs.writeFileSync(outputPath, pngBuffer);

console.log(`\u2705 Icon generated: ${outputPath} (${pngBuffer.length} bytes)`);
console.log('');
console.log('Validating PNG...');

// Validate the output
const header = Buffer.alloc(8);
const fd = fs.openSync(outputPath, 'r');
fs.readSync(fd, header, 0, 8, 0);
fs.closeSync(fd);

const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
if (header.equals(pngMagic)) {
    console.log('\u2705 Valid PNG file confirmed!');
    console.log('');
    console.log('The icon is ready for the VS Code marketplace.');
    console.log('Run "npm run compile && vsce package" to build the extension.');
} else {
    console.error('\u274C ERROR: Generated file is not a valid PNG!');
    process.exit(1);
}
