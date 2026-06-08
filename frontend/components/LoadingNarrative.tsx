"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Heart, Search, Cpu, Sparkles } from "lucide-react";

const NARRATIVE_STEPS = [
  { text: "Accessing clinical guidelines & memory records...", icon: Search, color: "text-teal-400" },
  { text: "Analyzing temporal patterns & sudden delirium changes...", icon: Cpu, color: "text-blue-400" },
  { text: "Synthesizing patient care diary metrics...", icon: Heart, color: "text-red-400" },
  { text: "Formulating urgent medical triage assessment...", icon: ShieldCheck, color: "text-emerald-400" },
];

export default function LoadingNarrative() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Step switcher
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % NARRATIVE_STEPS.length);
    }, 2800);

    // Progress percentage loader simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        return prev + 1;
      });
    }, 110);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const CurrentIcon = NARRATIVE_STEPS[stepIndex].icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 glass-panel rounded-3xl border border-teal-500/10 min-h-[340px] relative overflow-hidden backdrop-blur-xl bg-slate-900/40">
      {/* Absolute floating grid elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(20,184,166,0.1),transparent)] pointer-events-none" />

      {/* Futuristic pulsing loader animation */}
      <div className="relative flex items-center justify-center w-28 h-28 mb-8">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full bg-teal-500/20 filter blur-xl animate-pulse" />
        
        {/* Outer orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-dashed border-teal-500/30"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[6px] rounded-full border border-teal-500/15"
        />
        
        {/* Innermost core with active icon */}
        <div className="relative w-20 h-20 rounded-full bg-slate-950/80 border border-teal-400/30 flex items-center justify-center shadow-inner text-teal-400">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ scale: 0.7, opacity: 0, rotate: -25 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.7, opacity: 0, rotate: 25 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center"
            >
              <CurrentIcon className="w-9 h-9" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic percentage */}
        <span className="absolute bottom-[-10px] right-[-10px] bg-teal-500/10 border border-teal-400/30 text-teal-400 text-[10px] font-mono px-1.5 py-0.5 rounded-full shadow-lg">
          {progress}%
        </span>
      </div>

      {/* Multi-step narrative block */}
      <div className="w-full max-w-md text-center px-4 relative z-10">
        <div className="h-14 flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ y: 20, opacity: 0, filter: "blur(2px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(2px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-full flex flex-col items-center justify-center"
            >
              <span className={`text-[11px] font-mono tracking-widest uppercase font-semibold gap-1.5 flex items-center ${NARRATIVE_STEPS[stepIndex].color}`}>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Core Reasoning Engine Active
              </span>
              <p className="text-base text-slate-100 font-medium tracking-tight mt-2 px-2">
                {NARRATIVE_STEPS[stepIndex].text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dynamic progress bar below */}
        <div className="w-full h-1 bg-slate-850 rounded-full overflow-hidden mt-6 mb-2">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
          />
        </div>

        <p className="text-[10px] font-mono text-slate-500 tracking-wider uppercase mt-3">
          Clinical Trust protocols are actively engaged
        </p>
      </div>
    </div>
  );
}
