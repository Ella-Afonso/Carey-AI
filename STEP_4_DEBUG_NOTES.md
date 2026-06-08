# Step 4 Debug Notes

* **Test ADC:** `python backend/scripts/test_gemini_planning.py` verifies Vertex AI connectivity.
* **Test MCP:** `python backend/scripts/test_mcp_connectivity.py` validates the Elastic Agent Builder bridge.
* **Test Agent:** `python backend/scripts/test_agent.py` runs the full E2E test.
* **Data Protection:** All automated agent tests write to `test-patient-temp` and self-delete to ensure `demo-patient-001` remains pristine.
* **MCP Proof:** The agent returns `mcp_gate_verified=True` ONLY if a subprocess round-trip to Elastic succeeded without error.
