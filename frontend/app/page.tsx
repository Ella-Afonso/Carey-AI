/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState } from "react";
import CaregiverInput from "../components/CaregiverInput";
import EscalationBadge from "../components/EscalationBadge";
import AgentResponse from "../components/AgentResponse";
import ReasoningSidebar from "../components/ReasoningSidebar";
import LoadingNarrative from "../components/LoadingNarrative";
import { callCaregiverAgent, AgentResponse as AgentResponseType } from "../lib/api";
import { Activity, ShieldAlert, Heart, Calendar, ArrowUpRight, CheckCircle2, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AgentResponseType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasReportedAtLeastOnce, setHasReportedAtLeastOnce] = useState(false);

  const handleSubmit = async (message: string) => {
    setIsLoading(true);
    setError(null);
    setResponse(null); // Reset layout to trigger entering animations

    try {
      const res = await callCaregiverAgent(message);
      setResponse(res);
      setHasReportedAtLeastOnce(true);
    } catch (err: any) {
      console.error(err);
      setError("Unable to process the care plan right now. If your patient is in danger or needs immediate medical intervention, dial emergency services immediately.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden text-slate-100 font-sans bg-slate-950">
      {/* Background radial spotlight visual rings */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 filter blur-[120px] pointer-events-none" />

      {/* Main interactive left workspace (2/3 width on large desktops) */}
      <div className="flex-1 lg:w-2/3 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Dynamic Telemetry Header */}
        <header className="border-b border-slate-800/60 bg-slate-950/40 backdrop-blur-md px-6 py-4.5 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3.5 select-none">
            {/* Animated medical pulse cross container */}
            <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 relative overflow-hidden group">
              <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Activity className="w-5.5 h-5.5 relative z-10 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-display tracking-tight text-slate-100 leading-none">
                  Carey AI Client Portal
                </h1>
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded-full uppercase leading-none bg-slate-900/60 shadow-sm">
                  Clinical v1.8
                </span>
              </div>
              <p className="text-[11px] text-teal-400 mt-1 font-semibold tracking-wide flex items-center gap-1">
                <Heart className="w-3 h-3 fill-teal-500/20 text-teal-400 inline" /> Dementia Support, Care Planning & Safety Triage
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 bg-slate-900/40 border border-slate-800/80 p-1.5 rounded-2xl text-xs select-none shadow-inner">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono text-[10px] text-slate-300 font-semibold uppercase">ID: demo-patient-001</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 text-slate-400 text-[10px] uppercase font-mono tracking-wide">
              <Calendar className="w-3.5 h-3.5 mr-0.5" /> Checked Sync
            </div>
          </div>
        </header>

        {/* Dynamic Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth flex flex-col min-h-0 bg-slate-950/20">
          <div className="flex-1 w-full max-w-3.5xl mx-auto flex flex-col">
            
            {/* If no interaction has occurred yet, show a welcoming healthcare intro dashboard */}
            <AnimatePresence mode="wait">
              {!isLoading && !error && !response && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5 }}
                  className="my-auto py-10 w-full max-w-2xl mx-auto text-center"
                >
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-6 shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-blue-500/20 animate-pulse" />
                    <Heart className="w-7 h-7 relative z-10 animate-pulse text-teal-400" />
                  </div>
                  
                  <h2 className="text-2xl font-bold font-display tracking-tight text-slate-100 leading-snug">
                    How is your loved one coping today?
                  </h2>
                  <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-md mx-auto">
                    Type a clinical concern or load one of the quick scenario templates below. Carey is trained on official medical guidelines to offer immediate, reassuring advice and log metrics.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 max-w-lg mx-auto text-left select-none">
                    <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-2xl flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200">Clinical Triage Evaluation</span>
                        <span className="text-[10px] text-slate-500 block mt-1 leading-normal">Evaluates cognitive changes against UTI risk logs and delirium signals.</span>
                      </div>
                    </div>
                    <div className="border border-slate-900 bg-slate-950/40 p-4 rounded-2xl flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200">Supportive Redirection</span>
                        <span className="text-[10px] text-slate-500 block mt-1 leading-normal">Practical care tips to redirect sundowning, wandering, or anxiety.</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error notifications block */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-950/20 border border-red-500/25 p-5 rounded-2xl shadow-2xl mb-6 relative overflow-hidden mt-4"
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                  <div className="flex items-start gap-4">
                    <ShieldAlert className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">System Error Logged</h3>
                      <p className="mt-1.5 text-xs text-red-300 leading-relaxed font-semibold">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Display loading screen inside the content stream */}
            {isLoading && !error && (
              <div className="w-full my-auto animate-in fade-in duration-300">
                <LoadingNarrative />
              </div>
            )}

            {/* Display parsed, themed care replies */}
            {response && !isLoading && (
              <div className="w-full flex flex-col space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
                {response.escalation && (
                  <EscalationBadge escalation={response.escalation} />
                )}
                <AgentResponse answer={response.answer} trace={response.trace} />
              </div>
            )}

          </div>
        </div>

        {/* Persistent bottom user panel */}
        <div className="border-t border-slate-800/60 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-6 flex-shrink-0 relative z-20">
          <CaregiverInput onSubmit={handleSubmit} isLoading={isLoading} />
          
          <div className="text-center mt-3 mt-4 text-[10px] text-slate-500 tracking-wide select-none">
            Carey AI is a clinical assistant. Always confirm sudden physiological changes directly with qualified medical staff.
          </div>
        </div>
      </div>

      {/* Sleek Right-side Reasoning timeline trace panel (1/3 width on wide screens) */}
      <div className="w-full lg:w-1/3 flex-shrink-0 h-1/2 lg:h-full border-t lg:border-t-0 border-slate-800/60 lg:border-l relative z-30 overflow-y-auto">
        <ReasoningSidebar 
          trace={response ? response.trace : []} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}

