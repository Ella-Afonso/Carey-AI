"use client";

import React from "react";
import { Clock } from "lucide-react";

interface PatternData {
  window: string;
  count: number;
  avg_severity: number;
}

interface TemporalChartProps {
  data: PatternData[];
  dominantWindow?: string | null;
  totalEvents: number;
  patternDetected?: boolean;
}

export default function TemporalChart({ data, dominantWindow, totalEvents, patternDetected }: TemporalChartProps) {
  if (patternDetected === false) {
    return (
      <div className="w-full mt-4 p-5 rounded-xl bg-slate-900/50 border border-slate-800/60 shadow-inner">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-400">Temporal Behaviour Pattern</h4>
        </div>
        <p className="text-xs text-slate-500 italic">
          Not enough log history yet to identify a reliable behavioral pattern.
        </p>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Order the windows logically
  const order = ["morning", "afternoon", "evening", "night"];
  const sortedData = [...data].sort((a, b) => order.indexOf(a.window) - order.indexOf(b.window));

  const maxCount = Math.max(...sortedData.map((d) => d.count), 1);

  return (
    <div className="w-full mt-4 p-5 rounded-xl bg-slate-900/50 border border-slate-800/60 shadow-inner">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-slate-200">Temporal Behaviour Pattern</h4>
      </div>
      
      <div className="space-y-3">
        {sortedData.map((item) => {
          const isDominant = item.window === dominantWindow;
          const percentage = Math.round((item.count / totalEvents) * 100) || 0;
          const widthPercent = Math.round((item.count / maxCount) * 100);

          return (
            <div key={item.window} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className={`capitalize font-medium ${isDominant ? "text-purple-300" : "text-slate-400"}`}>
                  {item.window}
                </span>
                <span className="text-slate-500">
                  {item.count} events ({percentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    isDominant ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" : "bg-slate-600"
                  }`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {dominantWindow && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400 italic">
          Data shows a statistically significant clustering of chronic behavioural events in the <span className="text-purple-300 font-medium">{dominantWindow}</span>. Acute escalations have been isolated from this calculation.
        </div>
      )}
    </div>
  );
}
