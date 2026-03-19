/**
 * Image compression utilities for ZenSpace
 * Compresses images before upload to reduce API payload and improve performance
 */

export interface CompressionOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1080) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.85) */
  quality?: number;
  /** Target file size in bytes (optional, will iteratively reduce quality) */
  targetSize?: number;
}

export interface CompressionResult {
  /** Compressed file */
  file: File;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed file size in bytes */
  compressedSize: number;
  /** Compression ratio (0-1, lower is better) */
  ratio: number;
  /** New dimensions */
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'targetSize'>> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
};

/**
 * Compress an image file for upload
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compression result
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip compression for already small files (< 100KB)
  if (file.size < 100 * 1024 && !options.maxWidth && !options.maxHeight) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      ratio: 1,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > opts.maxWidth) {
        height = (height * opts.maxWidth) / width;
        width = opts.maxWidth;
      }
      
      if (height > opts.maxHeight) {
        width = (width * opts.maxHeight) / height;
        height = opts.maxHeight;
      }

      // Round to integers
      width = Math.round(width);
      height = Math.round(height);

      canvas.width = width;
      canvas.height = height;

      // Draw image with high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const compressToBlob = (quality: number): Promise<Blob> => {
        return new Promise((res) => {
          canvas.toBlob(
            (blob) => res(blob!),
            'image/jpeg',
            quality
          );
        });
      };

      const compress = async () => {
        let quality = opts.quality;
        let blob = await compressToBlob(quality);

        // If target size specified, iteratively reduce quality
        if (options.targetSize) {
          while (blob.size > options.targetSize && quality > 0.3) {
            quality -= 0.1;
            blob = await compressToBlob(quality);
          }
        }

        const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        resolve({
          file: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          ratio: compressedFile.size / file.size,
          width,
          height,
        });
      };

      compress().catch(reject);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
