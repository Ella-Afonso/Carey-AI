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

export async function callCaregiverAgent(message: string, patientId: string = "demo-patient-001"): Promise<AgentResponse> {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (typeof window !== "undefined") {
      const host = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
      url = `http://${host}:8000`;
    } else {
      url = "http://127.0.0.1:8000";
    }
  }

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
