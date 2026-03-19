import React, { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Loader2, Aperture, Camera } from 'lucide-react';

interface UploadZoneProps {
  /** Callback when an image file is selected */
  onImageSelected: (file: File) => void;
  /** Whether the image is currently being analyzed */
  isAnalyzing: boolean;
}

/** Accepted image MIME types */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.heic,.heif';

/**
 * Drag-and-drop image upload component with camera lens aesthetic
 */
export const UploadZone: React.FC<UploadZoneProps> = ({ onImageSelected, isAnalyzing }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorId = 'upload-error';
  const hintId = 'upload-hint';
  const describedBy = [error ? errorId : null, hintId].filter(Boolean).join(' ') || undefined;
  const hintText = isAnalyzing
    ? 'Analysis in progress. Upload is disabled.'
    : isDragOver
      ? 'Release to upload your room photo.'
      : 'Drag and drop a room photo, or press Enter to browse.';

  /**
   * Validate and process an uploaded file
   */
  const processFile = useCallback((file: File) => {
    setError(null);
    
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, WebP, or HEIC image.');
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image must be smaller than 10MB.');
      return;
    }
    
    // Read and preview the file
    const reader = new FileReader();
    reader.onerror = () => {
      setError('Failed to read the image file.');
    };
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Trigger the callback
    onImageSelected(file);
  }, [onImageSelected]);

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  /**
   * Handle drag leave event
   */
  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  /**
   * Clear the current image
   */
  const clearImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  /**
   * Trigger the file input dialog
   */
  const triggerFileSelect = useCallback(() => {
    if (!isAnalyzing) {
      fileInputRef.current?.click();
    }
  }, [isAnalyzing]);

  /**
   * Handle keyboard activation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerFileSelect();
    }
  }, [triggerFileSelect]);

  return (
    <div className="w-full flex flex-col items-center py-8 md:py-12">
      {/* Main Upload Circle */}
      <div
        onClick={triggerFileSelect}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={isAnalyzing ? -1 : 0}
        aria-label={isAnalyzing ? "Analyzing image" : "Upload a room photo. Click or drag and drop."}
        aria-busy={isAnalyzing}
        aria-describedby={describedBy}
        aria-disabled={isAnalyzing}
        className={`
          lens-circle
          relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96
          rounded-full overflow-hidden
          bg-zinc-900
          shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)]
          flex items-center justify-center
          ${isAnalyzing ? 'cursor-wait' : 'cursor-pointer'}
          group
          transition-all duration-500 ease-out
          ${isDragOver ? 'scale-105 ring-4 ring-emerald-500/50' : 'hover:scale-[1.02]'}
          select-none
          focus:outline-none focus:ring-4 focus:ring-emerald-500/50
        `}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={ACCEPTED_EXTENSIONS}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Outer Barrel Ribs (Grip) */}
        <div 
          className="absolute inset-0 border-[12px] sm:border-[16px] border-zinc-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.05)]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              #27272a 2px,
              #27272a 4px
            )`
          }}
          aria-hidden="true"
        />

        {/* Inner Metal Ring (Specs) */}
        <div 
          className="absolute inset-[12px] sm:inset-[16px] bg-zinc-900 border border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
          aria-hidden="true"
        >
          {/* Rotating Text Ring */}
          <div className="absolute inset-0 animate-[spin_60s_linear_infinite]">
            <svg className="w-full h-full" viewBox="0 0 200 200" aria-hidden="true">
              <path 
                id="textPath" 
                d="M 100, 100 m -75, 0 a 75,75 0 1,1 150,0 a 75,75 0 1,1 -150,0" 
                fill="transparent" 
              />
              <text className="text-[5px] font-bold fill-zinc-400 uppercase tracking-[0.3em]">
                <textPath href="#textPath" startOffset="0%">ZenSpace Planar</textPath>
                <textPath href="#textPath" startOffset="50%">T* 1:2.8 f=80mm</textPath>
              </text>
            </svg>
          </div>
          
          {/* Red T* Mark */}
          <div 
            className="absolute bottom-6 sm:bottom-8 right-12 sm:right-14 text-red-600 font-serif font-bold text-xs transform rotate-45 z-20"
            aria-hidden="true"
          >
            T*
          </div>
        </div>

        {/* Front Element Housing (Deep Black) */}
        <div 
          className="absolute inset-[36px] sm:inset-[45px] bg-black shadow-[inset_0_10px_30px_rgba(0,0,0,1)] overflow-hidden border-2 sm:border-4 border-zinc-800"
          aria-hidden="true"
        >
          {/* Lens Flare / Coating Simulation */}
          <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-purple-500/10 via-transparent to-emerald-500/10 mix-blend-screen" />
          <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          
          {/* Aperture Blades (Background) */}
          {!preview && !isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110">
              <Aperture className="w-full h-full text-zinc-700" strokeWidth={0.5} />
            </div>
          )}

          {/* Content State: Analyzing */}
          {isAnalyzing && (
            <div className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center backdrop-blur-[2px]">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-emerald-500/20" />
                <div className="absolute inset-0 animate-[spin_3s_linear_infinite] border-t-2 border-emerald-500" />
                <Loader2 className="w-10 h-10 text-emerald-500 relative z-10 animate-spin" />
              </div>
              <p className="mt-4 text-emerald-500 font-mono text-[10px] tracking-widest uppercase">
                Focusing...
              </p>
            </div>
          )}

          {/* Content State: Preview */}
          {preview && !isAnalyzing && (
            <>
              <img 
                src={preview} 
                alt="Preview of uploaded room" 
                className="relative w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300 z-10" 
              />
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={clearImage}
                  className="bg-red-600/90 text-white p-3 transform hover:scale-110 transition-transform hover:bg-red-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black/40"
                  aria-label="Remove uploaded image"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </>
          )}
          
          {/* Content State: Empty/Prompt */}
          {!preview && !isAnalyzing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
              <Upload className="w-8 h-8 sm:w-10 sm:h-10 mb-3 opacity-80" />
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                Drop Photo
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p 
          id={errorId} 
          className="mt-4 text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-4 py-2"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Screen reader hint */}
      <p id={hintId} className="sr-only" aria-live="polite">
        {hintText}
      </p>

      {/* Help Text - visible on mobile */}
      {!preview && !isAnalyzing && (
        <p className="mt-6 text-sm text-stone-400 dark:text-stone-500 flex items-center gap-2 md:hidden">
          <Camera className="w-4 h-4" aria-hidden="true" />
          <span>Tap to take or upload a photo</span>
        </p>
      )}
    </div>
  );
};
