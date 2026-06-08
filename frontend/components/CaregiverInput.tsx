"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, ShieldAlert, Sparkles, HeartPulse } from "lucide-react";
import { motion } from "motion/react";

interface CaregiverInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const SAMPLE_TEMPLATES = [
  { label: "Delirium Check", text: "My mother suddenly became much more confused today and has a mild temperature.", icon: ShieldAlert },
  { label: "Wandering Care", text: "He keeps exit-seeking and insists he needs to go home to check his childhood farm.", icon: Sparkles },
  { label: "Swallowing Issue", text: "The patient is coughing and having a difficult time swallowing their heart medications.", icon: HeartPulse },
];

export default function CaregiverInput({ onSubmit, isLoading }: CaregiverInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const useTemplate = (text: string) => {
    if (!isLoading) {
      setMessage(text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 select-none">
      {/* Quick click template prompt bubbles for hackathon judges/caregivers */}
      {!isLoading && !message.trim() && (
        <div className="space-y-2.5">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold uppercase block text-center lg:text-left">
            Quick-Triage Scenario Templates
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {SAMPLE_TEMPLATES.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={idx}
                  type="button"
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => useTemplate(item.text)}
                  className="flex items-start gap-2.5 text-left p-3 rounded-xl bg-slate-900/45 border border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-900/80 hover:shadow-[0_4px_20px_rgba(20,184,166,0.05)] cursor-pointer transition-all duration-300"
                >
                  <div className="p-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 mt-0.5">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">{item.label}</span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[190px] mt-0.5">{item.text}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary user input form console */}
      <form onSubmit={handleSubmit} className="relative w-full">
        {/* Glow halo behind panel when writing */}
        <div className={`absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 pointer-events-none ${
          message.trim() ? "opacity-100" : ""
        }`} />

        <div className="relative rounded-2xl bg-slate-900/60 border border-slate-800 focus-within:border-teal-500/50 shadow-2xl backdrop-blur-2xl transition-all duration-300 overflow-hidden pr-3 pb-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Report sudden changes, agitation occurrences, medication refusals, or confusion concerns safely..."
            className="w-full p-4 pr-12 pb-12 resize-none outline-none text-sm text-slate-100 placeholder-slate-500 bg-transparent min-h-[96px] max-h-[200px]"
            disabled={isLoading}
          />
          
          <div className="absolute bottom-3 right-3 flex items-center space-x-3 justify-end w-full pl-3 pointer-events-none select-none">
            {/* Input helpers instruction */}
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline mr-2">
              Press Enter to Submit • Shift+Enter for new line
            </span>

            <motion.button
              type="submit"
              disabled={!message.trim() || isLoading}
              whileHover={message.trim() && !isLoading ? { scale: 1.08, y: -1 } : {}}
              whileTap={message.trim() && !isLoading ? { scale: 0.94 } : {}}
              className="flex items-center justify-center p-3 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] pointer-events-auto cursor-pointer"
              title="Submit Care Observation Report"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}
