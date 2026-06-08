---
name: agent-evaluation
description: >-
  Evaluate the Caregiver AI Agent's performance, run safety audits, and test
  queries.
---

# Agent Evaluation & Safety Skill

## Overview
This skill handles the evaluation of the Gemini planning loop and safety classification boundaries. It ensures that inputs are classified correctly for safety and that the agent retrieves clinical context properly without failing.

## Dependencies
*   `elastic-management` - To verify indices are populated before running evaluations.

## Quick Start
To run basic evaluation or diagnostic tests:
1.  Verify the Vertex AI connection by running the Gemini ADC sanity check.
2.  Run the automated test suite using `pytest` to verify safety thresholds and escalation consistency.
3.  Check that linter checks pass by running `ruff check backend`.

## Workflows

### 1. Diagnostic Gemini ADC Check
Confirm Vertex AI authentication is correct and ADC is active:
```bash
python backend/scripts/test_gemini_adc.py
```
*(If in root, run: `python scripts/test_gemini_adc.py`)*

### 2. Testing Caregiver Concerns & Safety Floor
Submit test concerns to the FastAPI backend `/chat` endpoint or via automated unit tests:
*   Run the safety floor unit tests: `pytest tests/test_safety.py`
*   Verify that acute confusion is flagged with escalation tags (e.g. `acute_confusion`, `uti_suspected`).
*   Confirm that benign inputs do not trigger immediate crisis language.

### 3. Evaluating Retrieval Accuracy & Citation
Verify that retrieved documents from `dementia_kb` are cited correctly:
*   Ensure that query parameters use `search_text` for BM25 and density checks.
*   Validate citation rendering through `pytest tests/test_mcp.py` and downstream system validation.

## Common Mistakes
*   **ADC Credentials Expired**: If `test_gemini_adc.py` fails with an authentication error, refresh the credentials:
    ```powershell
    gcloud auth application-default login
    ```
*   **Unstructured Safety Output**: When editing the safety floor (`safety.py`), ensure safety tags are extracted using structured schema formatting to prevent parsing errors.
*   **Running Scattered Scripts**: Avoid running the legacy individual scripts in `backend/scripts` for core functionality checks; instead, utilize the unified `pytest` runner.

