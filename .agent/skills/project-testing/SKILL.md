---
name: project-testing
description: >-
  Go over the whole project and run tests: escalation consistency tests,
  unit tests, and MCP checks. Includes testing with pytest, handling failures,
  and running code quality audits with ruff.
---

# Project Testing & Quality Assurance Skill

## Overview
This skill governs the execution of project-wide validation, testing, and formatting standards. It ensures that the caregiver agent backend performs correctly across unit, integration, safety-floor, escalation consistency, and Model Context Protocol (MCP) transport layers.

## Dependencies
*   **pytest** — The main testing framework runner.
*   **pytest-asyncio** — Support library for executing async python tests.
*   **ruff** — Fast Python linter and formatter used to maintain code quality.

## Quick Start
To run all tests and check code quality:
1. Ensure the virtual environment is active.
2. Run ruff linter checks on code changes.
3. Run the pytest suite from the `backend/` directory.

```powershell
# From project root
# Run linter
.venv\Scripts\ruff.exe check backend/tests

# Run test suite
cd backend
..\.venv\Scripts\pytest
```

## Workflows

### 1. Running Unit Tests and Safety Checks
Pytest is configured to scan the `backend/tests/` directory for test files. To run individual test modules:

*   **Safety Floor Tests**: Check that safety logic classifies acute, chronic, and mixed scenarios appropriately.
    ```bash
    pytest tests/test_safety.py
    ```
*   **Temporal Patterns Tests**: Check that sundowning and acute/chronic patterns are detected correctly.
    ```bash
    pytest tests/test_temporal_patterns.py
    ```

### 2. Validating MCP Integration
To test whether the MCP server and endpoints are functioning, execute the MCP test suite:
```bash
pytest tests/test_mcp.py
```
This verifies that the primary transport layer connects correctly and exposes the essential tools (`search_general_guidance`, `search_patient_history`).

### 3. Escalation Consistency and Specificity Testing
These tests check the alignment of the LLM responses to safety protocols.
```bash
pytest tests/test_escalation.py
```
*   **Consistency**: Tests that critical/urgent symptoms trigger the correct escalation headers and urgency keywords.
*   **Specificity**: Tests that benign logs do not cause false alarms or leak instruction prompts.

### 4. Handling Pytest Failures
When pytest encounters failures, use the following flags to isolate and debug:
*   Run the first failing test and stop: `pytest -x`
*   Show local variables in tracebacks: `pytest -l`
*   Open a debugger on failure: `pytest --pdb`
*   Run specific tests matching a keyword: `pytest -k "sundowning"`

### 5. Running Ruff Audits
To maintain formatting and linting standards:
*   **Check code**: `ruff check backend`
*   **Auto-fix issues**: `ruff check backend --fix`
*   **Format code**: `ruff format backend`

## Common Mistakes
*   **Uncached Elasticsearch Data**: Ensure tests cleanup synthetic patient data after completion. Use the `test_patient_id` or `cleanup_patient_logs` fixtures to automatically wipe test records.
*   **Async Loop Conflicts**: Always ensure async tests have a default asyncio fixture loop scope (configured in `pytest.ini`).
