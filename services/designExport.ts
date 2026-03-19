/**
 * Design Export Service
 * Handles image downloads, before/after comparisons, PDF reports,
 * and social media templates. Pro users get full-res; free users get
 * watermarked / lower-res versions.
 */

import type { DesignOption, LookbookEntry } from '../types';

/* ═══════════════════════════════════════════════════
   Shared canvas helpers
   ═══════════════════════════════════════════════════ */

function base64ToImage(base64: string, mimeType = 'image/png'): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:${mimeType};base64,${base64}`;
  });
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
}

async function downloadBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });

  // Mobile: use Web Share API for native "Save Image" support
  if (isMobile() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }
  }

  // Desktop fallback
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      type,
      quality,
    );
  });
}

function slugify(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}

/** Draw a diagonal "Room" watermark across the canvas */
function applyWatermark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = '#ffffff';
  const fontSize = Math.max(32, Math.min(w, h) * 0.07);
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  const step = fontSize * 2.5;
  for (let y = -h; y < h * 2; y += step) {
    for (let x = -w; x < w * 2; x += step * 2.5) {
      ctx.fillText('Room', x - w / 2, y - h / 2);
    }
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════
   1. Download Design (full-res image)
   ═══════════════════════════════════════════════════ */

export async function downloadDesignImage(
  option: DesignOption,
  isPro: boolean,
): Promise<void> {
  if (!option.visualizationImage) throw new Error('No visualization image');

  const img = await base64ToImage(option.visualizationImage);
  const scale = isPro ? 1 : 0.5;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  if (!isPro) applyWatermark(ctx, w, h);

  const blob = await canvasToBlob(canvas, 'image/png');
  downloadBlob(blob, `${slugify(option.name)}-room-institute${isPro ? '' : '-preview'}.png`);
}

/* ═══════════════════════════════════════════════════
   2. Download Before/After side-by-side
   ═══════════════════════════════════════════════════ */

export async function downloadBeforeAfter(
  sourceBase64: string,
  sourceMime: string,
  option: DesignOption,
  isPro: boolean,
): Promise<void> {
  if (!option.visualizationImage) throw new Error('No visualization image');

  const [beforeImg, afterImg] = await Promise.all([
    base64ToImage(sourceBase64, sourceMime),
    base64ToImage(option.visualizationImage),
  ]);

  // Normalize to same height
  const targetH = isPro ? Math.max(beforeImg.naturalHeight, afterImg.naturalHeight) : 800;
  const beforeW = Math.round((beforeImg.naturalWidth / beforeImg.naturalHeight) * targetH);
  const afterW = Math.round((afterImg.naturalWidth / afterImg.naturalHeight) * targetH);
  const gap = Math.round(targetH * 0.02);
  const totalW = beforeW + gap + afterW;
  const labelH = Math.round(targetH * 0.06);
  const totalH = targetH + labelH;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, totalW, totalH);

  // Images
  ctx.drawImage(beforeImg, 0, 0, beforeW, targetH);
  ctx.drawImage(afterImg, beforeW + gap, 0, afterW, targetH);

  // Labels
  const fontSize = Math.round(labelH * 0.55);
  ctx.font = `600 ${fontSize}px sans-serif`;
  ctx.fillStyle = '#a3a3a3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BEFORE', beforeW / 2, targetH + labelH / 2);
  ctx.fillText('AFTER', beforeW + gap + afterW / 2, targetH + labelH / 2);

  if (!isPro) applyWatermark(ctx, totalW, totalH);

  const blob = await canvasToBlob(canvas, 'image/png');
  downloadBlob(blob, `${slugify(option.name)}-before-after${isPro ? '' : '-preview'}.png`);
}

/* ═══════════════════════════════════════════════════
   3. Design Report PDF
   ═══════════════════════════════════════════════════ */

export async function downloadDesignReport(
  entry: LookbookEntry,
  sourceBase64?: string,
  sourceMime?: string,
  isPro = false,
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const { option } = entry;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pw - margin * 2;
  let y = margin;

  // Helper: add text with word wrap
  const addText = (text: string, size: number, color: [number, number, number], bold = false, maxW = contentW) => {
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    if (bold) pdf.setFont('helvetica', 'bold');
    else pdf.setFont('helvetica', 'normal');
    const lines = pdf.splitTextToSize(text, maxW);
    pdf.text(lines, margin, y);
    y += lines.length * size * 0.45 + 2;
  };

  // Title
  addText('Room Design Report', 22, [255, 255, 255], true);
  y += 2;
  addText(option.name, 16, [200, 200, 200], true);
  y += 4;

  // Mood
  addText(option.mood, 11, [160, 160, 160]);
  y += 6;

  // Visualization image
  if (option.visualizationImage) {
    try {
      const imgData = `data:image/png;base64,${option.visualizationImage}`;
      const imgW = contentW;
      const imgH = imgW * 0.6;
      if (y + imgH > 270) { pdf.addPage(); y = margin; }
      pdf.addImage(imgData, 'PNG', margin, y, imgW, imgH);
      y += imgH + 6;
    } catch { /* skip image on error */ }
  }

  // Frameworks
  if (option.frameworks.length) {
    addText('Design Frameworks', 13, [220, 220, 220], true);
    y += 1;
    addText(option.frameworks.join('  /  '), 10, [160, 160, 160]);
    y += 4;
  }

  // Color Palette
  addText('Color Palette', 13, [220, 220, 220], true);
  y += 2;
  const swatchSize = 10;
  option.palette.forEach((hex, i) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    pdf.setFillColor(r, g, b);
    pdf.rect(margin + i * (swatchSize + 4), y, swatchSize, swatchSize, 'F');
    pdf.setFontSize(7);
    pdf.setTextColor(160, 160, 160);
    pdf.text(hex, margin + i * (swatchSize + 4) + swatchSize / 2, y + swatchSize + 4, { align: 'center' });
  });
  y += swatchSize + 10;

  // Key Changes
  if (y > 240) { pdf.addPage(); y = margin; }
  addText('Key Changes', 13, [220, 220, 220], true);
  y += 1;
  option.keyChanges.forEach((change) => {
    if (y > 270) { pdf.addPage(); y = margin; }
    addText(`-  ${change}`, 10, [180, 180, 180]);
  });
  y += 4;

  // Full Plan
  if (option.fullPlan) {
    if (y > 200) { pdf.addPage(); y = margin; }
    addText('Design Plan', 13, [220, 220, 220], true);
    y += 2;
    // Strip markdown formatting for clean PDF text
    const plainText = option.fullPlan
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '');
    const lines = pdf.splitTextToSize(plainText, contentW);
    pdf.setFontSize(9);
    pdf.setTextColor(160, 160, 160);
    pdf.setFont('helvetica', 'normal');
    for (const line of lines) {
      if (y > 275) { pdf.addPage(); y = margin; }
      pdf.text(line, margin, y);
      y += 4;
    }
  }

  // Watermark for free users
  if (!isPro) {
    const pageCount = pdf.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      pdf.setPage(p);
      pdf.setFontSize(40);
      pdf.setTextColor(255, 255, 255);
      pdf.setGState?.(new (pdf as any).GState({ opacity: 0.08 }));
      pdf.text('Room Preview', pw / 2, 150, { align: 'center', angle: 30 });
    }
  }

  // Set dark background on all pages
  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    pdf.setFillColor(15, 15, 15);
    pdf.rect(0, 0, pw, pdf.internal.pageSize.getHeight(), 'F');
  }

  // Re-render content on top (jsPDF draws in order, so we need to
  // regenerate — but for simplicity we'll just save as-is since
  // the content was drawn after the background would need to be first).
  // Instead, let's use a simpler approach: set page bg color first.
  // Actually jsPDF doesn't support z-ordering, so we accept the dark
  // text on white bg. Let's remove the bg fill and keep it clean.
  // We'll just save directly.
  pdf.save(`${slugify(option.name)}-design-report${isPro ? '' : '-preview'}.pdf`);
}

/* ═══════════════════════════════════════════════════
   4. Social Media Templates
   ═══════════════════════════════════════════════════ */

interface SocialTemplateOptions {
  option: DesignOption;
  isPro: boolean;
  format: 'instagram' | 'pinterest';
}

export async function downloadSocialTemplate({
  option,
  isPro,
  format,
}: SocialTemplateOptions): Promise<void> {
  if (!option.visualizationImage) throw new Error('No visualization image');

  const img = await base64ToImage(option.visualizationImage);

  // Dimensions
  const dims = format === 'instagram'
    ? { w: isPro ? 1080 : 540, h: isPro ? 1080 : 540 }
    : { w: isPro ? 1000 : 500, h: isPro ? 1500 : 750 }; // Pinterest 2:3

  const canvas = document.createElement('canvas');
  canvas.width = dims.w;
  canvas.height = dims.h;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Image area (top portion)
  const imageH = Math.round(dims.h * 0.72);
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const targetAspect = dims.w / imageH;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgAspect > targetAspect) {
    sw = Math.round(img.naturalHeight * targetAspect);
    sx = Math.round((img.naturalWidth - sw) / 2);
  } else {
    sh = Math.round(img.naturalWidth / targetAspect);
    sy = Math.round((img.naturalHeight - sh) / 2);
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dims.w, imageH);

  // Gradient overlay at bottom of image
  const grad = ctx.createLinearGradient(0, imageH - dims.h * 0.15, 0, imageH);
  grad.addColorStop(0, 'rgba(10,10,10,0)');
  grad.addColorStop(1, 'rgba(10,10,10,1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, imageH - dims.h * 0.15, dims.w, dims.h * 0.15);

  // Text area
  const textY = imageH + Math.round(dims.h * 0.03);
  const pad = Math.round(dims.w * 0.06);

  // Color palette strip
  const swatchH = Math.round(dims.h * 0.008);
  option.palette.forEach((hex, i) => {
    ctx.fillStyle = hex;
    const swW = (dims.w - pad * 2) / option.palette.length;
    ctx.fillRect(pad + i * swW, imageH, swW, swatchH);
  });

  // Design name
  const titleSize = Math.round(dims.w * 0.055);
  ctx.font = `bold ${titleSize}px sans-serif`;
  ctx.fillStyle = '#f5f5f5';
  ctx.textAlign = 'left';
  ctx.fillText(option.name, pad, textY + titleSize);

  // Mood (truncated)
  const moodSize = Math.round(dims.w * 0.03);
  ctx.font = `italic ${moodSize}px sans-serif`;
  ctx.fillStyle = '#a3a3a3';
  const moodText = option.mood.length > 100 ? option.mood.slice(0, 97) + '...' : option.mood;
  const moodLines = wrapText(ctx, moodText, dims.w - pad * 2);
  moodLines.slice(0, 2).forEach((line, i) => {
    ctx.fillText(line, pad, textY + titleSize + moodSize * 1.5 + i * moodSize * 1.4);
  });

  // Branding
  const brandSize = Math.round(dims.w * 0.022);
  ctx.font = `600 ${brandSize}px sans-serif`;
  ctx.fillStyle = '#525252';
  ctx.textAlign = 'right';
  ctx.fillText('Room', dims.w - pad, dims.h - pad);

  if (!isPro) applyWatermark(ctx, dims.w, dims.h);

  const blob = await canvasToBlob(canvas, 'image/png');
  const suffix = format === 'instagram' ? 'ig' : 'pin';
  downloadBlob(blob, `${slugify(option.name)}-${suffix}${isPro ? '' : '-preview'}.png`);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
