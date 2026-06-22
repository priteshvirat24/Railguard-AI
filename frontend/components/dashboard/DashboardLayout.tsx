"use client";

import React from 'react';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { SchematicMap } from '../map/SchematicMap';

export function DashboardLayout() {
  return (
    <div className="w-full h-full flex bg-[#050A12] overflow-hidden">
      {/* Left Panel - 20% width roughly */}
      <div className="w-[320px] h-full flex-shrink-0 relative z-20 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
        <LeftPanel />
      </div>

      {/* Center Map - 60% width roughly (flex-1) */}
      <div className="flex-1 h-full relative z-10">
        <SchematicMap />
        
        {/* Subtle Map Overlays - Top Center status indicator */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#0B0E12]/80 backdrop-blur-md border border-[#2E3742] px-4 py-1.5 rounded-full shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3FB97A] animate-pulse"></div>
            <span className="text-[#E6EAEF] text-xs font-mono font-semibold">NETWORK: SECURE</span>
          </div>
          <div className="w-px h-3 bg-[#2E3742]"></div>
          <span className="text-[#9AA4B0] text-[10px] font-mono uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {/* Right Panel - 20% width roughly */}
      <div className="w-[320px] h-full flex-shrink-0 relative z-20 shadow-[-4px_0_24px_rgba(0,0,0,0.4)]">
        <RightPanel />
      </div>
    </div>
  );
}
