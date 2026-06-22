"use client";

import React, { useState, useMemo, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';
import { useSimulationStore } from '@/stores/simulationStore';
import { PlatformState, TrainStatus } from '@/lib/types';

// Carto Dark Matter (free basemap, no token required for low usage)
const MAP_STYLE = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#050A12" },
    },
  ],
};

const INITIAL_VIEW_STATE = {
  longitude: -0.1276,
  latitude: 51.5072,
  zoom: 12,
  pitch: 0,
  bearing: 0,
};

// Map Cartesian X,Z to Geospatial Lng,Lat
const mapCartesianToGeo = (x: number, z: number): [number, number] => {
  return [-0.1276 + (x * 0.005), 51.5072 + (z * 0.005)];
};

// Helper for colors
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [255, 255, 255];
};

const COLOR_NORMAL = hexToRgb('#3FB97A');
const COLOR_DELAYED = hexToRgb('#E0A23B');
const COLOR_CRITICAL = hexToRgb('#E5484D');
const COLOR_TRACK = hexToRgb('#D97706'); // Glowing orange

export function OperationalMap() {
  const { platforms, trains, tracks, forecasts } = useSimulationStore();
  const [hoverInfo, setHoverInfo] = useState<any>(null);

  // Animate train movement or pulsating effects
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setTime(t => (t + 1) % 100);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const layers = useMemo(() => [
    // Layer 1 & 2: Tracks
    new PathLayer({
      id: 'track-layer',
      data: tracks,
      pickable: true,
      widthScale: 20,
      widthMinPixels: 2,
      getPath: d => {
        // Find platforms to connect
        const p1 = platforms.find(p => p.id === d.platformIds[0]);
        const p2 = platforms.find(p => p.id === d.platformIds[1]);
        if (p1 && p2) {
          return [mapCartesianToGeo(p1.x, p1.z), mapCartesianToGeo(p2.x, p2.z)];
        }
        return [];
      },
      getColor: d => {
        if (d.hasSignalFailure) return COLOR_CRITICAL;
        return COLOR_TRACK;
      },
      getWidth: d => (d.hasSignalFailure ? 4 : 2),
    }),

    // Layer 3: Platforms
    new ScatterplotLayer({
      id: 'platform-layer',
      data: platforms,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 60,
      radiusMinPixels: 6,
      radiusMaxPixels: 100,
      lineWidthMinPixels: 1,
      getPosition: d => mapCartesianToGeo(d.x, d.z),
      getFillColor: d => {
        if (d.state === 'CRITICAL') return COLOR_CRITICAL;
        if (d.state === 'CONGESTING' || d.state === 'WARNING') return COLOR_DELAYED;
        return COLOR_NORMAL;
      },
      getLineColor: [255, 255, 255],
      onHover: info => setHoverInfo(info),
      // Pulse critical platforms using time
      getRadius: d => (d.state === 'CRITICAL' ? 100 + Math.sin(time * 0.1) * 30 : 100),
      updateTriggers: {
        getRadius: [time]
      }
    }),

    // Layer 4: Trains
    new ScatterplotLayer({
      id: 'train-layer',
      data: trains,
      pickable: true,
      opacity: 1,
      stroked: true,
      filled: true,
      radiusScale: 80,
      radiusMinPixels: 8,
      lineWidthMinPixels: 2,
      getPosition: d => {
        const platform = platforms.find(p => p.id === d.platformId);
        if (platform) {
          // If train is moving, approximate position between stations
          // For now, place it on the platform
          return mapCartesianToGeo(platform.x, platform.z + 2);
        }
        return mapCartesianToGeo(0, 0);
      },
      getFillColor: [255, 255, 255],
      getLineColor: d => {
        if (d.status === 'DELAYED' || d.status === 'CANCELLED') return COLOR_CRITICAL;
        if (d.status === 'APPROACHING') return COLOR_DELAYED;
        return COLOR_NORMAL; // Blue equivalent
      },
      onHover: info => setHoverInfo(info),
    })
  ], [time, platforms, trains, tracks]);

  return (
    <div className="relative w-full h-full bg-[#0B0E12] overflow-hidden">
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
        getCursor={({ isDragging, isHovering }) => 
          isDragging ? 'grabbing' : isHovering ? 'pointer' : 'crosshair'
        }
      >
        <Map
          mapStyle={MAP_STYLE}
          // Remove default attribution for cleaner NOC look
          attributionControl={false}
        />
      </DeckGL>

      {/* Hover Tooltip Intelligence Card */}
      {hoverInfo && hoverInfo.object && (
        <div 
          className="absolute z-50 pointer-events-none bg-[#0B0E12]/95 backdrop-blur-md border border-[#2E3742] shadow-2xl rounded-lg p-4 text-[#E6EAEF] max-w-[280px]"
          style={{
            left: hoverInfo.x + 15,
            top: hoverInfo.y + 15
          }}
        >
          {hoverInfo.layer.id === 'train-layer' && (
            <>
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">Train {hoverInfo.object.name || hoverInfo.object.id}</div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  hoverInfo.object.status === 'APPROACHING' || hoverInfo.object.status === 'BOARDING' || hoverInfo.object.status === 'DEPARTING' || hoverInfo.object.status === 'SCHEDULED' || hoverInfo.object.status === 'STOPPED' ? 'bg-[#3FB97A]/20 text-[#3FB97A]' :
                  hoverInfo.object.status === 'DELAYED' ? 'bg-[#E0A23B]/20 text-[#E0A23B]' :
                  'bg-[#E5484D]/20 text-[#E5484D]'
                }`}>
                  {hoverInfo.object.status}
                </div>
              </div>
              <div className="text-xs text-[#9AA4B0] space-y-1">
                <div><span className="text-[#5E6975]">Platform:</span> {hoverInfo.object.platformId}</div>
                <div><span className="text-[#5E6975]">Passengers:</span> {hoverInfo.object.passengerLoad}</div>
              </div>
            </>
          )}

          {hoverInfo.layer.id === 'platform-layer' && (
            <>
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold">{hoverInfo.object.name}</div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  hoverInfo.object.state === 'CRITICAL' ? 'bg-[#E5484D]/20 text-[#E5484D]' :
                  hoverInfo.object.state === 'CONGESTING' || hoverInfo.object.state === 'WARNING' ? 'bg-[#E0A23B]/20 text-[#E0A23B]' :
                  'bg-[#3FB97A]/20 text-[#3FB97A]'
                }`}>
                  {hoverInfo.object.state}
                </div>
              </div>
              <div className="text-xs text-[#9AA4B0] space-y-1">
                <div><span className="text-[#5E6975]">Current Density:</span> {(hoverInfo.object.currentDensity * 100).toFixed(0)}%</div>
                <div><span className="text-[#5E6975]">Passengers:</span> {hoverInfo.object.passengerCount} / {hoverInfo.object.capacity}</div>
              </div>
              {hoverInfo.object.state === 'CRITICAL' && (
                <div className="mt-3 pt-2 border-t border-[#2E3742] text-[#E0A23B] text-[11px] font-bold">
                  RECOMMENDATION: Use Agent Console
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
