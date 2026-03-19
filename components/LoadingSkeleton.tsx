import React from 'react';

interface SkeletonProps {
  /** CSS class names to apply */
  className?: string;
  /** Whether the skeleton should animate */
  animate?: boolean;
}

/**
 * Base skeleton component for loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  animate = true 
}) => {
  return (
    <div 
      className={`bg-stone-200 ${animate ? 'animate-pulse' : ''} ${className}`}
      aria-hidden="true"
    />
  );
};

/**
 * Loading skeleton for the analysis display
 */
export const AnalysisSkeleton: React.FC = () => {
  return (
    <div 
      className="space-y-8"
      role="status"
      aria-label="Loading analysis results"
    >
      {/* Analysis Card Skeleton */}
      <div className="bg-white shadow-sm border border-stone-100 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6 border-b border-stone-100 pb-4">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-48 h-8" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-full h-4" />
          <Skeleton className="w-5/6 h-4" />
          <Skeleton className="w-4/6 h-4" />
          
          <div className="pt-4">
            <Skeleton className="w-40 h-6 mb-3" />
            <div className="space-y-2 pl-4">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-5/6 h-4" />
              <Skeleton className="w-4/6 h-4" />
            </div>
          </div>
          
          <div className="pt-4">
            <Skeleton className="w-36 h-6 mb-3" />
            <div className="space-y-2 pl-4">
              <Skeleton className="w-full h-4" />
              <Skeleton className="w-3/4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Card Skeleton */}
      <div className="bg-zinc-900 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <Skeleton className="w-6 h-6 bg-zinc-700" />
          <div>
            <Skeleton className="w-48 h-5 bg-zinc-700 mb-1" />
            <Skeleton className="w-64 h-3 bg-zinc-800" />
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="w-full h-48 bg-zinc-800" />
        </div>
      </div>

      {/* Products Skeleton */}
      <div className="bg-white shadow-sm border border-stone-100 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="w-32 h-8" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="p-5 border border-stone-200 bg-stone-50/50"
            >
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="w-24 h-5" />
                <Skeleton className="w-4 h-4" />
              </div>
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-3/4 h-4 mb-4" />
              <Skeleton className="w-28 h-4 mt-3" />
            </div>
          ))}
        </div>
      </div>
      
      <span className="sr-only">Loading analysis, please wait...</span>
    </div>
  );
};

/**
 * Loading skeleton for the chat interface
 */
export const ChatSkeleton: React.FC = () => {
  return (
    <div 
      className="flex flex-col h-[600px] bg-white shadow-sm border border-stone-100 overflow-hidden"
      role="status"
      aria-label="Loading chat interface"
    >
      {/* Header */}
      <div className="p-4 border-b border-stone-100 bg-emerald-50/50 flex items-center gap-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="w-40 h-5" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 space-y-4">
        <div className="flex justify-center">
          <Skeleton className="w-64 h-4" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="w-48 h-3" />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-stone-100">
        <Skeleton className="w-full h-12" />
      </div>
      
      <span className="sr-only">Loading chat, please wait...</span>
    </div>
  );
};
