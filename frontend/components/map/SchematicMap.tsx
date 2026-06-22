"use client";

import React, { useMemo } from "react";
import { useSimulationStore } from "@/stores/simulationStore";
import { usePanZoom } from "@/hooks/usePanZoom";

// The mockup positioned platforms using these percentages: [left%, top%]
const PLATFORM_POSITIONS: Record<number, [number, number]> = {
  1: [26, 70],
  2: [51, 60],
  3: [42, 41],
  4: [64, 52],
  5: [75, 31],
  6: [20, 52],
};

const getSeverityClass = (state: string) => {
  switch (state) {
    case "NORMAL":
      return { ring: "border-[#37C871]/55", core: "bg-[#37C871]", text: "text-[#37C871]" };
    case "WARNING":
    case "CONGESTING":
      return { ring: "border-[#EAB308]/60", core: "bg-[#EAB308]", text: "text-[#EAB308]" };
    case "CRITICAL":
    case "MITIGATING":
      return { ring: "border-[#E5484D] animate-[ping_1.4s_ease-out_infinite]", core: "bg-[#E5484D]", text: "text-[#E5484D]" };
    default:
      return { ring: "border-[#37C871]/55", core: "bg-[#37C871]", text: "text-[#37C871]" };
  }
};

export function SchematicMap() {
  const platforms = useSimulationStore((s) => s.snapshot?.platforms) || [];
  const trains = useSimulationStore((s) => s.snapshot?.trains) || [];
  const { view, containerRef, onWheel, onPointerDown, onPointerMove, onPointerUp, resetView } = usePanZoom();

  // SVG background layout from the mockup
  const renderBackground = useMemo(() => {
    const blocks = [
      [90, 110, 250, 170],
      [470, 80, 210, 250],
      [760, 150, 300, 200],
      [150, 420, 240, 210],
      [520, 430, 170, 200],
      [830, 450, 250, 230],
      [290, 690, 300, 150],
      [710, 720, 330, 140],
      [1090, 300, 220, 300],
      [1130, 80, 200, 150],
    ];

    const lines1 = [];
    for (let x = -160; x < 1560; x += 64) {
      lines1.push(<line key={`l1-${x}`} x1={x} y1="-20" x2={x + 260} y2="920" stroke="#161C25" strokeWidth="1.1" />);
    }

    const lines2 = [];
    for (let y = -120; y < 1020; y += 64) {
      lines2.push(<line key={`l2-${y}`} x1="-20" y1={y} x2="1420" y2={y + 150} stroke="#161C25" strokeWidth="1.1" />);
    }

    const avenues = [
      "M-20 360 L1420 470",
      "M260 -20 L640 920",
      "M-20 640 L1420 200",
    ];

    const routes = [
      "M-40 250 C 240 270, 430 380, 680 360 S 1140 300, 1460 380",
      "M260 -40 C 320 240, 470 430, 600 700 S 660 940, 700 1000",
      "M-40 640 C 280 560, 580 470, 760 300 S 1120 110, 1460 150",
      "M-40 470 C 320 520, 560 470, 840 560 S 1200 700, 1460 650",
    ];

    const junctions = [
      [300, 276], [430, 305], [560, 333], [690, 361],
      [600, 470], [760, 300], [930, 520], [840, 560],
    ];

    return (
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ pointerEvents: 'none' }}
      >
        {blocks.map((b, i) => (
          <rect key={`b-${i}`} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="7" fill="#0F141B" stroke="#1A212B" strokeWidth="1" />
        ))}
        {lines1}
        {lines2}
        {avenues.map((d, i) => (
          <path key={`a-${i}`} d={d} stroke="#1E2530" strokeWidth="2.4" fill="none" />
        ))}
        {routes.map((d, i) => (
          <React.Fragment key={`r-${i}`}>
            <path d={d} stroke="#F2792B" strokeWidth="3.4" fill="none" opacity=".88" />
            <path d={d} stroke="#F2792B" strokeWidth="9" fill="none" opacity=".07" />
          </React.Fragment>
        ))}
        {junctions.map((j, i) => (
          <circle key={`j-${i}`} cx={j[0]} cy={j[1]} r="6.5" fill="#0A0D12" stroke="#F2792B" strokeWidth="2.4" />
        ))}
      </svg>
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0A0D12] overflow-hidden select-none cursor-grab active:cursor-grabbing"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          width: '1400px',
          height: '900px',
          left: '50%',
          top: '50%',
          marginLeft: '-700px',
          marginTop: '-450px'
        }}
      >
        {renderBackground}

        {/* Render Platforms */}
        {platforms.map((pf) => {
          const pos = PLATFORM_POSITIONS[pf.id] || [50, 50];
          const sev = getSeverityClass(pf.state);
          const isCritical = pf.state === "CRITICAL";

          return (
            <div
              key={pf.id}
              className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
            >
              <div className="relative w-11 h-11 flex items-center justify-center transition-transform group-hover:scale-110">
                <div className={`absolute inset-0 rounded-full border-2 bg-[#0A0D12]/60 backdrop-blur-[2px] ${sev.ring}`} />
                <div className={`w-4 h-4 rounded-[5px] flex items-center justify-center ${sev.core}`}>
                  <svg viewBox="0 0 24 24" className="w-[11px] h-[11px] stroke-[#0A0D12] fill-none stroke-2">
                    <path d="M12 2v20M5 8l7-3 7 3M5 14l7-3 7 3" />
                  </svg>
                </div>
              </div>
              <div className={`font-mono text-[10px] font-medium bg-[#0A0D12]/80 px-2 py-0.5 rounded-[5px] border border-[#212833] flex items-center gap-1.5 transition-colors ${isCritical ? 'border-[#E5484D] text-[#E5484D]' : 'text-white group-hover:border-[#F2792B] group-hover:text-[#F2792B]'}`}>
                {pf.name}
                <span className="text-[#5B6571]">{Math.round(pf.currentDensity * 100)}%</span>
              </div>
            </div>
          );
        })}

        {/* Render Trains */}
        {trains.map((train) => {
          // Find platform position for this train
          const targetPos = PLATFORM_POSITIONS[train.platformId] || [50, 50];
          
          // Animate position slightly based on status
          let xOffset = 0;
          let opacity = 1;
          
          if (train.status === 'APPROACHING') {
            xOffset = -60 + (train.position * 40); // Move closer
          } else if (train.status === 'DEPARTING') {
            xOffset = 20 + (train.position * 40); // Move away
            opacity = 1 - train.position; // Fade out
          } else if (train.status === 'SCHEDULED') {
            opacity = 0; // Don't show
          }

          return (
            <div
              key={train.id}
              className="absolute z-[15] -translate-x-1/2 -translate-y-1/2 transition-all duration-[1000ms] ease-linear"
              style={{ 
                left: `calc(${targetPos[0]}% + ${xOffset}px)`, 
                top: `calc(${targetPos[1]}% + 20px)`,
                opacity 
              }}
            >
              <div className="relative w-[30px] h-[12px] rounded-[3px] bg-[#8A95A2] border border-[#b3bcc7]">
                <div className="absolute left-[2px] top-[2px] bottom-[2px] w-[5px] rounded-[1px] bg-black/25" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls HUD */}
      <div className="absolute right-4 bottom-4 z-50 flex items-center gap-1.5 bg-[#0F141B]/90 backdrop-blur-md border border-[#212833] rounded-lg p-1.5 shadow-lg">
        <button onClick={resetView} className="w-7 h-7 rounded-md flex items-center justify-center text-[#97A1AD] hover:bg-[#151A22] hover:text-[#E8ECF1]">
          <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] stroke-current fill-none stroke-2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          </svg>
        </button>
        <div className="px-2 font-mono text-[11px] text-[#97A1AD]">
          {Math.round(view.scale * 100)}%
        </div>
      </div>
    </div>
  );
}
