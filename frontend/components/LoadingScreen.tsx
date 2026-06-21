/* ─── RailGuard AI — Loading Screen ─── */

"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#050A12] flex items-center justify-center">
      <div className="text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 relative">
            {/* Outer ring */}
            <motion.div
              className="absolute inset-0 border-2 border-cyan-500/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner ring */}
            <motion.div
              className="absolute inset-2 border-2 border-cyan-400/50 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            {/* Core */}
            <div className="absolute inset-4 bg-cyan-400/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl font-bold tracking-[0.3em] text-cyan-300 glow-text-cyan"
          >
            RAILGUARD AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-[10px] font-mono text-slate-500 tracking-[0.2em] mt-2"
          >
            RAILWAY DIGITAL TWIN & OPERATIONS INTELLIGENCE
          </motion.p>
        </motion.div>

        {/* Loading bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          className="w-48 mx-auto"
        >
          <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 1] }}
            transition={{ delay: 1, duration: 1.5, times: [0, 0.2, 0.8, 1] }}
            className="text-[9px] font-mono text-slate-600 mt-2 tracking-wider"
          >
            INITIALIZING DIGITAL TWIN...
          </motion.p>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="text-[10px] font-mono text-cyan-400/40 mt-8 tracking-wider"
        >
          Predicting Crowd Crises Before They Happen
        </motion.p>
      </div>

      {/* Scan line effect */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-20" />
    </div>
  );
}
