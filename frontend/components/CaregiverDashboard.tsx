/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect } from "react";
import CaregiverInput from "../components/CaregiverInput";
import EscalationBadge from "../components/EscalationBadge";
import AgentResponse from "../components/AgentResponse";
import ReasoningSidebar, { PatientData } from "../components/ReasoningSidebar";
import LoadingNarrative from "../components/LoadingNarrative";
import { callCaregiverAgent, AgentResponse as AgentResponseType } from "../lib/api";
import { Activity, ShieldAlert, Heart, Calendar, ArrowUpRight, CheckCircle2, User, LogOut, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CareVisualization from "./CareVisualization";
import CrmSchedule from "./CrmSchedule";
import { useAuth } from "../lib/auth";

const demoPatient: PatientData = {
  id: "demo-patient-001",
  name: "John Doe",
  sundowningRisk: "HIGH",
  agitationLevel: "ELEVATED",
  fallRisk: "LOW",
  dailyLog: [
    { time: "08:00 AM", text: "Ate full breakfast and took morning medications without resistance.", type: "info" },
    { time: "10:30 AM", text: "Asked for \"mom\" repeatedly. Successfully redirected with family photo album.", type: "info" },
    { time: "02:15 PM", text: "Pacing in the hallway. Expressed desire to \"go home\". Restless.", type: "warning" },
  ],
  schedule: [
    { id: 1, time: "Today, 8:00 AM - 4:00 PM", caregiver: "Sarah J.", status: "covered" },
    { id: 2, time: "Today, 4:00 PM - 12:00 AM", caregiver: "Mike T.", status: "covered" },
    { id: 3, time: "Tomorrow, 12:00 AM - 8:00 AM", caregiver: "Unassigned", status: "open" },
  ],
  handoverNotes: "Patient had a good morning but became slightly agitated around 3 PM. Refused afternoon snack. Needs monitoring for sundowning."
};

export default function CaregiverDashboard() {
  const { user, logout } = useAuth();
  const [activePatient, setActivePatient] = useState<PatientData | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSundowning, setNewSundowning] = useState("LOW");
  const [newFall, setNewFall] = useState("LOW");
  const [newAgitation, setNewAgitation] = useState("NORMAL");

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AgentResponseType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasReportedAtLeastOnce, setHasReportedAtLeastOnce] = useState(false);

  const [savedPatient, setSavedPatient] = useState<PatientData | null>(null);

  useEffect(() => {
    // Automatically load sandbox for demo account, otherwise load from localStorage or prompt select/create
    if (user?.email === "demo@carey.ai" || !user?.email) {
      setActivePatient(demoPatient);
    } else {
      const stored = localStorage.getItem(`carey_active_patient_${user.email}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setActivePatient(parsed);
          setSavedPatient(parsed);
        } catch (e) {
          console.error("Error loading patient from localStorage:", e);
        }
      }
    }
  }, [user]);

  // Persist custom patient to localStorage
  useEffect(() => {
    if (user?.email && user.email !== "demo@carey.ai" && activePatient) {
      localStorage.setItem(`carey_active_patient_${user.email}`, JSON.stringify(activePatient));
      setSavedPatient(activePatient);
    }
  }, [activePatient, user]);

  // Persist triage response to localStorage so it doesn't disappear when navigating back
  useEffect(() => {
    const key = `carey_active_response_${user?.email || 'demo'}`;
    const storedRes = localStorage.getItem(key);
    if (storedRes && !response && !hasReportedAtLeastOnce) {
      try {
        setResponse(JSON.parse(storedRes));
      } catch(e) {}
    }
  }, [user]);

  useEffect(() => {
    const key = `carey_active_response_${user?.email || 'demo'}`;
    if (response) {
      localStorage.setItem(key, JSON.stringify(response));
    } else if (response === null && hasReportedAtLeastOnce) {
      localStorage.removeItem(key);
    }
  }, [response, user, hasReportedAtLeastOnce]);

  // Real-time synchronization with Senior Workspace events via localStorage broadcast
  useEffect(() => {
    const handleSyncTrigger = (e: StorageEvent) => {
      if (e.key === "carey_sync_log_trigger" && e.newValue) {
        try {
          const syncData = JSON.parse(e.newValue);
          if (activePatient) {
            setActivePatient(prev => {
              if (!prev) return null;
              if (prev.dailyLog.some(l => l.text === syncData.text && l.time === syncData.time)) {
                return prev;
              }
              return {
                ...prev,
                dailyLog: [...prev.dailyLog, { time: syncData.time, text: syncData.text, type: syncData.type }],
                agitationLevel: syncData.severity >= 4 ? "ELEVATED" : prev.agitationLevel,
                sundowningRisk: syncData.severity >= 4 ? "HIGH" : prev.sundowningRisk
              };
            });
          }
        } catch (err) {
          console.error("Error parsing sync log trigger:", err);
        }
      }
    };
    window.addEventListener("storage", handleSyncTrigger);
    return () => window.removeEventListener("storage", handleSyncTrigger);
  }, [activePatient]);

  useEffect(() => {
    const handlePopState = () => {
      setResponse(null);
      setError(null);
      setIsLoading(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleCreatePatient = () => {
    if (!newName.trim()) return;
    const created: PatientData = {
      id: "patient-" + Date.now(),
      name: newName,
      sundowningRisk: newSundowning,
      agitationLevel: newAgitation,
      fallRisk: newFall,
      dailyLog: [
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: "Patient profile initialized.", type: "info" }
      ],
      schedule: [
        { id: 1, time: "Today, 8:00 AM - 4:00 PM", caregiver: "Unassigned", status: "open" },
      ],
      handoverNotes: "No handover notes recorded yet."
    };
    setActivePatient(created);
    setSavedPatient(created);
    setShowCreateForm(false);
    setNewName("");
    setResponse(null);
    setError(null);
  };

  const handleSubmit = async (message: string) => {
    if (!response && !isLoading) {
      window.history.pushState({ view: 'agent-response' }, "");
    }
    
    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Live update behavioral timeline in UI with user's observation
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isCrisis = anyCrisisKeyword(message);
    
    if (activePatient) {
      const updatedLog = [
        ...activePatient.dailyLog,
        { time: timeStr, text: message, type: isCrisis ? "error" : "info" as any }
      ];
      setActivePatient({
        ...activePatient,
        dailyLog: updatedLog,
        agitationLevel: isCrisis ? "ELEVATED" : activePatient.agitationLevel
      });
    }

    try {
      const res = await callCaregiverAgent(message, activePatient?.id || "demo-patient-001");
      setResponse(res);
      setHasReportedAtLeastOnce(true);

      // Reactively adjust risk assessment based on AI safety triage findings
      if (res.escalation && activePatient) {
        const esc = res.escalation.escalation_level;
        setActivePatient(prev => {
          if (!prev) return null;
          return {
            ...prev,
            sundowningRisk: esc === "urgent" ? "HIGH" : esc === "monitor" ? "MEDIUM" : prev.sundowningRisk,
            agitationLevel: esc === "urgent" ? "ELEVATED" : esc === "monitor" ? "ELEVATED" : prev.agitationLevel,
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      setError("Unable to process the care plan right now. If your patient is in danger or needs immediate medical intervention, dial emergency services immediately.");
    } finally {
      setIsLoading(false);
    }
  };

  const anyCrisisKeyword = (msg: string) => {
    const keywords = ["fall", "fell", "bleed", "blood", "fever", "delirium", "pain", "choking", "breathing", "hit", "strike", "aggress"];
    return keywords.some(k => msg.toLowerCase().includes(k));
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-hidden print:h-auto print:w-full print:overflow-visible print:block text-slate-100 font-sans bg-slate-950 print:bg-slate-950">
      {/* Background radial spotlight visual rings */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 filter blur-[120px] pointer-events-none" />

      {/* Main interactive left workspace (2/3 width on large desktops) */}
      <div className="flex-1 lg:w-2/3 flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible relative z-10 print:float-left print:w-[65%]">
        
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
              <span className="font-mono text-[10px] text-slate-300 font-semibold uppercase">{user?.email || "Caregiver"}</span>
            </div>
            {activePatient && (
              <button 
                onClick={() => {
                  setActivePatient(null);
                  setResponse(null);
                  setError(null);
                }}
                className="flex items-center gap-1 px-2.5 text-slate-300 text-[10px] uppercase font-mono tracking-wide bg-slate-800 hover:bg-slate-700 py-1 rounded-xl transition-colors"
              >
                Change Patient
              </button>
            )}
            <div className="w-px h-6 bg-slate-800 mx-1"></div>
            <button 
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-[10px] font-semibold text-rose-300 transition-all uppercase font-mono tracking-wide"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto print:overflow-visible print:h-auto px-6 py-6 scroll-smooth flex flex-col min-h-0 bg-slate-950/20">
          <div className="flex-1 w-full max-w-3.5xl mx-auto flex flex-col justify-center">
            
            <AnimatePresence mode="wait">
              {!activePatient && !showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-2xl text-center shadow-2xl"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6">
                    <User className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100 font-display">Select or Create Patient Profile</h2>
                  <p className="text-slate-400 text-xs mt-2 mb-8 leading-relaxed max-w-md mx-auto">
                    To begin safety monitoring and schedule verification, load the preconfigured John Doe clinical sandbox, or register a new patient.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                    <button
                      onClick={() => {
                        setActivePatient(savedPatient || demoPatient);
                        setResponse(null);
                        setError(null);
                      }}
                      className="flex flex-col items-start p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/50 hover:bg-slate-800/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="font-bold text-slate-200 text-sm">
                        {savedPatient ? `Load Saved Patient (${savedPatient.name})` : "Load Demo Sandbox"}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        {savedPatient 
                          ? `Continue clinical session for ${savedPatient.name} with saved logs and schedules.`
                          : "Pre-populated with John Doe's behavioral logs, sundowning risks, and shift patterns."}
                      </span>
                    </button>

                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="flex flex-col items-start p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-105 transition-transform">
                        <PlusCircle className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-200 text-sm">Create Patient Profile</span>
                      <span className="text-[11px] text-slate-400 mt-1">Initialize a clean workspace for a new patient profile and configure custom schedules.</span>
                    </button>
                  </div>

                  {savedPatient && (
                    <button
                      onClick={() => {
                        setActivePatient(demoPatient);
                        setResponse(null);
                        setError(null);
                      }}
                      className="mt-6 text-xs text-teal-400 hover:text-teal-300 font-mono font-bold uppercase tracking-wider transition-colors hover:underline"
                    >
                      Need to test? Load Demo Sandbox (John Doe) &rarr;
                    </button>
                  )}
                </motion.div>
              )}

              {!activePatient && showCreateForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative"
                >
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
                    <Heart className="w-5 h-5 text-purple-400" /> New Patient Profile
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1.5">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alice Smith"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-0.5">Sundowning Risk</label>
                        <p className="text-[9px] text-slate-500 mb-1.5 leading-tight">Increased confusion or agitation in the late afternoon and evening.</p>
                        <select
                          value={newSundowning}
                          onChange={(e) => setNewSundowning(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-0.5">Fall Risk</label>
                        <p className="text-[9px] text-slate-500 mb-1.5 leading-tight">Likelihood of the patient losing balance or experiencing a fall.</p>
                        <select
                          value={newFall}
                          onChange={(e) => setNewFall(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold text-xs transition-colors border border-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePatient}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition-colors"
                    >
                      Create Profile
                    </button>
                  </div>
                </motion.div>
              )}

              {activePatient && !isLoading && !error && !response && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.5 }}
                  className="py-6 w-full max-w-4xl mx-auto"
                >
                  <CareVisualization patient={activePatient} />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                    <CrmSchedule shifts={activePatient.schedule} patientName={activePatient.name} />
                    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <User className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
                          Shift Handover Notes ({activePatient.name})
                        </h3>
                      </div>
                      <textarea 
                        className="flex-1 w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-purple-500/50 resize-none min-h-[120px]"
                        placeholder="Leave notes for the next caregiver..."
                        value={activePatient.handoverNotes}
                        onChange={(e) => setActivePatient({ ...activePatient, handoverNotes: e.target.value })}
                      />
                      <button 
                        className="mt-4 w-full bg-purple-500/20 text-purple-300 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-500/30 transition-colors border border-purple-500/30"
                        onClick={(e) => { 
                          e.currentTarget.innerText = "Notes Saved to EMR!"; 
                          const target = e.currentTarget;
                          setTimeout(() => { target.innerText = "Save Handover Log" }, 2000);
                          if (user?.email && user.email !== "demo@carey.ai" && activePatient) {
                            localStorage.setItem(`carey_active_patient_${user.email}`, JSON.stringify(activePatient));
                          }
                        }}
                      >
                        Save Handover Log
                      </button>
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
                  <button 
                    onClick={() => setError(null)}
                    className="absolute top-3 right-4 text-red-500 hover:text-red-400 text-lg font-bold"
                  >
                    ✕
                  </button>
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
                <button 
                  onClick={() => { 
                    setResponse(null); 
                    setError(null); 
                    window.history.back(); 
                  }}
                  className="self-start text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-teal-400 flex items-center gap-1.5 transition-all bg-slate-900 border border-slate-800 hover:bg-slate-800 px-4 py-2 rounded-xl hover:shadow-[0_0_15px_rgba(45,212,191,0.15)] hover:border-teal-500/30 -mb-2"
                >
                  <span className="text-sm leading-none">←</span> Return to Patient Overview
                </button>
                {response.escalation && (
                  <EscalationBadge escalation={response.escalation} />
                )}
                <AgentResponse answer={response.answer} trace={response.trace} />
              </div>
            )}

          </div>
        </div>

        {/* Persistent bottom user panel */}
        <div className="border-t border-slate-800/60 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent p-6 flex-shrink-0 relative z-20 print:hidden">
          <CaregiverInput onSubmit={handleSubmit} isLoading={isLoading || !activePatient} />
          
          <div className="text-center mt-3 mt-4 text-[10px] text-slate-500 tracking-wide select-none">
            Carey AI is a clinical assistant. Always confirm sudden physiological changes directly with qualified medical staff.
          </div>
        </div>
      </div>

      {/* Sleek Right-side Reasoning timeline trace panel (1/3 width on wide screens) */}
      <div className="w-full lg:w-1/3 flex-shrink-0 h-1/2 lg:h-full print:h-auto print:overflow-visible border-t lg:border-t-0 border-slate-800/60 lg:border-l relative z-30 overflow-y-auto print:float-right print:w-[33%] print:ml-[2%]">
        <ReasoningSidebar 
          trace={response ? response.trace : []} 
          isLoading={isLoading} 
          patient={activePatient}
        />
      </div>
    </div>
  );
}

