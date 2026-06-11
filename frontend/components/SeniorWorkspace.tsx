"use client";

import React, { useState, useEffect, useRef } from "react";
import { Heart, Activity, CheckCircle2, User, Send, Calendar, LogOut, Mic, Volume2, VolumeX, Trash2, Plus, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { callSeniorAgent, getApiUrl } from "../lib/api";
import { useAuth } from "../lib/auth";

interface Reminder {
  id: string;
  time: string;
  text: string;
}

const defaultReminders: Reminder[] = [
  { id: "rem-1", time: "8:00 AM", text: "Take morning vitamins" },
  { id: "rem-2", time: "12:30 PM", text: "Drink a glass of water" }
];

export default function SeniorWorkspace() {
  const { user, logout } = useAuth();
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hello! I am Carey, your companion. How are you feeling today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [callSent, setCallSent] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isEmergencyStatus, setIsEmergencyStatus] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newRemTime, setNewRemTime] = useState("");
  const [newRemText, setNewRemText] = useState("");

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  // Load reminders bound to user email on mount/login
  useEffect(() => {
    if (user?.email) {
      const key = `carey_reminders_${user.email}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setReminders(JSON.parse(stored));
        } catch {
          setReminders([]);
        }
      } else {
        if (user.email === "senior@carey.ai" || user.email === "demo@carey.ai") {
          setReminders(defaultReminders);
          localStorage.setItem(key, JSON.stringify(defaultReminders));
        } else {
          setReminders([]);
        }
      }
    }
  }, [user]);

  const saveReminders = (newRems: Reminder[]) => {
    setReminders(newRems);
    if (user?.email) {
      localStorage.setItem(`carey_reminders_${user.email}`, JSON.stringify(newRems));
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please try Chrome.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    
    finalTranscriptRef.current = input + (input && !input.endsWith(' ') ? ' ' : '');
    
    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let newFinalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          newFinalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (newFinalTranscript) {
        finalTranscriptRef.current += newFinalTranscript;
      }
      
      setInput(finalTranscriptRef.current + interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  const handleCallCaregiver = async () => {
    setIsCalling(true);
    try {
      const url = getApiUrl();
      await fetch(`${url}/api/emergency-call`, { method: "POST" });
      setCallSent(true);
      setTimeout(() => setCallSent(false), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setIsLoading(true);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // CHECK FOR CLINICAL ESCALATION / DISTRESS KEYWORDS SEMANTICALLY
    let isEmergency = false;
    const apiBaseUrl = getApiUrl();
    try {
        const intentRes = await fetch(`${apiBaseUrl}/analyze-intent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userMsg })
        });
        const intentData = await intentRes.json();
        isEmergency = intentData.is_distress;
    } catch(e) {
        isEmergency = false;
    }
    
    // Deterministic override for the hackathon demo script
    const lowerMsg = userMsg.toLowerCase();
    if (["scared", "fear", "fell", "fall", "hurt", "pain", "confused", "afraid", "dizzy", "bleeding", "emergency", "swallow", "choke", "pill"].some(w => lowerMsg.includes(w))) {
        isEmergency = true;
    }

    if (isEmergency) {
      setIsEmergencyStatus(true);
      if (!isMuted && 'speechSynthesis' in window) {
        const alertUtterance = new SpeechSynthesisUtterance("Alert. Calling your caregiver and health team about this situation.");
        window.speechSynthesis.speak(alertUtterance);
      }
      setTimeout(() => setIsEmergencyStatus(false), 12000);

      // 1. Trigger automated Twilio voice call to caregiver
      fetch(`${apiBaseUrl}/api/emergency-call`, { method: "POST" }).catch(e => console.error(e));
      
      // 2. Log high-severity observation in backend Elasticsearch
      fetch(`${apiBaseUrl}/tools/log_new_observation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: "demo-patient-001",
          raw_note: `ALERT: Patient expressed distress: "${userMsg}"`,
          behaviour_tags: ["senior_alert", "agitation", "escalation"],
          severity: 5
        })
      }).catch(e => console.error(e));

      // 3. Trigger GitLab Incident
      fetch(`${apiBaseUrl}/api/trigger-gitlab-incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      }).catch(e => console.error(e));

      // 3. Fire local storage synchronization directly for cross-tab persistence
      if (user?.email) {
        const activeKey = `carey_active_patient_${user.email}`;
        const storedPatient = localStorage.getItem(activeKey);
        if (storedPatient) {
           try {
               const pData = JSON.parse(storedPatient);
               const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
               pData.dailyLog.push({ time: nowStr, text: `ALERT: Patient expressed distress: "${userMsg}"`, type: "error" });
               pData.agitationLevel = "ELEVATED";
               pData.sundowningRisk = "HIGH";
               localStorage.setItem(activeKey, JSON.stringify(pData));
               
               // Also broadcast for same-tab updates
               localStorage.setItem("carey_sync_log_trigger", JSON.stringify({
                 patient_id: pData.id,
                 time: nowStr,
                 text: `ALERT: Patient expressed distress: "${userMsg}"`,
                 type: "error",
                 severity: 5
               }));
               setTimeout(() => localStorage.removeItem("carey_sync_log_trigger"), 150);
           } catch(e) {}
        }
      }
    }

    try {
      const url = getApiUrl();
      const response = await fetch(`${url}/api/senior-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let firstChunkReceived = false;
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        
        fullResponse += chunk;

        if (!firstChunkReceived) {
          firstChunkReceived = true;
          setIsLoading(false);
          setMessages(prev => [...prev, { role: "assistant", content: chunk }]);
        } else {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              content: newMessages[lastIndex].content + chunk
            };
            return newMessages;
          });
        }
      }
        
      if (!isMuted && 'speechSynthesis' in window && fullResponse.trim()) {
        const utterance = new SpeechSynthesisUtterance(fullResponse);
        const voices = window.speechSynthesis.getVoices();
        let bestVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Google UK English Female"));
        if (!bestVoice) bestVoice = voices.find(v => v.name.includes("Google") && v.lang.includes("en"));
        if (!bestVoice) bestVoice = voices.find(v => (v.name.includes("Natural") || v.name.includes("Online")) && v.lang.includes("en"));
        if (!bestVoice) bestVoice = voices.find(v => v.lang.includes("en"));
        
        if (bestVoice) {
          utterance.voice = bestVoice;
        }
        
        utterance.pitch = 1.0; 
        utterance.rate = 0.95;

        window.speechSynthesis.speak(utterance);
      }

    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I am having a little trouble connecting, but I am still here for you." }]);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden">
      {/* Soft lighting for seniors */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 filter blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/60 bg-slate-900/40 backdrop-blur-md px-6 py-6 flex-shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-100 leading-none">
              Carey Companion
            </h1>
            <p className="text-sm text-blue-400 mt-1 font-medium tracking-wide">
              Always here for you
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-sm text-slate-200">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <button 
            onClick={() => {
              if (!isMuted && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              setIsMuted(!isMuted);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 transition-all uppercase font-mono tracking-wide"
            title={isMuted ? "Unmute Carey" : "Mute Carey"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-300 transition-all uppercase font-mono tracking-wide"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Main content split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10 max-w-7xl w-full mx-auto p-4 gap-6">
        
        {/* Left Side: Reminders & Vitals */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex flex-col max-h-[500px]">
            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="text-teal-400 w-6 h-6" /> Daily Reminders
            </h2>
            
            {/* List of Reminders */}
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {reminders.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-sans">
                  No reminders configured. Use the form below to add reminders.
                </div>
              ) : (
                reminders.map((rem) => (
                  <div key={rem.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all">
                    <div>
                      <span className="text-sm text-teal-400 font-bold block">{rem.time}</span>
                      <span className="text-lg text-slate-200 font-medium">{rem.text}</span>
                    </div>
                    <button
                      onClick={() => {
                        const filtered = reminders.filter(r => r.id !== rem.id);
                        saveReminders(filtered);
                      }}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all opacity-100"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Input Form */}
            <div className="mt-4 pt-4 border-t border-slate-850 space-y-3 flex-shrink-0">
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Configure Reminders</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 8:00 AM"
                  value={newRemTime}
                  onChange={(e) => setNewRemTime(e.target.value)}
                  className="w-1/3 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50"
                />
                <input
                  type="text"
                  placeholder="e.g. Take morning vitamins"
                  value={newRemText}
                  onChange={(e) => setNewRemText(e.target.value)}
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newRemTime.trim() || !newRemText.trim()) return;
                  const newReminder: Reminder = {
                    id: "rem-" + Date.now(),
                    time: newRemTime.trim(),
                    text: newRemText.trim()
                  };
                  saveReminders([...reminders, newReminder]);
                  setNewRemTime("");
                  setNewRemText("");
                }}
                className="w-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Reminder
              </button>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl flex-1 flex flex-col justify-center items-center text-center">
             <User className="w-16 h-16 text-slate-600 mb-4" />
             <h3 className="text-lg text-slate-300 font-medium mb-2">Need help from your caregiver?</h3>
             <button 
               onClick={handleCallCaregiver}
               disabled={isCalling || callSent}
               className={`border px-6 py-3 rounded-full font-bold text-lg transition-all w-full ${
                 callSent 
                   ? "bg-teal-500/20 border-teal-500/50 text-teal-300" 
                   : "bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/50 text-rose-300"
               }`}
             >
               {isCalling ? "Calling..." : callSent ? "Caregiver Notified!" : "Call Caregiver"}
             </button>
          </div>
        </div>

        {/* Right Side: Chat Interface */}
        <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <AnimatePresence>
              {isEmergencyStatus && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -20 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  className="bg-rose-600/90 border border-rose-500 rounded-2xl p-4 text-white font-bold text-center flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(225,29,72,0.4)]"
                >
                  <AlertTriangle className="w-7 h-7 animate-pulse text-rose-200" />
                  <span className="text-xl">ALERT: Contacting your caregiver and clinical team about this situation...</span>
                </motion.div>
              )}
            </AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className={`max-w-[80%] p-5 rounded-3xl text-lg ${
                  msg.role === "assistant" 
                    ? "bg-slate-800/80 text-slate-200 border border-slate-700 rounded-tl-sm" 
                    : "bg-blue-600/90 text-white rounded-tr-sm"
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-slate-800/80 p-5 rounded-3xl border border-slate-700 rounded-tl-sm text-slate-400 flex items-center gap-3">
                  <Activity className="w-5 h-5 animate-pulse" /> Carey is thinking...
                </div>
              </motion.div>
            )}
          </div>
          
          <div className="p-4 bg-slate-950/80 border-t border-slate-800">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type or speak your message here..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`p-4 rounded-2xl transition-colors flex items-center justify-center w-16 border ${
                  isListening 
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                }`}
                title="Speak your message"
              >
                <Mic className="w-7 h-7" />
              </button>
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-16"
              >
                <Send className="w-7 h-7" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
