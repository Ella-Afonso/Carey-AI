export interface TraceStep {
  step: number;
  tool_name: string;
  tool_type: string;
  called_via_mcp: boolean;
  planner_mode: string;
  input: any;
  output_preview: string;
  success: boolean;
  error: string | null;
  duration_ms: number;
  normalised_results?: any[];
  results?: any;
}

export interface EscalationResult {
  escalation_level: "urgent" | "monitor" | "none";
  reasons: string[];
  requires_clinician_message: boolean;
}

export interface AgentResponse {
  answer: string;
  trace: TraceStep[];
  tool_call_counts: {
    mcp: number;
    local: number;
  };
  mcp_gate_verified: boolean;
  planner_mode: string;
  escalation: EscalationResult;
  safety_floor_applied: boolean;
}

export function getApiUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url || url === "undefined" || url.startsWith("$")) {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "http://127.0.0.1:8000";
      } else if (hostname.includes("caregiver-frontend-")) {
        return `https://${hostname.replace("caregiver-frontend-", "caregiver-backend-")}`;
      } else {
        return "https://caregiver-backend-712720275940.europe-west2.run.app";
      }
    } else {
      return "https://caregiver-backend-712720275940.europe-west2.run.app";
    }
  }
  return url;
}

export async function callCaregiverAgent(message: string, patientId: string = "demo-patient-001"): Promise<AgentResponse> {
  const url = getApiUrl();
  const response = await fetch(`${url}/api/caregiver-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, patient_id: patientId }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export async function callSeniorAgent(message: string): Promise<{ answer: string }> {
  const url = getApiUrl();
  const response = await fetch(`${url}/api/senior-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}
