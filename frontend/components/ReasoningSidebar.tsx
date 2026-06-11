"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TraceStep } from "../lib/api";
import { Activity, AlertTriangle, Clock, HeartPulse, Music, Phone, Shield, FileText } from "lucide-react";

export interface PatientLogEntry {
  time: string;
  text: string;
  type: "info" | "warning" | "error";
}

export interface PatientData {
  id: string;
  name: string;
  sundowningRisk: string;
  agitationLevel: string;
  fallRisk: string;
  dailyLog: PatientLogEntry[];
  schedule: { id: number; time: string; caregiver: string; status: string }[];
  handoverNotes: string;
}

interface ReasoningSidebarProps {
  trace: TraceStep[];
  isLoading: boolean;
  patient: PatientData | null;
}

export default function ReasoningSidebar({ trace, isLoading, patient }: ReasoningSidebarProps) {
  const [activeModal, setActiveModal] = useState<"protocol" | "incident" | "nurse" | null>(null);
  const [incidentDraft, setIncidentDraft] = useState("");

  // Clear incident draft if patient changes
  useEffect(() => {
    setIncidentDraft("");
  }, [patient?.id]);
  
  if (!patient) {
    return (
      <div className="flex flex-col h-full bg-slate-950/70 border-l border-slate-800/40 backdrop-blur-3xl p-6 sm:p-7 select-none justify-center items-center text-center">
        <Activity className="w-8 h-8 text-slate-600 animate-pulse mb-3" />
        <h2 className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase">
          Telemetry Offline
        </h2>
        <p className="text-[10px] text-slate-500 mt-1 font-sans max-w-[180px]">
          Select or create a patient profile to initialize real-time clinical monitoring.
        </p>
      </div>
    );
  }

  const getRiskBg = (lvl: string) => {
    if (lvl === "HIGH") return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (lvl === "MEDIUM" || lvl === "ELEVATED") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-teal-500/20 text-teal-400 border-teal-500/30";
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border-l border-slate-800/40 backdrop-blur-3xl p-6 sm:p-7 select-none overflow-y-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-widest text-teal-400 uppercase">
            {patient.name}'s Context
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 font-sans">
            Real-time behavioral monitoring
          </p>
        </div>
        
        {/* Status dot */}
        <div className="flex items-center space-x-2 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
          <div className="w-2 h-2 rounded-full bg-teal-500 pulse-glow" />
          <span className="text-[9px] font-mono font-semibold text-slate-300 uppercase leading-none tracking-wider">
            Monitoring
          </span>
        </div>
      </div>

      <div className="space-y-8 min-h-0 flex-1">
        
        {/* Vitals & Risk Gauges */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" /> Current Risk Assessment
          </h3>
          <div className="space-y-3">
            {/* Gauge 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Sundowning Risk</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Late-day confusion & agitation</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRiskBg(patient.sundowningRisk)}`}>
                {patient.sundowningRisk}
              </span>
            </div>
            {/* Gauge 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Agitation Level</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Current emotional distress</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRiskBg(patient.agitationLevel)}`}>
                {patient.agitationLevel}
              </span>
            </div>
            {/* Gauge 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-300">Fall Risk</span>
                <span className="text-[9px] text-slate-500 mt-0.5">Likelihood of losing balance</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getRiskBg(patient.fallRisk)}`}>
                {patient.fallRisk}
              </span>
            </div>
          </div>
        </section>

        {/* Behavioral Timeline */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Daily Behavior Log
          </h3>
          <div className="relative pl-4 space-y-6">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-800" />
            
            {patient.dailyLog.map((log, idx) => {
              const bulletColor = log.type === "error" 
                ? "bg-rose-500/20 border-rose-500" 
                : log.type === "warning"
                  ? "bg-amber-500/20 border-amber-500"
                  : "bg-teal-500/20 border-teal-500";
              const textColor = log.type === "error" 
                ? "text-rose-400" 
                : log.type === "warning"
                  ? "text-amber-400"
                  : "text-teal-400";
              
              return (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full ${bulletColor} border`} />
                  <p className={`text-[10px] font-mono ${textColor} mb-1`}>{log.time}</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{log.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Interventions Toolkit */}
        <section>
          <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" /> Caregiver Toolkit
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.open("https://www.youtube.com/results?search_query=calming+dementia+music+playlist", "_blank")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-colors group"
            >
              <Music className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">Play Calming<br/>Playlist</span>
            </button>
            <button 
              onClick={() => setActiveModal("protocol")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-colors group"
            >
              <FileText className="w-5 h-5 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">De-escalation<br/>Protocol</span>
            </button>
            <button 
              onClick={() => setActiveModal("incident")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-colors group"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">Log Severe<br/>Incident</span>
            </button>
            <button 
              onClick={() => setActiveModal("nurse")}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-colors group"
            >
              <Phone className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">Call On-Duty<br/>Nurse</span>
            </button>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-600">
        <span>Carey UI: v2.0.1</span>
        <span>Secured SSL Panel</span>
      </div>

      {/* Modal Overlays */}
      <AnimatePresence>
        {activeModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl w-full relative">
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
              >
                ✕
              </button>
              
              {activeModal === "protocol" && (
                <div>
                  <h3 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> De-escalation Protocol
                  </h3>
                  <div className="space-y-3 text-[11px] text-slate-300 leading-relaxed">
                    <p><strong className="text-white">1. Maintain Calm:</strong> Use a low, soothing tone. Do not argue or correct their reality.</p>
                    <p><strong className="text-white">2. Validate Feelings:</strong> Say things like "I see you are upset" or "That sounds frustrating."</p>
                    <p><strong className="text-white">3. Distract & Redirect:</strong> Offer a snack, play music, or look at familiar photos.</p>
                    <p><strong className="text-white">4. Ensure Safety:</strong> Remove sharp objects and ensure the exit paths are clear.</p>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="mt-6 w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs text-white transition-colors">Acknowledge</button>
                </div>
              )}

              {activeModal === "incident" && (
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> Log Severe Incident
                  </h3>
                  <p className="text-[11px] text-slate-300 mb-4 leading-relaxed">Are you sure you want to log a severe incident to the patient's medical record?</p>
                  <textarea 
                    value={incidentDraft}
                    onChange={(e) => setIncidentDraft(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 mb-4 focus:outline-none focus:border-amber-500/50 resize-none h-24" 
                    placeholder="Briefly describe what happened..."
                  />
                  <button 
                    onClick={() => {
                      const btn = document.activeElement as HTMLButtonElement;
                      if(btn) btn.innerText = "Logged!";
                      setTimeout(() => setActiveModal(null), 1000);
                    }} 
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold text-xs text-white transition-colors"
                  >
                    Submit to EMR
                  </button>
                </div>
              )}

              {activeModal === "nurse" && (
                <div className="flex flex-col items-center justify-center text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0 rounded-full border border-rose-500 animate-ping opacity-75" />
                    <Phone className="w-8 h-8 text-rose-400 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-2">Calling On-Duty Nurse...</h3>
                  <p className="text-xs text-slate-400 mb-6">Connecting to secure medical line.</p>
                  
                  <button 
                    onClick={() => setActiveModal(null)} 
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold text-xs text-white transition-colors"
                  >
                    End Call
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
