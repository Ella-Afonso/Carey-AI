import os
from enum import Enum
from typing import Final, Set, List, Dict, Any, Optional, TypedDict
import re

class EscalationLevel(str, Enum):
    NONE = "none"
    MONITOR = "monitor"
    URGENT = "urgent"

ACUTE_TAGS: Final[Set[str]] = {
    "sudden_confusion",
    "acute_change",
    "severe_confusion",
    "possible_delirium_or_infection",
    "escalation",
    "fall",
    "falls",
    "dehydration_risk",
    "severe_distress",
}

CHRONIC_PATTERN_TAGS: Final[Set[str]] = {
    "possible_sundowning_pattern",
    "agitation",
    "distress",
    "confusion",
    "disorientation",
    "restlessness",
    "routine_change",
}

GUIDANCE_ESCALATION_TAGS: Final[Set[str]] = {
    "red_flag",
    "escalation",
    "delirium",
    "acute_change",
    "sudden_confusion",
    "clinician_contact",
    "safety",
}

CLINICIAN_ESCALATION_MESSAGE: Final[str] = (
    "Because this includes sudden or severe confusion / acute change, "
    "please discuss this with a clinician promptly, or use urgent care services "
    "if the person seems acutely unwell, unsafe, or significantly different from their usual pattern. "
    "This is not a diagnosis."
)

class EscalationResult(TypedDict):
    escalation_level: str
    pattern_type: str
    reasons: List[str]
    grounded_in: List[str]
    requires_clinician_message: bool
    ui_label: str
    confidence_basis: str

class SafetyFloorOutput(TypedDict):
    answer: str
    escalation: EscalationResult
    history_entries_used: int
    guidance_hits_used: int

def extract_safety_evidence_from_trace(trace: List[Dict[str, Any]]) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    history_entries = []
    guidance_hits = []

    for step in trace:
        tool_name = step.get("tool_name", "")
        
        if tool_name in ["log_new_observation", "search_patient_history"]:
            # Check inputs for logged observation
            if tool_name == "log_new_observation":
                t_args = step.get("input", {})
                history_entries.append({
                    "entry_id": t_args.get("entry_id", "current-turn"),
                    "timestamp": t_args.get("timestamp", ""),
                    "time_of_day": t_args.get("time_of_day", ""),
                    "raw_note": t_args.get("raw_note", ""),
                    "behaviour_tags": t_args.get("behaviour_tags", []),
                    "severity": t_args.get("severity", 1),
                    "synthetic": t_args.get("synthetic", True),
                    "source": t_args.get("source", "caregiver_demo_input")
                })
            
            # Extract from any available output fields for search_patient_history
            for output_key in ["normalised_results", "raw_result", "output_preview"]:
                out = step.get(output_key)
                if isinstance(out, list):
                    for item in out:
                        if isinstance(item, dict) and ("severity" in item or "behaviour_tags" in item):
                            history_entries.append({
                                "entry_id": item.get("entry_id") or item.get("id", ""),
                                "timestamp": item.get("timestamp", ""),
                                "time_of_day": item.get("time_of_day", ""),
                                "raw_note": item.get("raw_note") or item.get("snippet", ""),
                                "behaviour_tags": item.get("behaviour_tags", []),
                                "severity": item.get("severity", 1),
                                "synthetic": item.get("synthetic", False),
                                "source": item.get("source", "")
                            })
                    break

        elif tool_name == "search_general_guidance":
            for output_key in ["normalised_results", "raw_result"]:
                out = step.get(output_key)
                if isinstance(out, list):
                    for item in out:
                        if isinstance(item, dict):
                            guidance_hits.append({
                                "doc_id": item.get("doc_id") or item.get("id", ""),
                                "title": item.get("title", ""),
                                "source": item.get("source", ""),
                                "url": item.get("url", ""),
                                "licence": item.get("licence", ""),
                                "topic_tags": item.get("topic_tags", []),
                                "content": item.get("content") or item.get("snippet", "")
                            })
                    break

    return history_entries, guidance_hits

def classify_escalation(history_entries: List[Dict[str, Any]], guidance_hits: Optional[List[Dict[str, Any]]] = None) -> EscalationResult:
    is_urgent = False
    is_monitor = False
    reasons = []
    grounded_in = []
    
    acute_count = 0
    
    for entry in history_entries:
        tags = set(entry.get("behaviour_tags", []))
        sev = entry.get("severity", 1)
        entry_id = entry.get("entry_id", "unknown")
        
        has_acute_tag = bool(tags.intersection(ACUTE_TAGS))
        has_chronic_tag = bool(tags.intersection(CHRONIC_PATTERN_TAGS))
        has_confusion_or_escalation = any(t in tags for t in ["confusion", "escalation", "acute_change", "sudden_confusion"])
        
        # Urgent Rule
        if has_acute_tag or (sev >= 5 and has_confusion_or_escalation):
            is_urgent = True
            acute_count += 1
            reasons.append(f"Retrieved patient-history entry {entry_id} contains acute_change / sudden_confusion tags with severity {sev}.")
            grounded_in.append(entry_id)
            
        # Monitor Rule
        elif not is_urgent and (has_chronic_tag or 2 <= sev <= 4):
            is_monitor = True
            reasons.append(f"Retrieved patient-history entry {entry_id} contains chronic pattern tags or moderate severity {sev}.")
            grounded_in.append(entry_id)
            
    if acute_count > 1:
        is_urgent = True

    # Guidance Isolation Constraint
    # We do NOT use guidance_hits to autonomously trigger URGENT.
    has_guidance_escalation = False
    if guidance_hits:
        for hit in guidance_hits:
            tags = set(hit.get("topic_tags", []))
            if tags.intersection(GUIDANCE_ESCALATION_TAGS):
                has_guidance_escalation = True
                break

    if is_urgent:
        level = EscalationLevel.URGENT.value
        pattern = "mixed_chronic_and_acute" if is_monitor else "acute_change"
        req_msg = True
        ui = "Urgent: Clinical Escalation"
    elif is_monitor:
        level = EscalationLevel.MONITOR.value
        pattern = "chronic_pattern"
        req_msg = False
        ui = "Monitor: Behavioral Pattern"
    else:
        level = EscalationLevel.NONE.value
        pattern = "none"
        req_msg = False
        ui = "Routine: Benign"
        
    basis = "structured_tags"
    if has_guidance_escalation:
        basis = "structured_tags_and_guidance"
    elif not history_entries:
        basis = "insufficient_evidence"
        
    return {
        "escalation_level": level,
        "pattern_type": pattern,
        "reasons": reasons,
        "grounded_in": list(set(grounded_in)),
        "requires_clinician_message": req_msg,
        "ui_label": ui,
        "confidence_basis": basis
    }

def contains_clinician_message(answer: str) -> bool:
    ans_lower = answer.lower()
    triggers = [
        "discuss with a clinician",
        "contact a clinician",
        "seek urgent medical advice",
        "urgent care",
        "not a diagnosis"
    ]
    return any(t in ans_lower for t in triggers)

def enforce_escalation_message(answer: str, escalation: EscalationResult) -> str:
    if escalation["escalation_level"] == EscalationLevel.URGENT.value and not contains_clinician_message(answer):
        return f"{answer}\n\n{CLINICIAN_ESCALATION_MESSAGE}"
    return answer

def apply_safety_floor(answer: str, trace: List[Dict[str, Any]]) -> SafetyFloorOutput:
    history, guidance = extract_safety_evidence_from_trace(trace)
    escalation = classify_escalation(history, guidance)
    final_ans = enforce_escalation_message(answer, escalation)
    
    # Debug Helper Requirement
    print("\n--- [DEBUG] Safety Floor Trace Analysis ---")
    print(f"Final Escalation Level: {escalation['escalation_level'].upper()}")
    print(f"Pattern Type: {escalation['pattern_type']}")
    print(f"Reasons: {escalation['reasons']}")
    print(f"Grounded In: {escalation['grounded_in']}")
    print("Evidence Records Extracted:")
    for h in history:
        tags = h.get('behaviour_tags', [])
        src = h.get('source', 'unknown')
        if src == "caregiver_demo_input":
            src_label = "logged observation"
        else:
            src_label = "retrieved history"
        print(f" - [{src_label}] Tags: {tags} | Severity: {h.get('severity')} | ID: {h.get('entry_id')}")
    print("-------------------------------------------\n")

    return {
        "answer": final_ans,
        "escalation": escalation,
        "history_entries_used": len(history),
        "guidance_hits_used": len(guidance)
    }
