/**
 * Generate simple SVG-based icons for the AegisNet Chrome Extension.
 * Run with: node generate-icons.mjs
 * Requires: npm install sharp (or just use the inline base64 fallback below)
 *
 * If you don't want to run this, the extension uses emoji fallback (🛡️)
 * which Chrome applies to the action button automatically.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { createCanvas } from 'canvas'; // npm install canvas

const sizes = [16, 32, 48, 128];

function drawIcon(size, inactive = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const s = size;
  const pad = s * 0.08;

  // Background rounded rect
  ctx.beginPath();
  const r = s * 0.18;
  ctx.roundRect(pad, pad, s - pad * 2, s - pad * 2, r);
  
  if (inactive) {
    ctx.fillStyle = '#374151';
  } else {
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
  }
  ctx.fill();

  // Shield shape
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = `bold ${s * 0.55}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛡', s / 2, s / 2 + s * 0.02);

  return canvas.toBuffer('image/png');
}

try {
  const { createCanvas } = await import('canvas');
  mkdirSync('./icons', { recursive: true });
  for (const size of sizes) {
    writeFileSync(`./icons/icon${size}.png`, drawIcon(size, false));
    writeFileSync(`./icons/icon${size}-inactive.png`, drawIcon(size, true));
    console.log(`Generated icon${size}.png`);
  }
  console.log('✅ Icons generated in extension/icons/');
} catch (err) {
  console.log('⚠️  canvas not installed — using placeholder icons.');
  console.log('Run: npm install canvas && node generate-icons.mjs');
  console.log('Or provide your own PNG files in extension/icons/');
  
  // Fallback: create minimal 1px placeholder PNGs
  // (Chrome will use emoji if icon files are missing — still works)
  mkdirSync('./icons', { recursive: true });
  const placeholder = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  for (const size of sizes) {
    writeFileSync(`./icons/icon${size}.png`, placeholder);
    writeFileSync(`./icons/icon${size}-inactive.png`, placeholder);
  }
  console.log('Created placeholder icons. Install canvas for proper icons.');
}
