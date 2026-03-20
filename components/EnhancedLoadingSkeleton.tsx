/**
 * Enhanced Loading States with Micro-interactions
 * Beautiful, accessible loading states for all app components
 */
import { ReactNode, useEffect, useState } from 'react';
import { Camera, Brain, Image, Sparkles } from 'lucide-react';

interface LoadingSkeletonProps {
  variant?: 'card' | 'text' | 'image' | 'button' | 'chat' | 'analysis';
  lines?: number;
  className?: string;
  animate?: boolean;
  showIcon?: boolean;
  message?: string;
  progress?: number;
  children?: ReactNode;
}

export function LoadingSkeleton({ 
  variant = 'card',
  lines = 3,
  className = '',
  animate = true,
  showIcon = false,
  message,
  progress,
  children
}: LoadingSkeletonProps) {
  const baseClasses = animate 
    ? 'bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 dark:from-stone-700 dark:via-stone-600 dark:to-stone-700 animate-pulse bg-[length:200%_100%]'
    : 'bg-stone-200 dark:bg-stone-700';

  const shimmerClasses = animate 
    ? 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent'
    : '';

  switch (variant) {
    case 'text':
      return (
        <div className={`space-y-3 ${className}`}>
          {Array.from({ length: lines }, (_, i) => (
            <div
              key={i}
              className={`h-4 ${baseClasses} ${shimmerClasses}`}
              style={{ 
                width: i === lines - 1 ? '75%' : '100%',
                animationDelay: `${i * 0.1}s` 
              }}
            />
          ))}
        </div>
      );

    case 'image':
      return (
        <div className={`${className}`}>
          <div className={`aspect-video ${baseClasses} ${shimmerClasses} flex items-center justify-center`}>
            {showIcon && <Image className="w-12 h-12 text-stone-400 dark:text-stone-500" />}
          </div>
          {message && (
            <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 text-center animate-pulse">
              {message}
            </p>
          )}
          {progress !== undefined && (
            <div className="mt-3">
              <div className="w-full bg-stone-200 dark:bg-stone-700 h-2">
                <div 
                  className="bg-emerald-500 h-2 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 text-center mt-1">
                {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      );

    case 'button':
      return (
        <div className={`${baseClasses} ${shimmerClasses} h-11 ${className}`} />
      );

    case 'chat':
      return (
        <div className={`space-y-4 ${className}`}>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className={`flex gap-3 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className={`max-w-xs ${i % 2 === 0 ? 'order-2' : 'order-1'}`}>
                <div className={`h-12 ${baseClasses} ${shimmerClasses}`} />
              </div>
              {i % 2 === 0 && (
                <div className={`w-8 h-8 ${baseClasses} ${shimmerClasses} order-1 flex-shrink-0`} />
              )}
            </div>
          ))}
        </div>
      );

    case 'analysis':
      return (
        <div className={`space-y-6 ${className}`}>
          <div className="space-y-3">
            <div className={`h-8 w-3/4 ${baseClasses} ${shimmerClasses}`} />
            <div className={`h-4 w-full ${baseClasses} ${shimmerClasses}`} />
            <div className={`h-4 w-5/6 ${baseClasses} ${shimmerClasses}`} />
          </div>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-3" style={{ animationDelay: `${i * 0.3}s` }}>
              <div className={`h-6 w-1/2 ${baseClasses} ${shimmerClasses}`} />
              <div className="space-y-2">
                <div className={`h-4 w-full ${baseClasses} ${shimmerClasses}`} />
                <div className={`h-4 w-4/5 ${baseClasses} ${shimmerClasses}`} />
              </div>
            </div>
          ))}
          <div className="flex gap-3 pt-4">
            <div className={`h-11 w-32 ${baseClasses} ${shimmerClasses}`} />
            <div className={`h-11 w-24 ${baseClasses} ${shimmerClasses}`} />
          </div>
        </div>
      );

    default:
      return (
        <div className={`${className}`}>
          <div className={`p-6 border border-stone-200 dark:border-stone-700 space-y-4`}>
            <div className={`h-6 w-1/3 ${baseClasses} ${shimmerClasses}`} />
            <div className="space-y-3">
              {Array.from({ length: lines }, (_, i) => (
                <div
                  key={i}
                  className={`h-4 ${baseClasses} ${shimmerClasses}`}
                  style={{ 
                    width: i === lines - 1 ? '60%' : '100%',
                    animationDelay: `${i * 0.1}s` 
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      );
  }
}

// Analysis loading with estimated time and stage details
interface AnalysisLoadingProps {
  stage: 'uploading' | 'processing' | 'analyzing' | 'generating' | 'visualizing';
  progress?: number;
  className?: string;
}

const STAGE_TIPS = [
  'Our AI examines spatial relationships, light quality, and existing design elements',
  'Each design direction is grounded in academic design theory frameworks',
  'Visualization uses reference-guided image generation for photorealistic results',
  'Color palettes are derived from proven design harmony principles',
];

export function AnalysisLoading({ stage, progress = 0, className = '' }: AnalysisLoadingProps) {
  const [dots, setDots] = useState('');
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Rotate tips every 6 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % STAGE_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Track elapsed time
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const stageConfig = {
    uploading: {
      icon: Camera,
      message: 'Uploading image',
      detail: 'Preparing your photo for analysis',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      gradientFrom: 'from-blue-400',
      gradientTo: 'to-blue-500',
      estimate: '~5 seconds',
    },
    processing: {
      icon: Image,
      message: 'Processing image',
      detail: 'Optimizing resolution and color data',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      gradientFrom: 'from-purple-400',
      gradientTo: 'to-purple-500',
      estimate: '~10 seconds',
    },
    analyzing: {
      icon: Brain,
      message: 'Analyzing your space',
      detail: 'Reading room through 5 design theory frameworks',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      gradientFrom: 'from-emerald-400',
      gradientTo: 'to-emerald-500',
      estimate: '~30 seconds',
    },
    generating: {
      icon: Sparkles,
      message: 'Generating design concepts',
      detail: 'Creating 3 unique design directions',
      color: 'text-emerald-400',
      bgColor: 'bg-amber-50 dark:bg-emerald-950/30',
      gradientFrom: 'from-emerald-300',
      gradientTo: 'to-emerald-400',
      estimate: '~45 seconds',
    },
    visualizing: {
      icon: Sparkles,
      message: 'Rendering your designs',
      detail: 'Generating photorealistic previews for each concept',
      color: 'text-emerald-400',
      bgColor: 'bg-amber-50 dark:bg-emerald-950/30',
      gradientFrom: 'from-emerald-300',
      gradientTo: 'to-emerald-400',
      estimate: '~60 seconds',
    },
  };

  const config = stageConfig[stage];
  const Icon = config.icon;

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  // Stage progression indicators
  const stages = ['uploading', 'processing', 'analyzing', 'visualizing'] as const;
  const stageLabels = ['Upload', 'Process', 'Analyze', 'Render'];
  const currentStageIndex = stages.indexOf(stage as any);

  return (
    <div className={`text-center space-y-6 ${className}`}>
      {/* Animated Icon */}
      <div className={`loading-circle mx-auto w-20 h-20 rounded-full ${config.bgColor} flex items-center justify-center relative`}>
        {Icon === Sparkles ? (
          <img src="/room-logo.png" alt="" className="w-10 h-10 animate-pulse opacity-80" />
        ) : (
          <Icon className={`w-10 h-10 ${config.color} animate-pulse`} />
        )}
        {/* Orbiting dot */}
        <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
          <div className={`loading-circle absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${config.bgColor} ${config.color}`}>
            <div className={`w-2 h-2 rounded-full ${config.color === 'text-emerald-500' ? 'bg-emerald-500' : config.color === 'text-emerald-400' ? 'bg-emerald-400' : config.color === 'text-blue-500' ? 'bg-blue-500' : 'bg-purple-500'}`} />
          </div>
        </div>
      </div>

      {/* Stage Message */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          {config.message}{dots}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {config.detail}
        </p>
      </div>

      {/* Stage progression */}
      <div className="flex items-center justify-center gap-1 max-w-xs mx-auto">
        {stageLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-1 flex-1">
            <div className={`h-1 flex-1 transition-all duration-500 ${
              i < currentStageIndex ? 'bg-emerald-500' :
              i === currentStageIndex ? `bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo}` :
              'bg-stone-200 dark:bg-stone-700'
            }`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between max-w-xs mx-auto">
        {stageLabels.map((label, i) => (
          <span key={label} className={`text-[10px] font-medium uppercase tracking-wide ${
            i <= currentStageIndex ? 'text-stone-600 dark:text-stone-300' : 'text-stone-300 dark:text-stone-600'
          }`}>{label}</span>
        ))}
      </div>

      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-full max-w-xs mx-auto">
          <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 transition-all duration-500 ease-out bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} relative`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {/* Shimmer on progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {Math.round(progress)}%
            </p>
            <p className="text-xs text-stone-400 dark:text-stone-500">
              {formatTime(elapsed)} elapsed
            </p>
          </div>
        </div>
      )}

      {/* Estimated time */}
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Estimated: {config.estimate}
      </p>

      {/* Slow response notice */}
      {elapsed > 120 && (
        <div className="max-w-sm mx-auto bg-amber-50 dark:bg-emerald-950/20 border border-amber-200 dark:border-emerald-700 px-4 py-3 animate-in fade-in duration-500">
          <p className="text-xs text-emerald-600 dark:text-emerald-200 font-medium mb-1">Taking longer than usual</p>
          <p className="text-xs text-emerald-500 dark:text-emerald-300 leading-relaxed">
            The AI is working through a complex analysis. This can happen with detailed rooms or high server load. Hang tight.
          </p>
        </div>
      )}

      {/* Rotating tips */}
      <div className="max-w-sm mx-auto min-h-[3rem]">
        <p className="text-xs text-stone-400 dark:text-stone-500 italic leading-relaxed transition-opacity duration-500">
          {STAGE_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
}

// Chat typing indicator
export function ChatTypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 p-4 ${className}`}>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="loading-circle w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-500 animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <span className="text-sm text-stone-500 dark:text-stone-400">
        AI is thinking...
      </span>
    </div>
  );
}

// Button loading state
interface LoadingButtonProps {
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export function LoadingButton({
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  onClick,
  type = 'button',
}: LoadingButtonProps) {
  const baseClasses = 'relative inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
    secondary: 'bg-stone-600 hover:bg-stone-700 text-white focus:ring-stone-500',
    ghost: 'bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 focus:ring-stone-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="loading-circle w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        </div>
      )}
      <span className={loading ? 'invisible' : 'visible'}>
        {children}
      </span>
    </button>
  );
}

// Image loading with fade-in
export function FadeInImage({ 
  src, 
  alt, 
  className = '', 
  onLoad,
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div className={`bg-stone-100 dark:bg-stone-800 flex items-center justify-center ${className}`}>
        <Image className="w-8 h-8 text-stone-400 dark:text-stone-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      {!loaded && (
        <div className={`absolute inset-0 bg-stone-200 dark:bg-stone-700 animate-pulse ${className}`} />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}

export const shimmerCSS = `
  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }
`;
