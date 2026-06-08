"use client";

import React from "react";
import { motion } from "motion/react";
import { AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { EscalationResult } from "../lib/api";

interface EscalationBadgeProps {
  escalation: EscalationResult;
}

export default function EscalationBadge({ escalation }: EscalationBadgeProps) {
  const level = escalation.escalation_level?.toLowerCase().trim() || "none";

  if (level === "urgent") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="glass-panel rounded-2xl border border-red-500/30 p-5 mt-4 relative overflow-hidden neon-glow-red bg-red-950/20"
      >
        {/* Soft warning alert pulse bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 to-rose-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
        
        <div className="flex items-start pl-3 select-none">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mr-4 shadow-inner">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded uppercase leading-none">
                Clinical Priority Alert
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 font-display tracking-tight mt-1.5 leading-snug">
              Urgent — speak with a clinical health officer promptly
            </h3>
            
            {escalation.reasons && escalation.reasons.length > 0 && (
              <div className="mt-3.5 space-y-2">
                <p className="text-[10px] font-mono text-red-300 uppercase tracking-wider font-semibold">Triage Reasoning Logs:</p>
                <div className="space-y-1.5">
                  {escalation.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-red-200">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  if (level === "monitor") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="glass-panel rounded-2xl border border-amber-500/30 p-5 mt-4 relative overflow-hidden neon-glow-amber bg-amber-950/15"
      >
        {/* Soft yellow warning indicators */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-yellow-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
        
        <div className="flex items-start pl-3 select-none">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mr-4 shadow-inner">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase leading-none">
                Observation Alert
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 font-display tracking-tight mt-1.5 leading-snug">
              Patient Symptom Monitor — discuss at next appointment
            </h3>
            
            {escalation.reasons && escalation.reasons.length > 0 && (
              <div className="mt-3.5 space-y-2">
                <p className="text-[10px] font-mono text-amber-300 uppercase tracking-wider font-semibold">Triage Reasoning Logs:</p>
                <div className="space-y-1.5">
                  {escalation.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-amber-200">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Green / None state
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel rounded-2xl border border-emerald-500/20 p-5 mt-4 relative overflow-hidden bg-emerald-950/10"
    >
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-500 to-teal-600" />
      
      <div className="flex items-start pl-3 select-none">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mr-4 shadow-inner">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase leading-none">
              Routine Log Recorded
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100 font-display tracking-tight mt-1.5 leading-snug">
            Routine Dementia symptoms logged successfully
          </h3>
          <p className="mt-1 text-xs text-slate-400 leading-normal font-sans">
            No acute clinical triage warnings triggered. Standard homecare monitoring recommendations and supportive protocols are listed below.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
