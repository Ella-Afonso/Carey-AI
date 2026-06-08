import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agent.safety import apply_safety_floor, CLINICIAN_ESCALATION_MESSAGE

def create_mock_trace(history_items, guidance_items=None):
    trace = []
    if history_items:
        # Wrap as if from search_patient_history normalized_results
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

def test_1_acute_signal_transition():
    trace = create_mock_trace([
        {"id": "doc1", "severity": 5, "behaviour_tags": ["sudden_confusion", "acute_change"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "urgent", "Test 1 Failed"
    assert res["escalation"]["requires_clinician_message"] == True, "Test 1 Failed"
    assert "doc1" in res["escalation"]["grounded_in"], "Test 1 Failed"
    print("Test 1 Passed")

def test_2_chronic_signal_isolation():
    trace = create_mock_trace([
        {"id": "doc2", "severity": 3, "behaviour_tags": ["possible_sundowning_pattern", "agitation"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "monitor", "Test 2 Failed"
    assert res["escalation"]["pattern_type"] == "chronic_pattern", "Test 2 Failed"
    assert res["escalation"]["requires_clinician_message"] == False, "Test 2 Failed"
    print("Test 2 Passed")

def test_3_mixed_context_state():
    trace = create_mock_trace([
        {"id": "doc3", "severity": 3, "behaviour_tags": ["agitation"]},
        {"id": "doc4", "severity": 5, "behaviour_tags": ["acute_change"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "urgent", "Test 3 Failed"
    assert res["escalation"]["pattern_type"] == "mixed_chronic_and_acute", "Test 3 Failed"
    print("Test 3 Passed")

def test_4_target_baseline_pass():
    trace = create_mock_trace([
        {"id": "doc5", "severity": 1, "behaviour_tags": ["calm", "routine"]}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "none", "Test 4 Failed"
    print("Test 4 Passed")

def test_5_verification_of_content_negation():
    # Note text has negation but structural tags are benign
    trace = create_mock_trace([
        {"id": "doc6", "severity": 1, "behaviour_tags": ["calm"], "raw_note": "She was not confused today and seemed calm."}
    ])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] == "none", "Test 5 Failed"
    print("Test 5 Passed")

def test_6_guidance_threshold_restraint():
    trace = create_mock_trace([], [{"id": "g1", "topic_tags": ["red_flag", "delirium"]}])
    res = apply_safety_floor("Normal answer", trace)
    assert res["escalation"]["escalation_level"] != "urgent", "Test 6 Failed"
    print("Test 6 Passed")

def test_7_structural_interception():
    trace = create_mock_trace([
        {"id": "doc7", "severity": 5, "behaviour_tags": ["acute_change"]}
    ])
    ans = "I have logged the observation."
    res = apply_safety_floor(ans, trace)
    assert res["escalation"]["escalation_level"] == "urgent", "Test 7 Failed"
    assert CLINICIAN_ESCALATION_MESSAGE in res["answer"], "Test 7 Failed"
    print("Test 7 Passed")

def test_8_suppress_duplicate_output():
    trace = create_mock_trace([
        {"id": "doc8", "severity": 5, "behaviour_tags": ["acute_change"]}
    ])
    ans = "Please discuss this sudden change with a clinician promptly. This is not a diagnosis."
    res = apply_safety_floor(ans, trace)
    assert res["escalation"]["escalation_level"] == "urgent", "Test 8 Failed"
    assert CLINICIAN_ESCALATION_MESSAGE not in res["answer"], "Test 8 Failed (Message was duplicated)"
    print("Test 8 Passed")

if __name__ == "__main__":
    try:
        test_1_acute_signal_transition()
        test_2_chronic_signal_isolation()
        test_3_mixed_context_state()
        test_4_target_baseline_pass()
        test_5_verification_of_content_negation()
        test_6_guidance_threshold_restraint()
        test_7_structural_interception()
        test_8_suppress_duplicate_output()
        print("\nAll Step 5 Safety Floor unit tests passed!")
        sys.exit(0)
    except AssertionError as e:
        print(f"\n[FAIL] {e}")
        sys.exit(1)
