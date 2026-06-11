"use client";

import React from "react";
import RouteGuard from "../components/RouteGuard";
import { useAuth } from "../lib/auth";
import CaregiverDashboard from "../components/CaregiverDashboard";
import SeniorWorkspace from "../components/SeniorWorkspace";
import { LogOut } from "lucide-react";

export default function RootPage() {
  const { user, logout } = useAuth();

  return (
    <RouteGuard>

      {user?.role === "caregiver" ? <CaregiverDashboard /> : <SeniorWorkspace />}
    </RouteGuard>
  );
}
