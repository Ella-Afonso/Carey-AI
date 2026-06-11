"use client";

import React, { useState } from "react";
import { useAuth, Role } from "../../lib/auth";
import { Heart, Activity, User, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, loginWithGoogle, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("caregiver");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickLogin = async (quickEmail: string, quickRole: Role) => {
    setIsSubmitting(true);
    try {
      await login(quickEmail, quickRole);
      router.push("/");
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role) return;
    setIsSubmitting(true);
    try {
      await login(email, role);
      router.push("/");
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400">
          <Activity className="w-5.5 h-5.5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 font-sans relative overflow-hidden items-center justify-center">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/5 filter blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/5 filter blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-blue-500/20 animate-pulse" />
            <Activity className="w-7 h-7 relative z-10" />
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-100">Carey AI</h1>
          <p className="text-slate-400 text-sm mt-2">Secure Care Management Platform</p>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="flex bg-slate-950/50 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => setRole("caregiver")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                role === "caregiver" 
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.1)]" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Caregiver
              </div>
            </button>
            <button
              onClick={() => setRole("senior")}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                role === "senior" 
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" />
                Senior Companion
              </div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                role === "caregiver" 
                  ? "bg-teal-500 hover:bg-teal-400 text-slate-950" 
                  : "bg-blue-500 hover:bg-blue-400 text-slate-950"
              }`}
            >
              {isSubmitting ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                "Secure Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Or
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setIsSubmitting(true);
              try {
                await loginWithGoogle(role);
                router.push("/");
              } catch (e) {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-3 bg-white text-slate-900 hover:bg-slate-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-8 border-t border-slate-800 pt-6">
            <p className="text-xs text-center text-slate-500 mb-4 font-mono uppercase tracking-wider">Hackathon Quick Login</p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleQuickLogin("demo@carey.ai", "caregiver")}
                type="button"
                className="w-full py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 transition-colors flex items-center justify-between px-4"
              >
                <span>Caregiver Demo Account</span>
                <span className="text-teal-400">&rarr;</span>
              </button>
              <button 
                onClick={() => handleQuickLogin("senior@carey.ai", "senior")}
                type="button"
                className="w-full py-2.5 bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 transition-colors flex items-center justify-between px-4"
              >
                <span>Senior Demo Account</span>
                <span className="text-blue-400">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-slate-600 mt-8">
          Encrypted Data Transmission • HIPPA Compliant Architecture
        </p>
      </motion.div>
    </div>
  );
}
