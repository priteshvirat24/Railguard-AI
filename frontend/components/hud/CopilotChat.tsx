/* ─── RailGuard AI — Operations Copilot Chat ─── */

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimulationStore } from "@/stores/simulationStore";
import { api } from "@/lib/api";

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messages = useSimulationStore((s) => s.copilotMessages);
  const addMessage = useSimulationStore((s) => s.addCopilotMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const suggestions = [
    "What is the highest-risk platform?",
    "Why was this plan selected?",
    "What happens if I don't intervene?",
    "What caused the current surge?",
    "Show me platform 2 status",
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    addMessage({ role: "user", content: text });
    setInput("");
    setLoading(true);

    try {
      const result = await api.copilotQuery(text);
      addMessage({ role: "assistant", content: result.response });
    } catch (e) {
      addMessage({
        role: "assistant",
        content: "Connection error. Ensure the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full
          flex items-center justify-center transition-all duration-300
          pointer-events-auto cursor-pointer
          ${isOpen
            ? "glass-panel border-cyan-400/40 glow-cyan"
            : "glass-panel hover:border-cyan-400/30"
          }`}
        id="copilot-toggle"
      >
        <span className="text-lg">{isOpen ? "✕" : "🤖"}</span>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 left-6 z-50 w-96 pointer-events-auto"
            id="copilot-chat"
          >
            <div className="glass-panel flex flex-col h-[450px]">
              {/* Header */}
              <div className="px-4 py-3 border-b border-cyan-500/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                    OPERATIONS COPILOT
                  </span>
                </div>
                <p className="text-[9px] font-mono text-slate-600 mt-0.5">
                  AI-powered railway operations assistant
                </p>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 mb-3">
                      Ask about station operations, platform status, or interventions
                    </p>
                    <div className="space-y-1.5">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="block w-full text-left px-3 py-1.5 text-[10px]
                            font-mono text-cyan-400/70 border border-cyan-500/15
                            rounded-md hover:bg-cyan-500/5 hover:border-cyan-400/30
                            transition-all cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-[11px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-cyan-500/15 text-cyan-200 border border-cyan-500/20"
                          : "bg-slate-800/50 text-slate-300 border border-slate-700/30"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800/50 border border-slate-700/30 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-cyan-500/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                    placeholder="Ask the copilot..."
                    className="flex-1 bg-slate-800/50 border border-slate-700/30 rounded-md
                      px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600
                      font-mono focus:outline-none focus:border-cyan-500/30"
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={loading || !input.trim()}
                    className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30
                      rounded-md text-[10px] font-mono font-bold text-cyan-300
                      hover:bg-cyan-500/20 transition-all cursor-pointer
                      disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    SEND
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
