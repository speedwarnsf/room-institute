/**
 * Watermark utility — uses @vercel/og's Satori or falls back to
 * a lightweight PNG composite approach using only sharp.
 * 
 * Sharp IS supported on Vercel — it's included in the Node.js runtime.
 * The issue was dynamic import pathing. This version uses static import.
 */

// Static import — no dynamic import() issues
import sharp from 'sharp';

const BUFFER_PX = 24;
const LOGO_HEIGHT = 20;
const DISCLAIMER = 'room.institute \u2014 AI visualization';
const TEXT_SIZE = 10;

// Room logo SVGs (vector, no binary dependency)
// Light variant (white text for dark backgrounds)
const LOGO_LIGHT_SVG = `<svg width="74" height="20" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="16" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="bold" fill="white" letter-spacing="1">room</text>
</svg>`;

// Dark variant (dark text for light backgrounds)  
const LOGO_DARK_SVG = `<svg width="74" height="20" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="16" font-family="Helvetica,Arial,sans-serif" font-size="18" font-weight="bold" fill="#1c1917" letter-spacing="1">room</text>
</svg>`;

async function detectBackground(imageBuffer: Buffer): Promise<'light' | 'dark'> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const w = meta.width || 800;
    const h = meta.height || 600;

    const { data, info } = await sharp(imageBuffer)
      .extract({
        left: Math.floor(w * 0.6),
        top: Math.floor(h * 0.8),
        width: Math.max(1, Math.floor(w * 0.4)),
        height: Math.max(1, Math.floor(h * 0.2)),
      })
      .resize(10, 10, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    let totalLum = 0;
    const pixels = info.width * info.height;
    for (let i = 0; i < pixels; i++) {
      const o = i * info.channels;
      totalLum += 0.299 * (data[o] ?? 0) + 0.587 * (data[o + 1] ?? 0) + 0.114 * (data[o + 2] ?? 0);
    }

    return (totalLum / pixels) < 128 ? 'light' : 'dark';
  } catch {
    return 'light';
  }
}

export async function applyWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width || 800;
  const h = meta.height || 600;

  const variant = await detectBackground(imageBuffer);
  const logoSvg = Buffer.from(variant === 'light' ? LOGO_LIGHT_SVG : LOGO_DARK_SVG);

  // Disclaimer bar
  const textW = Math.ceil(DISCLAIMER.length * 5.8) + 16;
  const textH = TEXT_SIZE + 12;
  const disclaimerSvg = Buffer.from(
    `<svg width="${textW}" height="${textH}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="${textW}" height="${textH}" fill="rgba(0,0,0,0.75)"/>` +
    `<text x="8" y="${TEXT_SIZE + 4}" font-family="Helvetica,Arial,sans-serif" font-size="${TEXT_SIZE}" fill="white" letter-spacing="0.5">${DISCLAIMER}</text>` +
    `</svg>`
  );

  const logoW = 74;
  const logoH = LOGO_HEIGHT;

  return sharp(imageBuffer)
    .composite([
      { input: logoSvg, left: w - logoW - BUFFER_PX, top: h - logoH - BUFFER_PX },
      { input: disclaimerSvg, left: BUFFER_PX, top: h - textH - BUFFER_PX },
    ])
    .toBuffer();
}
