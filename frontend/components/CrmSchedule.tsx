"use client";

import React, { useState } from "react";
import { Calendar, Users, AlertCircle } from "lucide-react";

interface CrmScheduleProps {
  shifts: { id: number; time: string; caregiver: string; status: string }[];
  patientName: string;
}

export default function CrmSchedule({ shifts, patientName }: CrmScheduleProps) {
  const [requestedShift, setRequestedShift] = useState<number | null>(null);
  const [coveredShifts, setCoveredShifts] = useState<Set<number>>(new Set());

  const handleRequestCover = (id: number) => {
    setRequestedShift(id);
    // Simulate finding cover over 2.5 seconds
    setTimeout(() => {
      setCoveredShifts(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setRequestedShift(null);
    }, 2500);
  };

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
          Self-Updating CRM: Shift Schedule
        </h3>
      </div>
      <div className="space-y-3">
        {shifts.map((shift) => {
          const isCovered = coveredShifts.has(shift.id);
          const currentStatus = isCovered ? 'covered' : shift.status;
          const currentCaregiver = isCovered ? 'Sarah J. (Agency Cover)' : shift.caregiver;
          const isOpen = currentStatus === 'open';

          return (
            <div key={shift.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors duration-500 ${isOpen ? 'bg-rose-950/20 border-rose-900/50' : 'bg-slate-950/60 border-slate-800'}`}>
              <div className="flex items-center gap-3">
                {isOpen ? <AlertCircle className="w-5 h-5 text-rose-400" /> : <Users className={`w-5 h-5 ${isCovered ? 'text-emerald-400' : 'text-slate-500'}`} />}
                <div>
                  <p className="text-sm font-medium text-slate-200">{shift.time}</p>
                  <p className={`text-xs ${isOpen ? 'text-rose-400 font-bold' : isCovered ? 'text-emerald-400 font-medium' : 'text-slate-500'}`}>
                    {currentCaregiver}
                  </p>
                </div>
              </div>
              {isOpen && (
                <button 
                  onClick={() => handleRequestCover(shift.id)}
                  disabled={requestedShift === shift.id}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors border ${
                    requestedShift === shift.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 cursor-wait animate-pulse'
                      : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/30'
                  }`}
                >
                  {requestedShift === shift.id ? 'Finding Cover...' : 'Request Shift Cover'}
                </button>
              )}
              {isCovered && (
                <span className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                  Cover Secured
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
