from agent.safety import apply_safety_floor, CLINICIAN_ESCALATION_MESSAGE

def create_mock_trace(history_items, guidance_items=None):
    trace = []
    if history_items:
        trace.append({
            "tool_name": "search_patient_history",
            "normalised_results": history_items
        })
    if guidance_items:
        trace.append({
            "tool_name": "search_general_guidance",
            "normalised_results": guidance_items
        })
    return trace

def test_acute_signal_transition():
    trace = create_mock_trace([
        {"id": "doc1", "severity": 5, "behaviour_tags": ["sudden_confusion", "acute_change"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "urgent"
    assert res["escalation"]["requires_clinician_message"] is True
    assert "doc1" in res["escalation"]["grounded_in"]

def test_chronic_signal_isolation():
    trace = create_mock_trace([
        {"id": "doc2", "severity": 3, "behaviour_tags": ["possible_sundowning_pattern", "agitation"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "monitor"
    assert res["escalation"]["pattern_type"] == "chronic_pattern"
    assert res["escalation"]["requires_clinician_message"] is False

def test_mixed_context_state():
    trace = create_mock_trace([
        {"id": "doc3", "severity": 3, "behaviour_tags": ["agitation"]},
        {"id": "doc4", "severity": 5, "behaviour_tags": ["acute_change"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "urgent"
    assert res["escalation"]["pattern_type"] == "mixed_chronic_and_acute"

def test_target_baseline_pass():
    trace = create_mock_trace([
        {"id": "doc5", "severity": 1, "behaviour_tags": ["calm", "routine"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "none"

def test_verification_of_content_negation():
    trace = create_mock_trace([
        {"id": "doc6", "severity": 1, "behaviour_tags": ["calm"], "raw_note": "She was not confused today and seemed calm."}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "none"

def test_guidance_threshold_restraint():
    trace = create_mock_trace([], [{"id": "g1", "topic_tags": ["red_flag", "delirium"]}])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] != "urgent"

def test_structural_interception():
    trace = create_mock_trace([
        {"id": "doc7", "severity": 5, "behaviour_tags": ["acute_change"]}
    ])
    ans = "I have logged the observation."
    res = apply_safety_floor(ans, trace)
    assert res["escalation"]["escalation_level"] == "urgent"
    assert CLINICIAN_ESCALATION_MESSAGE in res["answer"]

def test_suppress_duplicate_output():
    trace = create_mock_trace([
        {"id": "doc8", "severity": 5, "behaviour_tags": ["acute_change"]}
    ])
    ans = "Please discuss this sudden change with a clinician promptly. This is not a diagnosis."
    res = apply_safety_floor(ans, trace)
    assert res["escalation"]["escalation_level"] == "urgent"
    assert CLINICIAN_ESCALATION_MESSAGE not in res["answer"]
