"use client";

import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { TraceStep } from "../lib/api";
import { ExternalLink, ClipboardCheck, AlertTriangle, Stethoscope, BookOpen, BrainCircuit, Printer, PhoneCall, Save } from "lucide-react";
import TemporalChart from "./TemporalChart";

interface AgentResponseProps {
  answer: string;
  trace?: TraceStep[];
}

export default function AgentResponse({ answer, trace = [] }: AgentResponseProps) {
  const [isCalling, setIsCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleQuickLog = async (planText: string) => {
    setIsLogging(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/log-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_plan: planText })
      });
      if (response.ok) {
        setIsLogged(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogging(false);
    }
  };

  const handleEmergencyCall = async () => {
    setIsCalling(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/emergency-call`, {
        method: "POST"
      });
      if (response.ok) {
        setCallStatus("Call initiated! Answer your phone.");
      } else {
        setCallStatus("Error calling emergency services.");
      }
    } catch (e) {
      console.error(e);
      setCallStatus("Error calling emergency services.");
    } finally {
      setIsCalling(false);
    }
  };

  // Pre-process to strip out prompt leaks (safety measure)
  const cleanAnswer = useMemo(() => {
    let cleaned = answer;
    const leakPatterns = [
      /you are a helpful ai assistant/i,
      /you are tasked with/i,
      /you are a clinician/i
    ];
    leakPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, "");
    });
    return cleaned;
  }, [answer]);

  // Find temporal pattern data in trace
  const temporalData = useMemo(() => {
    if (!trace) return null;
    const patternStep = trace.find((step: any) => step.tool_name === "detect_temporal_pattern" && step.success);
    if (patternStep && patternStep.results && patternStep.results.pattern_detected !== undefined) {
      return patternStep.results;
    }
    return null;
  }, [trace]);

  // Map doc_ids to real source information for professional citations
  const citationMap = useMemo(() => {
    const map: Record<string, { title: string; source: string; url: string }> = {};
    trace.forEach(step => {
      if (step.normalised_results && Array.isArray(step.normalised_results)) {
        step.normalised_results.forEach(res => {
          if (res.doc_id && res.source && res.url) {
            map[res.doc_id] = {
              title: res.title,
              source: res.source,
              url: res.url
            };
          }
        });
      }
    });
    return map;
  }, [trace]);

  // High-fidelity custom text formatter that parses simple markdown patterns (bold, links, lists)
  const parseClinicalText = (text: string) => {
    // 1. Remove initial section title lines (since they are rendered as card headers)
    const normalized = text.replace(/^(?:###|##|#)\s*.*\n?/i, "").trim();

    // 2. Parse paragraphs and lines
    const lines = normalized.split("\n");
    return lines.map((line, blockIdx) => {
      let trimmed = line.trim();
      if (!trimmed) return null;

      // Handle custom list bullets
      const isBullet = trimmed.startsWith("* ") || trimmed.startsWith("- ");
      if (isBullet) {
        trimmed = trimmed.substring(2);
      }

      // Inline formatter helper (bold, standard links, doc links)
      const formatInline = (segment: string) => {
        // Regex for bold text **word**
        const boldRegex = /\*\*(.*?)\*\*/g;
        // Regex for links [text](href)
        const linkRegex = /\[(.*?)\]\((.*?)\)/g;

        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        // Combined string processing loop
        const textToSearch = segment;
        
        // Simple sequential inline replacement
        let currentText = textToSearch;
        
        // Let's do simple HTML-like rendering of bold tags and links
        const formattedElements: React.ReactNode[] = [];
        let textKey = 0;

        // Locate markup bounds
        let i = 0;
        while (i < currentText.length) {
          if (currentText.startsWith("**", i)) {
            const endIdx = currentText.indexOf("**", i + 2);
            if (endIdx !== -1) {
              formattedElements.push(
                <strong key={textKey++} className="font-semibold text-slate-150">
                  {currentText.substring(i + 2, endIdx)}
                </strong>
              );
              i = endIdx + 2;
              continue;
            }
          }
          
          if (currentText.startsWith("[", i)) {
            const labelEnd = currentText.indexOf("]", i + 1);
            if (labelEnd !== -1 && currentText.charAt(labelEnd + 1) === "(") {
              const hrefEnd = currentText.indexOf(")", labelEnd + 2);
              if (hrefEnd !== -1) {
                const label = currentText.substring(i + 1, labelEnd);
                const href = currentText.substring(labelEnd + 2, hrefEnd);
                
                // Check if this href points to one of our citation documents
                if (citationMap[href]) {
                  const cit = citationMap[href];
                  formattedElements.push(
                    <a
                      key={textKey++}
                      href={cit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 transition-all font-mono text-[10px] font-semibold border border-teal-500/25 ml-1"
                      title={cit.title}
                    >
                      {cit.source}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  );
                } else {
                  formattedElements.push(
                    <a
                      key={textKey++}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-400 font-medium hover:underline inline-flex items-center gap-0.5"
                    >
                      {label}
                      <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  );
                }
                i = hrefEnd + 1;
                continue;
              }
            }
          }

          formattedElements.push(currentText.charAt(i));
          i++;
        }

        return formattedElements;
      };

      if (isBullet) {
        return (
          <div key={blockIdx} className="flex items-start gap-2.5 py-1.5 last:pb-0 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-2 flex-shrink-0 neon-glow-teal animate-pulse" />
            <p className="text-base text-slate-200 leading-relaxed flex-1">
              {formatInline(trimmed)}
            </p>
          </div>
        );
      }

      return (
        <p key={blockIdx} className="text-base text-slate-200 leading-relaxed mb-4 last:mb-0">
          {formatInline(trimmed)}
        </p>
      );
    }).filter(Boolean);
  };

  const parsedSections = useMemo(() => {
    const rawParts = cleanAnswer.split(/(?=###\s|##\s|#\s)/g);
    
    return rawParts.map(part => {
      const trimmed = part.trim();
      if (!trimmed || trimmed === "#" || trimmed === "##" || trimmed === "###") return null;

      // Extract the header title
      const titleMatch = trimmed.match(/^(?:###|##|#)\s+(.*)/);
      const title = titleMatch ? titleMatch[1].trim() : "Triage Summary";

      // If the section only contains the title and no body, skip it
      const bodyText = trimmed.replace(/^(?:###|##|#)\s*.*\n?/i, "").trim();
      if (!bodyText) return null;

      // Detect the best visual theme matching the section type
      let type: "clinical" | "suggest" | "actions" | "safety" | "sources" = "clinical";
      const key = title.toLowerCase();

      if (key.includes("suggest") || key.includes("may mean")) {
        type = "suggest";
      } else if (key.includes("do now") || key.includes("care") || key.includes("actions")) {
        type = "actions";
      } else if (key.includes("escalation") || key.includes("safety") || key.includes("alert")) {
        type = "safety";
      } else if (key.includes("sources") || key.includes("citation")) {
        type = "sources";
      }

      return {
        title,
        content: trimmed,
        type
      };
    }).filter(Boolean);
  }, [cleanAnswer]);

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "suggest":
        return <BrainCircuit className="w-5 h-5 text-purple-400" />;
      case "actions":
        return <ClipboardCheck className="w-5 h-5 text-emerald-400" />;
      case "safety":
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case "sources":
        return <BookOpen className="w-5 h-5 text-teal-400" />;
      default:
        return <Stethoscope className="w-5 h-5 text-teal-400" />;
    }
  };

  const borderStyles = (type: string) => {
    switch (type) {
      case "suggest":
        return "border-purple-550/20 hover:border-purple-550/40 hover:shadow-[0_4px_30px_rgba(147,51,234,0.06)]";
      case "actions":
        return "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_4px_30px_rgba(16,185,129,0.06)]";
      case "safety":
        return "border-red-500/20 hover:border-red-500/40 hover:shadow-[0_4px_30px_rgba(239,68,68,0.06)]";
      default:
        return "border-teal-500/20 hover:border-teal-500/40 hover:shadow-[0_4px_30px_rgba(20,184,166,0.06)]";
    }
  };

  if (!answer) return null;

  return (
    <div className="w-full space-y-5">
      <div className="flex justify-end mb-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white rounded-lg shadow-sm transition-all text-sm font-medium"
        >
          <Printer className="w-4 h-4" />
          Print for Doctor
        </button>
      </div>
      {parsedSections.map((section, idx) => {
        if (!section) return null;

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className={`glass-panel rounded-2xl p-6 sm:p-7 border ${borderStyles(section.type)} transition-all duration-300 relative group overflow-hidden bg-slate-900/35`}
          >
            {/* Soft Ambient glowing flare top-right corner */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 filter blur-2xl transition-all duration-300 group-hover:opacity-15 pointer-events-none ${
              section.type === "suggest" ? "bg-purple-500" :
              section.type === "actions" ? "bg-emerald-500" :
              section.type === "safety" ? "bg-red-500" : "bg-teal-500"
            }`} />

            {/* Section Card Header */}
            <div className="flex items-center gap-3 mb-4 select-none">
              <div className="w-10 h-10 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center shadow-md">
                {getSectionIcon(section.type)}
              </div>
              <h3 className="text-base font-semibold text-slate-100 font-display tracking-tight leading-none">
                {section.title}
              </h3>
            </div>

            {/* Formatted body contents */}
            <div className="relative z-10 pl-[2px] pr-1">
              {parseClinicalText(section.content)}
              
              {/* Usability Actions */}
              {section.type === "safety" && (section.content.toLowerCase().includes("urgent") || section.content.toLowerCase().includes("emergency")) && (
                <div className="mt-5 pt-4 border-t border-red-500/20 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleEmergencyCall}
                    disabled={isCalling}
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all transform hover:scale-[1.02] active:scale-95 w-full sm:w-auto justify-center disabled:opacity-50 disabled:transform-none"
                  >
                    <PhoneCall className={`w-5 h-5 ${isCalling ? 'animate-spin' : 'animate-pulse'}`} />
                    {isCalling ? "Calling..." : callStatus ? callStatus : "Notify Care Team (Automated)"}
                  </button>
                  <a 
                    href="tel:999"
                    className="flex items-center gap-2.5 px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white font-bold rounded-xl shadow-md transition-all transform hover:scale-[1.02] active:scale-95 w-full sm:w-auto justify-center"
                  >
                    <PhoneCall className="w-5 h-5 text-slate-400" />
                    Dial Emergency Services (999)
                  </a>
                </div>
              )}

              {section.type === "actions" && (
                <div className="mt-5 pt-4 border-t border-emerald-500/20">
                  <button 
                    onClick={() => handleQuickLog(section.content)}
                    disabled={isLogging || isLogged}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg font-medium transition-all w-full sm:w-auto justify-center disabled:opacity-50 disabled:bg-emerald-500/20"
                  >
                    <Save className="w-4 h-4" />
                    {isLogging ? "Logging..." : isLogged ? "Logged Successfully!" : "Quick Log this Action Plan"}
                  </button>
                </div>
              )}

              {/* Inject Temporal Chart natively into the 'suggest' block if data exists */}
              {section.type === "suggest" && temporalData && (
                <TemporalChart 
                  data={temporalData.breakdown || []} 
                  dominantWindow={temporalData.dominant_window}
                  totalEvents={temporalData.chronic_events_count || 0}
                  patternDetected={temporalData.pattern_detected}
                />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
