import React from 'react';
import { Zap } from 'lucide-react';

interface DevConsoleProps {
  title?: string;
  name?: string;
}

export default function DevConsole({
  title = "devwhite",
  name = "Abdulrahman Fullstack Developer",
}: DevConsoleProps) {
  return (
    <div className="bg-[#1a1614] p-8 md:p-12 font-mono text-white max-w-2xl mx-auto shadow-2xl my-8 overflow-hidden relative" dir="ltr">
      {/* Glitch Title */}
      <div className="relative mb-12">
        <h1 className="text-7xl md:text-8xl font-black tracking-tighter relative inline-block">
          <span className="relative z-10">{title}</span>
          {/* Glitch layers */}
          <span className="absolute top-0 left-0 -translate-x-[4px] -translate-y-[2px] text-[#00f3ff] opacity-80 mix-blend-screen pointer-events-none">{title}</span>
          <span className="absolute top-0 left-0 translate-x-[4px] translate-y-[2px] text-[#ff00ff] opacity-80 mix-blend-screen pointer-events-none">{title}</span>
        </h1>
      </div>

      {/* Info Container */}
      <div className="relative pl-6 py-2">
        {/* Main Side Border (Cyan) */}
        <div className="absolute left-0 top-0 bottom-0 w-[6px] bg-[#00f3ff]"></div>
        
        <div className="space-y-4">
          {/* Name Item */}
          <div className="inline-block relative">
            <div className="bg-[#0b1424] py-1.5 px-4 flex items-center gap-3 border-r-[6px] border-r-[#ff00ff]">
              <Zap size={18} className="text-[#ff9d00]" fill="currentColor" />
              <span className="text-sm md:text-base font-bold whitespace-nowrap">{name}</span>
            </div>
          </div>
        </div>

        {/* Footer Accent */}
        <div className="mt-8 flex gap-2">
          <div className="h-8 w-12 bg-[#00f3ff]"></div>
          <div className="h-8 w-6 bg-[#ff00ff]"></div>
        </div>
      </div>

      {/* Extreme Bottom Left Corner Accent */}
      <div className="absolute bottom-4 left-4 flex">
        <div className="w-[10px] h-[30px] bg-[#00f3ff]"></div>
        <div className="w-[10px] h-[30px] bg-[#ff00ff] mt-[20px] -ml-[5px]"></div>
      </div>
    </div>
  );
}

