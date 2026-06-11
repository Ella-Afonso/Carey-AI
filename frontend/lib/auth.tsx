"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { auth } from "./firebase";

// Only use Firebase if we have the config successfully initialized
const isFirebaseConfigured = !!auth;

export type Role = "caregiver" | "senior" | null;

export interface AppUser {
  uid: string;
  email: string;
  role: Role;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, role: Role) => Promise<void>;
  loginWithGoogle: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isFirebaseConfigured) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser && fbUser.email) {
          // In this hackathon context, we will infer role from localstorage when using Firebase.
          const storedRole = localStorage.getItem("carey_user_role") as Role;
          setUser({ uid: fbUser.uid, email: fbUser.email, role: storedRole || "caregiver" });
        } else {
          const mockUser = localStorage.getItem("carey_mock_user");
          if (mockUser) {
            setUser(JSON.parse(mockUser));
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Fallback Mock System
      const mockUser = localStorage.getItem("carey_mock_user");
      if (mockUser) {
        setUser(JSON.parse(mockUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, role: Role) => {
    setLoading(true);
    try {
      // If using a demo account, always bypass Firebase to ensure it works instantly
      if (isFirebaseConfigured && email !== "demo@carey.ai" && email !== "senior@carey.ai") {
        await signInWithEmailAndPassword(auth, email, "Hackathon123!");
        localStorage.setItem("carey_user_role", role || "caregiver");
      } else {
        // Fallback Mock Login
        const mockU = { uid: "mock-" + Date.now(), email, role };
        localStorage.setItem("carey_mock_user", JSON.stringify(mockU));
        setUser(mockU);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (role: Role) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        // Set role BEFORE opening popup so onAuthStateChanged picks it up correctly
        localStorage.setItem("carey_user_role", role || "caregiver");
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } else {
        // Fallback Mock Login
        const mockU = { uid: "mock-google-" + Date.now(), email: "demo.user@gmail.com", role };
        localStorage.setItem("carey_mock_user", JSON.stringify(mockU));
        setUser(mockU);
      }
    } catch (e) {
      console.error("Google login error", e);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem("carey_user_role");
    localStorage.removeItem("carey_mock_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
