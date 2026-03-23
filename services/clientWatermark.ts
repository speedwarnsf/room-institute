/**
 * Client-side watermark using Canvas API.
 * Mirrors Nudio's approach — works in any browser, no server dependencies.
 *
 * Applies:
 *   - Lower right: "room" text logo (white or dark, auto-detected)
 *   - Lower left: "room.institute — AI visualization" on black bar
 *   - 1/4" buffer (24px) on all sides
 */

const BUFFER_PX = 24;
const DISCLAIMER = 'room.institute \u2014 AI visualization';

/**
 * Detect if the bottom-right region of the image is dark or light.
 */
function detectBackground(ctx: CanvasRenderingContext2D, w: number, h: number): 'light' | 'dark' {
  const sampleW = Math.floor(w * 0.3);
  const sampleH = Math.floor(h * 0.15);
  const data = ctx.getImageData(w - sampleW, h - sampleH, sampleW, sampleH).data;
  let totalLum = 0;
  const pixels = sampleW * sampleH;
  for (let i = 0; i < data.length; i += 4) {
    totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return (totalLum / pixels) < 128 ? 'light' : 'dark';
}

/**
 * Apply watermark to a base64 image string. Returns watermarked base64 (JPEG).
 */
export function addWatermark(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0);

      const w = img.width;
      const h = img.height;

      // Detect background for logo color
      const variant = detectBackground(ctx, w, h);

      // --- Lower right: "room" logo ---
      const logoSize = Math.max(14, Math.floor(w * 0.018));
      ctx.font = `bold ${logoSize}px Helvetica, Arial, sans-serif`;
      ctx.letterSpacing = '1px';
      ctx.fillStyle = variant === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(28,25,23,0.85)';
      const logoText = 'room';
      const logoMetrics = ctx.measureText(logoText);
      ctx.fillText(logoText, w - logoMetrics.width - BUFFER_PX, h - BUFFER_PX);

      // --- Lower left: disclaimer on black bar ---
      const fontSize = Math.max(8, Math.floor(w * 0.009));
      ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
      const textMetrics = ctx.measureText(DISCLAIMER);
      const padX = 8;
      const padY = 5;
      const barW = textMetrics.width + padX * 2;
      const barH = fontSize + padY * 2;
      const barX = BUFFER_PX;
      const barY = h - barH - BUFFER_PX;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(barX, barY, barW, barH);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(DISCLAIMER, barX + padX, barY + padY + fontSize - 1);

      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };

    img.onerror = () => reject(new Error('Image load failed'));

    // Handle both data URLs and plain base64
    if (imageBase64.startsWith('data:')) {
      img.src = imageBase64;
    } else {
      img.src = `data:image/png;base64,${imageBase64}`;
    }
  });
}

/**
 * Apply watermark to an image URL (fetches, watermarks, returns base64).
 */
export async function watermarkFromUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }

      ctx.drawImage(img, 0, 0);

      const w = img.width;
      const h = img.height;
      const variant = detectBackground(ctx, w, h);

      // Logo
      const logoSize = Math.max(14, Math.floor(w * 0.018));
      ctx.font = `bold ${logoSize}px Helvetica, Arial, sans-serif`;
      ctx.fillStyle = variant === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(28,25,23,0.85)';
      const logoMetrics = ctx.measureText('room');
      ctx.fillText('room', w - logoMetrics.width - BUFFER_PX, h - BUFFER_PX);

      // Disclaimer
      const fontSize = Math.max(8, Math.floor(w * 0.009));
      ctx.font = `${fontSize}px Helvetica, Arial, sans-serif`;
      const textMetrics = ctx.measureText(DISCLAIMER);
      const padX = 8, padY = 5;
      const barX = BUFFER_PX;
      const barY = h - (fontSize + padY * 2) - BUFFER_PX;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(barX, barY, textMetrics.width + padX * 2, fontSize + padY * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(DISCLAIMER, barX + padX, barY + padY + fontSize - 1);

      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };

    img.onerror = () => reject(new Error(`Failed to load: ${imageUrl}`));
    img.src = imageUrl;
  });
}
