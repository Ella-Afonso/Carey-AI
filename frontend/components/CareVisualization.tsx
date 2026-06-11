"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

import { PatientData } from "./ReasoningSidebar";

const mockData = [
  { day: "Mon", risk: 20, sleep: 7.5 },
  { day: "Tue", risk: 35, sleep: 6.0 },
  { day: "Wed", risk: 25, sleep: 7.0 },
  { day: "Thu", risk: 50, sleep: 4.5 },
  { day: "Fri", risk: 65, sleep: 4.0 },
  { day: "Sat", risk: 40, sleep: 6.5 },
  { day: "Sun", risk: 30, sleep: 7.5 },
];

const baselineData = [
  { day: "Mon", risk: 10, sleep: 8.0 },
  { day: "Tue", risk: 12, sleep: 7.8 },
  { day: "Wed", risk: 10, sleep: 8.2 },
  { day: "Thu", risk: 15, sleep: 8.0 },
  { day: "Fri", risk: 11, sleep: 8.1 },
  { day: "Sat", risk: 10, sleep: 8.0 },
  { day: "Sun", risk: 10, sleep: 8.0 },
];

interface CareVisualizationProps {
  patient: PatientData;
}

export default function CareVisualization({ patient }: CareVisualizationProps) {
  const chartData = patient.id === "demo-patient-001" ? mockData : baselineData;
  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl mb-6 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-5 h-5 text-teal-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
          Predictive Insights: Agitation Risk vs Sleep ({patient.name})
        </h3>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "12px", color: "#f1f5f9" }}
              itemStyle={{ color: "#2dd4bf" }}
            />
            <Line type="monotone" dataKey="risk" name="Agitation Risk (%)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: "#f43f5e" }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4, fill: "#2dd4bf" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 p-4 bg-teal-950/20 border border-teal-900/50 rounded-2xl">
        <h4 className="text-sm font-semibold text-teal-400 mb-1 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Clinical Interpretation
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          {patient.id === "demo-patient-001" 
            ? "This chart illustrates the correlation between the patient's sleep duration (teal) and their agitation risk / sundowning symptoms (red). Notice how nights with fewer than 5 hours of sleep (e.g., Thursday and Friday) strongly predict a severe spike in agitation risk the following day." 
            : `Predictive insights active for ${patient.name}. Currently visualizing baseline telemetry. As daily logs are submitted to Carey AI, the system will dynamically compile and map sleep patterns against agitation risk.`
          }
        </p>
      </div>
    </div>
  );
}
