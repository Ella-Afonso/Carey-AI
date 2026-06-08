"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TraceStep } from "../lib/api";
import { Check, Database, Server, Cpu, HelpCircle, RefreshCw, Activity } from "lucide-react";

interface ReasoningSidebarProps {
  trace: TraceStep[];
  isLoading: boolean;
}

export default function ReasoningSidebar({ trace, isLoading }: ReasoningSidebarProps) {
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  // Sequential revealing of agent's inner steps to create a beautiful live feeling
  useEffect(() => {
    if (trace.length > 0) {
      setVisibleSteps(0);
      const interval = setInterval(() => {
        setVisibleSteps((prev) => {
          if (prev < trace.length) return prev + 1;
          clearInterval(interval);
          return prev;
        });
      }, 400); // Step fade-in interval of 400ms for premium fluid pacing
      return () => clearInterval(interval);
    } else {
      setVisibleSteps(0);
    }
  }, [trace]);

  const getToolIcon = (step: TraceStep) => {
    switch (step.tool_name) {
      case "search_patient_history":
        return <Database className="w-4 h-4 text-emerald-400" />;
      case "search_general_guidance":
        return <Server className="w-4 h-4 text-teal-400" />;
      case "log_new_observation":
        return <Activity className="w-4 h-4 text-purple-400" />;
      case "generate_clinician_summary":
        return <Cpu className="w-4 h-4 text-blue-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getToolDisplayName = (name: string) => {
    const map: Record<string, string> = {
      "search_general_guidance": "Querying Geriatric Clinical Guidelines",
      "search_patient_history": "Reading Patient Timeline History",
      "log_new_observation": "Updating Daily Clinical Observation Logs",
      "generate_clinician_summary": "Synthesizing Safety Risk Metrics",
    };
    return map[name] || name;
  };

  const activeResults = trace.slice(0, visibleSteps);

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border-l border-slate-800/40 backdrop-blur-3xl p-6 sm:p-7 select-none">
      {/* Header telemetry info */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-widest text-teal-400 uppercase">
            Clinical Trace Monitor
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">
            Real-time server-side execution pipeline
          </p>
        </div>
        
        {/* Status dot */}
        <div className="flex items-center space-x-2 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-teal-500'} pulse-glow`} />
          <span className="text-[9px] font-mono font-semibold text-slate-300 uppercase leading-none tracking-wider">
            {isLoading ? "Running Triage" : "Ready • Online"}
          </span>
        </div>
      </div>

      {/* Main timeline trace scroll layout */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 relative min-h-[300px]">
        {/* Futuristic pipeline timeline wire track */}
        {activeResults.length > 0 && (
          <div className="absolute left-[17px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-teal-500/40 via-blue-550/40 to-slate-800 z-0 pointer-events-none" />
        )}

        <AnimatePresence>
          {activeResults.map((step, idx) => {
            const isLast = idx === activeResults.length - 1;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex items-start group"
              >
                {/* Node icon */}
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:border-teal-500/50 group-hover:bg-slate-900 group-hover:neon-glow-teal">
                  {getToolIcon(step)}
                </div>

                {/* Content text */}
                <div className="ml-4 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 transition-colors duration-200">
                        {getToolDisplayName(step.tool_name)}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">
                        {step.called_via_mcp ? "MCP Pipeline Service" : "Local Security Tool"}
                      </p>
                    </div>
                    
                    {/* Time latency */}
                    <span className="text-[10px] font-mono text-slate-500 font-medium tracking-tight bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                      {step.duration_ms}ms
                    </span>
                  </div>

                  {/* Badges details inside */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      step.called_via_mcp 
                        ? 'bg-purple-950/40 border border-purple-500/20 text-purple-400' 
                        : 'bg-blue-950/40 border border-blue-500/20 text-blue-400'
                    }`}>
                      {step.called_via_mcp ? 'mcp.execute' : 'local.query'}
                    </span>
                    {step.success && (
                      <span className="flex items-center text-[9px] font-mono text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/10">
                        <Check className="w-2.5 h-2.5 mr-1" /> VALIDATED
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Loading placeholder when model runs */}
        {isLoading && activeResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mb-4" />
            <span className="text-xs font-mono tracking-widest text-teal-400 uppercase font-semibold">Triage Initializing</span>
            <span className="text-[10px] text-slate-500 mt-1">Acquiring clinical tokens...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && activeResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 px-6 text-center border-2 border-dashed border-slate-900 rounded-3xl">
            <Activity className="w-8 h-8 text-slate-700 mb-3 animate-pulse" />
            <h4 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">Monitor Terminal Off</h4>
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
              Input a caregiver report down inside the prompt panel to request deep AI medical triage analysis and view live trace logging.
            </p>
          </div>
        )}
      </div>

      {/* Footer support credits */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-600">
        <span>MCP Core: v1.8.4</span>
        <span>Secured SSL Triage</span>
      </div>
    </div>
  );
}
