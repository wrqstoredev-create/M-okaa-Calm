import React from 'react';

export default function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a1d24] border border-gray-100 dark:border-gray-700 rounded-lg p-3 shadow-sm flex flex-col h-full animate-pulse">
      <div className="w-full h-32 md:h-40 bg-gray-200 rounded mb-3"></div>
      <div className="flex-1 flex flex-col">
        <div className="w-16 h-3 bg-gray-200 rounded mb-2"></div>
        <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded mb-4"></div>
        <div className="mt-auto">
          <div className="w-20 h-5 bg-gray-200 rounded mb-3 mt-2"></div>
          <div className="w-full h-9 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
