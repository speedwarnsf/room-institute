/**
 * Color Palette Extractor — analyze a base64 image and extract dominant colors
 * Uses canvas-based k-means clustering (no dependencies)
 */

export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  percentage: number;
  name: string;
}

/**
 * Extract dominant colors from a base64-encoded image
 */
export async function extractColors(base64Image: string, count = 6): Promise<ExtractedColor[]> {
  const pixels = await getPixels(base64Image);
  if (pixels.length === 0) return [];

  // Simple k-means clustering
  const clusters = kMeans(pixels, count, 10);

  // Sort by frequency (highest first)
  const total = clusters.reduce((sum, c) => sum + c.count, 0);
  const colors = clusters
    .sort((a, b) => b.count - a.count)
    .map(c => ({
      hex: rgbToHex(c.center),
      rgb: c.center as [number, number, number],
      percentage: Math.round((c.count / total) * 100),
      name: getColorName(c.center),
    }));

  return colors;
}

function getPixels(base64Image: string): Promise<number[][]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Sample at low resolution for performance
      const maxDim = 100;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.floor(img.width * scale));
      canvas.height = Math.max(1, Math.floor(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve([]); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const pixels: number[][] = [];
      for (let i = 0; i < data.length; i += 4) {
        pixels.push([data[i]!, data[i + 1]!, data[i + 2]!]);
      }
      resolve(pixels);
    };
    img.onerror = () => resolve([]);
    const prefix = base64Image.startsWith('data:') ? '' : 'data:image/png;base64,';
    img.src = prefix + base64Image;
  });
}

interface Cluster {
  center: number[];
  count: number;
}

function kMeans(pixels: number[][], k: number, iterations: number): Cluster[] {
  // Initialize centers with k-means++ style
  const centers: number[][] = [];
  centers.push(pixels[Math.floor(Math.random() * pixels.length)]!.slice());
  for (let i = 1; i < k; i++) {
    const dists = pixels.map(p => {
      const minD = Math.min(...centers.map(c => colorDist(p, c)));
      return minD;
    });
    const totalDist = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    let idx = 0;
    for (let j = 0; j < dists.length; j++) {
      r -= dists[j]!;
      if (r <= 0) { idx = j; break; }
    }
    centers.push(pixels[idx]!.slice());
  }

  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    // Assign
    for (let i = 0; i < pixels.length; i++) {
      let minD = Infinity;
      let minIdx = 0;
      for (let j = 0; j < centers.length; j++) {
        const d = colorDist(pixels[i]!, centers[j]!);
        if (d < minD) { minD = d; minIdx = j; }
      }
      assignments[i] = minIdx;
    }

    // Update centers
    const sums = centers.map(() => [0, 0, 0]);
    const counts = new Array(k).fill(0);
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i]!;
      const s = sums[c]!;
      const p = pixels[i]!;
      s[0] = (s[0] ?? 0) + (p[0] ?? 0);
      s[1] = (s[1] ?? 0) + (p[1] ?? 0);
      s[2] = (s[2] ?? 0) + (p[2] ?? 0);
      counts[c]!++;
    }
    for (let j = 0; j < k; j++) {
      if (counts[j]! > 0) {
        centers[j] = [
          Math.round(sums[j]![0]! / counts[j]!),
          Math.round(sums[j]![1]! / counts[j]!),
          Math.round(sums[j]![2]! / counts[j]!),
        ];
      }
    }
  }

  // Build result
  const counts = new Array(k).fill(0);
  for (const a of assignments) counts[a]++;
  return centers.map((center, i) => ({ center, count: counts[i] }));
}

function colorDist(a: number[], b: number[]): number {
  return (a[0]! - b[0]!) ** 2 + (a[1]! - b[1]!) ** 2 + (a[2]! - b[2]!) ** 2;
}

function rgbToHex(rgb: number[]): string {
  return '#' + rgb.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

function getColorName(rgb: number[]): string {
  const [r, g, b] = rgb;
  const max = Math.max(r!, g!, b!);
  const min = Math.min(r!, g!, b!);
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (lightness > 127.5 ? (510 - max - min) : (max + min));

  if (saturation < 0.1) {
    if (lightness < 30) return 'Black';
    if (lightness < 80) return 'Charcoal';
    if (lightness < 140) return 'Gray';
    if (lightness < 200) return 'Silver';
    if (lightness < 240) return 'Off-White';
    return 'White';
  }

  const hue = (() => {
    if (max === min) return 0;
    let h = 0;
    if (max === r!) h = ((g! - b!) / (max - min)) % 6;
    else if (max === g!) h = (b! - r!) / (max - min) + 2;
    else h = (r! - g!) / (max - min) + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
  })();

  if (lightness < 40) {
    if (hue < 30 || hue > 330) return 'Maroon';
    if (hue < 70) return 'Dark Olive';
    if (hue < 160) return 'Dark Green';
    if (hue < 260) return 'Navy';
    return 'Dark Purple';
  }

  if (hue < 15) return lightness > 180 ? 'Salmon' : 'Red';
  if (hue < 40) return lightness > 180 ? 'Peach' : 'Rust';
  if (hue < 55) return lightness > 180 ? 'Cream' : 'Amber';
  if (hue < 70) return lightness > 180 ? 'Pale Yellow' : 'Gold';
  if (hue < 90) return lightness > 180 ? 'Lime' : 'Olive';
  if (hue < 160) return lightness > 180 ? 'Mint' : 'Green';
  if (hue < 200) return lightness > 180 ? 'Sky Blue' : 'Teal';
  if (hue < 250) return lightness > 180 ? 'Powder Blue' : 'Blue';
  if (hue < 290) return lightness > 180 ? 'Lavender' : 'Purple';
  if (hue < 330) return lightness > 180 ? 'Rose' : 'Magenta';
  return lightness > 180 ? 'Salmon' : 'Red';
}
