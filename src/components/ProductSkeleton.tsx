/**
 * ProductSkeleton — GamePay
 *
 * Updated to mirror the new ProductCard layout:
 * • 1:1 aspect-ratio image placeholder
 * • Game-name chip placeholder
 * • Title (2 lines)
 * • Price row
 * • Two CTA button placeholders
 */

import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700/60 rounded-2xl overflow-hidden shadow-sm animate-pulse">

      {/* Image placeholder — 1:1 */}
      <div className="w-full aspect-square bg-gray-200 dark:bg-[#0f1115]" />

      {/* Info region */}
      <div className="flex flex-col flex-1 p-3 gap-2.5">

        {/* Game-name chip */}
        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />

        {/* Title — 2 lines */}
        <div className="space-y-1.5">
          <div className="h-3.5 w-full  bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3.5 w-4/5   bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto">
          <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-12 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-1.5">
          <div className="h-11 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
