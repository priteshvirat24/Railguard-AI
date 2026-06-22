"use client";

import React from 'react';
import { Activity, Zap, TrendingUp, Filter, Users, Crosshair } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';
import { api } from '@/lib/api';

// Map Cartesian X,Z to Geospatial Lng,Lat for display
const mapCartesianToGeo = (x: number, z: number): [number, number] => {
  return [-0.1276 + (x * 0.005), 51.5072 + (z * 0.005)];
};

export function RightPanel() {
  const { platforms, forecasts, rankedPlans, crisisProbability } = useSimulationStore();

  const criticalPlatform = platforms.find(p => p.state === 'CRITICAL') || platforms.find(p => p.state === 'CONGESTING' || p.state === 'WARNING') || platforms[0];

  const handleExecute = async (planId: string) => {
    try {
      await api.executePlan(planId);
    } catch (e) {
      console.error("Failed to execute plan", e);
    }
  };

  return (
    <div className="w-full h-full bg-[#0B0E12] border-l border-[#2E3742] flex flex-col text-[#E6EAEF] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#2E3742] sticky top-0 bg-[#0B0E12] z-10 flex items-center justify-between">
        <div className="text-sm font-semibold tracking-wide flex items-center gap-2">
          <Zap size={16} className="text-[#E0A23B]" />
          DECISION INTELLIGENCE
        </div>
        <button className="p-1 hover:bg-[#1B2129] rounded transition-colors"><Filter size={14}/></button>
      </div>

      {/* Focus Area */}
      {criticalPlatform ? (
        <div className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9AA4B0] mb-3">Active Focus: {criticalPlatform.name}</h2>
          
          <div className={`bg-[#171C24] border rounded-lg p-4 relative overflow-hidden ${criticalPlatform.state === 'CRITICAL' ? 'border-[#E5484D]/50' : 'border-[#E0A23B]/50'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${criticalPlatform.state === 'CRITICAL' ? 'bg-[#E5484D]' : 'bg-[#E0A23B]'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-lg font-bold">{criticalPlatform.name}</div>
                <div className="text-xs text-[#5E6975] font-mono">LOC: {mapCartesianToGeo(criticalPlatform.x, criticalPlatform.z).map(n => n.toFixed(4)).join(', ')}</div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold tracking-wider ${criticalPlatform.state === 'CRITICAL' ? 'bg-[#E5484D]/20 text-[#E5484D]' : 'bg-[#E0A23B]/20 text-[#E0A23B]'}`}>
                {criticalPlatform.state}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#9AA4B0]"><Users size={14} /> Density</div>
                <div className={`font-mono font-bold ${criticalPlatform.currentDensity > 0.85 ? 'text-[#E5484D]' : 'text-[#E0A23B]'}`}>{(criticalPlatform.currentDensity * 100).toFixed(0)}%</div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#9AA4B0]"><TrendingUp size={14} /> Forecast +15m</div>
                {(() => {
                  const forecast = forecasts.find(f => f.platformId === criticalPlatform.id && f.minutesAhead === 15);
                  return (
                    <div className="font-mono text-[#E5484D] font-bold">
                      {forecast ? `${(forecast.predictedDensity * 100).toFixed(0)}%` : 'N/A'} {forecast && forecast.predictedDensity > criticalPlatform.currentDensity ? '↑' : '↓'}
                    </div>
                  );
                })()}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[#9AA4B0]"><Crosshair size={14} /> Network Risk</div>
                <div className="font-mono text-[#E6EAEF] font-bold">{(crisisProbability * 100).toFixed(0)}/100</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 text-xs text-[#5E6975] font-mono text-center">Start simulation to view data.</div>
      )}

      {/* Agent Recommendations */}
      <div className="p-4 border-t border-[#2E3742] flex-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9AA4B0] mb-4">Agent Recommendations</h2>
        
        <div className="space-y-3">
          {rankedPlans.length === 0 ? (
            <div className="text-xs text-[#5E6975] font-mono text-center">No active plans.</div>
          ) : (
            rankedPlans.map(plan => (
              <div key={plan.planId} className="bg-[#171C24] border border-[#3FB97A]/30 rounded-lg p-3 hover:border-[#3FB97A] transition-colors cursor-pointer">
                <div className="text-sm font-semibold text-[#3FB97A] mb-1">{plan.planName}</div>
                <div className="text-xs text-[#9AA4B0] mb-2">{plan.recommendation}</div>
                <div className="flex justify-end">
                  <button 
                    onClick={() => handleExecute(plan.planId)}
                    className="bg-[#3FB97A]/20 text-[#3FB97A] px-3 py-1 rounded text-xs font-bold uppercase hover:bg-[#3FB97A]/30 transition-colors"
                  >
                    Execute
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Telemetry (Mini Charts Placeholder) */}
      <div className="p-4 border-t border-[#2E3742] bg-[#11151B]">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9AA4B0] mb-3 flex items-center gap-2">
          <Activity size={14} /> Network Telemetry
        </h2>
        
        {/* Simple CSS bars to simulate a chart */}
        <div className="h-16 flex items-end gap-1">
          {[40, 60, 30, 80, 50, 90, 70, 45, 65, 85, 55, 75].map((val, i) => (
            <div 
              key={i} 
              className="flex-1 bg-[#34B6D6]/50 hover:bg-[#34B6D6] transition-colors rounded-t-sm" 
              style={{ height: `${val}%` }}
            ></div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-[#5E6975] mt-1 font-mono">
          <span>08:00</span>
          <span>10:00</span>
          <span>12:00</span>
        </div>
      </div>
    </div>
  );
}
