/**
 * ProductSkeleton â€” GamePay
 * Phase 4: Neon Gaming Shimmer Skeleton
 * Dark OLED base with animated neon shimmer sweep
 */

import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="
      flex flex-col h-full rounded-2xl overflow-hidden shadow-sm
      bg-white dark:bg-[#0c0c10]
      border border-gray-100 dark:border-white/5
      relative
    ">
      {/* Neon shimmer sweep overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 40%, rgba(155,93,229,0.06) 50%, transparent 60%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer-bg 1.8s ease-in-out infinite',
        }}
      />

      {/* Image placeholder â€” 1:1 */}
      <div className="w-full aspect-square bg-gray-200 dark:bg-[#141418] animate-pulse" />

      {/* Info region */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">

        {/* Game-name chip */}
        <div className="h-3 w-16 bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />

        {/* Title â€” 2 lines */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full  bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-3.5 w-4/5   bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-5 w-20 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
          <div className="h-3 w-12 bg-gray-100 dark:bg-white/3 rounded animate-pulse" />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-1.5 mt-1.5">
          <div className="h-11 w-full bg-gray-200 dark:bg-red-500/10 rounded-xl animate-pulse" />
          <div className="h-10 w-full bg-gray-100 dark:bg-white/4 rounded-xl animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes shimmer-bg {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

