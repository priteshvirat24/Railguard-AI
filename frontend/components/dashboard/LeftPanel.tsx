"use client";

import React, { useState } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { Train as TrainIcon, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export function LeftPanel() {
  const { trains, activeIncidents, stationState } = useSimulationStore();
  const [search, setSearch] = useState("");

  const filteredTrains = trains.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-[#0B0E12] border-r border-[#2E3742] flex flex-col text-[#E6EAEF] overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-[#2E3742] sticky top-0 bg-[#0B0E12] z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <div className="w-6 h-6 border-2 border-[#34B6D6] rounded bg-[#34B6D6]/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#34B6D6] rotate-45 rounded-sm"></div>
          </div>
          RAILGUARD OPS
        </div>
        <div className="text-xs font-mono text-[#9AA4B0]">ACTIVE</div>
      </div>

      {/* Tracking List */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9AA4B0]">Tracking List</h2>
          <div className="flex gap-2">
            <button className="p-1 hover:bg-[#1B2129] rounded transition-colors"><Clock size={14}/></button>
            <button className="p-1 hover:bg-[#1B2129] rounded transition-colors"><AlertTriangle size={14}/></button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search Headcode or UID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#171C24] border border-[#2E3742] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#34B6D6] transition-colors font-mono"
          />
        </div>

        {/* Train List */}
        <div className="flex flex-col gap-3">
          {filteredTrains.length === 0 && (
            <div className="text-xs text-[#5E6975] text-center mt-4 font-mono">No trains active. Start simulation.</div>
          )}
          {filteredTrains.map(train => (
            <div key={train.id} className="bg-[#171C24] border border-[#2E3742] rounded-lg p-3 hover:border-[#34B6D6] transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-[#1B2129] p-1.5 rounded text-[#9AA4B0] group-hover:text-[#34B6D6] transition-colors">
                    <TrainIcon size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{train.name}</div>
                    <div className="text-xs font-mono text-[#5E6975]">ID: {train.id}</div>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                  train.status === 'APPROACHING' || train.status === 'BOARDING' || train.status === 'DEPARTING' || train.status === 'SCHEDULED' || train.status === 'STOPPED' ? 'bg-[#3FB97A]/20 text-[#3FB97A]' :
                  train.status === 'DELAYED' ? 'bg-[#E0A23B]/20 text-[#E0A23B]' :
                  'bg-[#E5484D]/20 text-[#E5484D]'
                }`}>
                  {train.status}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#9AA4B0] mb-2">
                <span>Platform {train.platformId}</span>
                <div className="flex-1 border-t border-dashed border-[#5E6975] relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] bg-[#171C24] px-1 whitespace-nowrap">
                    Track {train.trackId}
                  </div>
                </div>
                <span>Load: {train.passengerLoad}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <div>
                  <span className="text-[#5E6975]">Arr:</span> {Math.floor(train.actualArrival / 60)}:{(train.actualArrival % 60).toString().padStart(2, '0')}
                </div>
                {train.delayMinutes > 0 && (
                  <div className="text-[#E5484D] font-mono">+{train.delayMinutes}m</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Incidents Summary */}
      <div className="p-4 border-t border-[#2E3742] bg-[#11151B]">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9AA4B0] mb-3">System Health</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#171C24] border border-[#2E3742] p-2 rounded flex items-center justify-between">
            <span className="text-xs text-[#5E6975]">Status</span>
            <span className={`font-mono font-bold text-[10px] uppercase ${stationState === 'NORMAL' ? 'text-[#3FB97A]' : 'text-[#E5484D]'}`}>{stationState}</span>
          </div>
          <div className="bg-[#171C24] border border-[#2E3742] p-2 rounded flex items-center justify-between">
            <span className="text-xs text-[#5E6975]">Incidents</span>
            <span className={`font-mono font-bold ${activeIncidents > 0 ? 'text-[#E5484D]' : 'text-[#3FB97A]'}`}>{activeIncidents}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
