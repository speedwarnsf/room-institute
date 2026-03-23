/**
 * Watermark utility for Room Institute generated images.
 *
 * Applies:
 *   - Lower right: Room logo (light or dark, auto-detected from image background)
 *   - Lower left: "room.institute — AI visualization" white text on thin black box
 *   - 1/4" buffer (24px at 96dpi) on all sides
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const BUFFER_PX = 24; // 1/4 inch at 96 DPI
const LOGO_HEIGHT = 20; // Target logo height in pixels
const TEXT_SIZE = 10; // Font size for disclaimer
const DISCLAIMER = 'room.institute — AI visualization';

// Pre-load logo buffers (both variants)
let logoLightBuffer: Buffer | null = null;
let logoDarkBuffer: Buffer | null = null;

async function getLogoBuffer(variant: 'light' | 'dark'): Promise<Buffer> {
  if (variant === 'light' && logoLightBuffer) return logoLightBuffer;
  if (variant === 'dark' && logoDarkBuffer) return logoDarkBuffer;

  // Try loading from public dir (works in Vercel serverless with includeFiles)
  const filename = variant === 'light' ? 'room-logo.png' : 'room-logo-dark.png';
  
  // In Vercel, files are relative to the function
  const paths = [
    join(process.cwd(), 'public', filename),
    join(__dirname, '..', 'public', filename),
    join('/var/task', 'public', filename),
  ];

  for (const p of paths) {
    try {
      const buf = readFileSync(p);
      if (variant === 'light') logoLightBuffer = buf;
      else logoDarkBuffer = buf;
      return buf;
    } catch { /* try next */ }
  }

  throw new Error(`Logo file not found: ${filename}`);
}

/**
 * Detect whether the lower portion of the image is predominantly dark or light.
 * Returns 'light' for a light logo on dark backgrounds, 'dark' for dark logo on light backgrounds.
 */
async function detectLogoVariant(imageBuffer: Buffer): Promise<'light' | 'dark'> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const w = meta.width || 800;
    const h = meta.height || 600;

    // Sample the bottom-right quadrant (where the logo goes)
    const sampleRegion = {
      left: Math.floor(w * 0.6),
      top: Math.floor(h * 0.8),
      width: Math.floor(w * 0.4),
      height: Math.floor(h * 0.2),
    };

    const { data, info } = await sharp(imageBuffer)
      .extract(sampleRegion)
      .resize(20, 20, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Average luminance
    let totalLum = 0;
    const pixels = info.width * info.height;
    const channels = info.channels;
    for (let i = 0; i < pixels; i++) {
      const r = data[i * channels];
      const g = data[i * channels + 1];
      const b = data[i * channels + 2];
      totalLum += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    const avgLum = totalLum / pixels;

    // If dark background, use light logo; if light background, use dark logo
    return avgLum < 128 ? 'light' : 'dark';
  } catch {
    return 'light'; // Default to light logo (most designs are dark-ish)
  }
}

/**
 * Apply watermark to an image buffer.
 * Returns a new buffer with the watermark applied.
 */
export async function applyWatermark(imageBuffer: Buffer, mimeType?: string): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || 800;
  const h = meta.height || 600;

  // Determine logo variant based on image background
  const variant = await detectLogoVariant(imageBuffer);
  const logoBuf = await getLogoBuffer(variant);

  // Resize logo to target height, maintaining aspect ratio
  const logoResized = await sharp(logoBuf)
    .resize({ height: LOGO_HEIGHT, fit: 'inside' })
    .toBuffer();
  const logoMeta = await sharp(logoResized).metadata();
  const logoW = logoMeta.width || 74;
  const logoH = logoMeta.height || LOGO_HEIGHT;

  // Create disclaimer text as SVG
  const disclaimerPadH = 6;
  const disclaimerPadW = 8;
  // Estimate text width (~5.5px per character at 10px font)
  const textWidth = Math.ceil(DISCLAIMER.length * 5.5);
  const boxWidth = textWidth + disclaimerPadW * 2;
  const boxHeight = TEXT_SIZE + disclaimerPadH * 2;

  const disclaimerSvg = Buffer.from(`
    <svg width="${boxWidth}" height="${boxHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${boxWidth}" height="${boxHeight}" fill="rgba(0,0,0,0.75)" />
      <text x="${disclaimerPadW}" y="${disclaimerPadH + TEXT_SIZE - 2}"
        font-family="Helvetica, Arial, sans-serif"
        font-size="${TEXT_SIZE}"
        fill="white"
        letter-spacing="0.5"
      >${DISCLAIMER}</text>
    </svg>
  `);

  // Composite: overlay logo (lower right) and disclaimer (lower left)
  const result = await sharp(imageBuffer)
    .composite([
      {
        input: logoResized,
        left: w - logoW - BUFFER_PX,
        top: h - logoH - BUFFER_PX,
      },
      {
        input: disclaimerSvg,
        left: BUFFER_PX,
        top: h - boxHeight - BUFFER_PX,
      },
    ])
    .toBuffer();

  return result;
}
