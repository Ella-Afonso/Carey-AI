---

## name: mcp-citation-enrichment
description: >-
Architectural runbook and implementation skill to intercept partial MCP search
results and concurrently backfill authoritative NHS/NICE citation metadata
(source, url, title, licence, topic_tags) via code-side document lookups.

# MCP Citation Enrichment Skill

## Overview

The credibility of this project hinges entirely on its capacity to ground its reasoning in real, named, and authoritative NHS/NICE medical references. However, routing search queries through a Model Context Protocol (MCP) layer can introduce a silent citation degradation effect. The search tool defaults to a partial snippet response shape, causing the agent to receive and display cryptic internal document identifiers (such as `"slam-sudden-confusion-001"`) instead of clear, human-readable source attributes (such as `"NHS / South London and Maudsley Sudden confusion"`).

Leaking internal database keys directly into the final user interface breaks stakeholder trust. While refusing to fabricate missing metadata is the correct baseline behavior, the resulting opaque IDs present an unacceptable degradation for live demos.

This skill resolves the degradation through **Option 2: Code-Side MCP Path Enrichment**. Instead of attempting out-of-repo configuration adjustments to the Elastic Cloud/Kibana Agent Builder tool definitions (which are not code-managed in this repository and inherently enforce partial snippet shapes), this fix intercepts the partial payloads purely in code. It leverages the existing, pre-exposed `platform_core_get_document_by_id` MCP tool to fetch full documents concurrently and backfill missing citation metadata before the context is fed to the Large Language Model.

## Dependencies

* 
**Target Tool**: `platform_core_get_document_by_id` — Used to fetch non-partial, authoritative content payloads.


* 
**Knowledge Base**: `dementia_kb` — The Elasticsearch index containing the full, human-readable source data.


* **Affected Modules**:
* 
`agent/mcp_client.py` — Location of the main enrichment loop and pipeline interception hook.


* 
`agent/agent.py` — Orchestrates LLM payload context wrapping.


* 
`agent/prompts.py` — Governs negative constraints and citation output formatting.


* 
`scripts/test_agent.py` — Hosts integration test assertions and validation rules.


* 
`STEP_4_DEBUG_NOTES.md` — Project documentation and assumption mapping.





## Quick Start

To confirm baseline connectivity, evaluate search behavior, and verify the successful extraction of citation records, run the following diagnostic script sequence:

1. **Verify MCP Linkage**: Ensure the primary protocol transport layers are active and communicating properly.
```bash
python scripts/test_mcp_connectivity.py

```



(Expect a direct `PASS` exit code )


2. **Verify Non-Regression of Step 3 Tools**: Ensure standard lookup features remain operational.
```bash
python scripts/test_tools.py

```



(Expect `7 passed, 0 failed` )


3. **Validate End-to-End Enrichment**: Execute the primary agent testing framework to confirm that live answers use human-readable markers instead of internal system tags.
```bash
python scripts/test_agent.py

```



(Expect `15 passed, 0 failed` with exit code 0 )



## Workflows

### 1. Identifying Retrieval-Shape Defects via Payload Dumping

If the agent is leaking internal identifiers to the user interface, capture the raw payload output from `search_general_guidance` inside `agent/elastic_client.py` (specifically within the lines 166:0–210:18 block) to inspect its shape. Confirm the presence of the following structural defect:

```json
{
  "results": [
    {
      "type": "resource_list",
      "data": {
        "resources": [
          {
            "reference": {
              "id": "slam-sudden-confusion-001",
              "index": "dementia_kb"
            },
            "partial": true,
            "content": {
              "snippets": ["Sudden confusion (also called delirium)..."]
            }
          }
        ]
      }
    }
  ]
}

```

* 
**Payload Diagnostics**: Note that the resource explicitly registers `"partial": true`. It restricts its scope exclusively to the `reference` object containing the document identifier and index name, alongside a raw text snippet array.


* 
**Underlying State**: The missing human-readable metadata variables (`source`, `url`, `title`, `licence`, `topic_tags`) are verified to exist within the primary index, meaning this is a retrieval-shape issue rather than a missing-data problem.



### 2. Building the Concurrent Enrichment Layer (`agent/mcp_client.py`)

Open `agent/mcp_client.py` and implement the following helper methods and pipeline blocks to safely intercept and enrich partial data shapes:

* 
**Payload Standardizer (Lines 334:0–347:22)**: Implement `_raw_payload(response)` to cleanly pull out the raw dictionary mappings from incoming protocol wrapper objects.


* 
**Document Parser**: Implement `_extract_full_document(payload)` to parse the single-resource layout returned by document-by-id fetches, safely unpacking its inner content block.


* 
**Safe Document Retrieval**: Implement `get_document_by_id(doc_id, index)` using an SDK-primary implementation equipped with an `httpx`-fallback path. Enforce a timeout wrapper bounded by the `MCP_CALL_TIMEOUT` parameter.


* 
*Critical Design Constraint*: This function must use global try/catch blocks and **never raise an exception**. If an identifier fails to resolve, it must return an empty dictionary to degrade gracefully, ensuring a lookup failure does not crash the broader search features.




* 
**Concurrent Lookup Controller**: Implement `enrich_guidance_citations(records)` to handle the batch processing of incoming partial records.


* 
**Overhead Protection**: Cap evaluation at the top 8 records using a `GUIDANCE_ENRICH_LIMIT` check to manage round-trip latency.


* 
**Redundancy Filter**: Inspect each record and skip processing for any entry that already contains usable, pre-populated `source` and `url` values.


* 
**Concurrency Wrapper**: Wrap execution inside an `asyncio.gather` pipeline to run all needed document fetches concurrently.


* 
**Metadata Backfilling**: Map out retrieved records to populate only the official `CITATION_FIELDS` array: `title`, `source`, `url`, `licence`, `topic_tags`, and `content`. Explicitly tag successfully modified elements with a `citation_enriched: true` flag.




* 
**Pipeline Interception Hook**: Wire the enrichment routine directly into the `call_tool` core method for both active transports. Scope this hook strictly to execute only when the target tool name matches `search_general_guidance` and the parameter `called_via_mcp` evaluates to `true`.



### 3. Synchronizing Downstream Systems

Once the client layer is backfilling the missing keys, adjust interfacing modules to map the data to the LLM context window:

* 
**Context Payload Assembly (`agent/agent.py`)**: Update the payload trimming and formatting functions that generate context for the Gemini model. Ensure that the final context block includes the newly populated `title` and `licence` parameters alongside the standard `source` and `url` keys.


* 
**Prompt Constraints & Rules (`agent/prompts.py`)**: Update system guidelines and the "Sources" block definition instructions.


* Add an explicit rule requiring the model to use the human-readable `source` name, `title`, and `url` inside outputs.


* Enforce a negative constraint that strictly forbids the model from outputting raw internal `doc_id` strings (e.g., `slam-sudden-confusion-001`) in user-facing answers.


* Reiterate strict "never fabricate" rules to ensure that missing data fields default cleanly to `null`.


* Strengthen planning boundaries to ensure `generate_clinician_summary` runs whenever significant escalation changes or clinician hand-offs occur.




* 
**Documentation Alignment**: Add a dedicated section titled `"Citations - real NHS/NICE source names (MCP enrichment)"` and correct legacy documentation assumptions stating that document IDs serve as citable references.



### 4. Restructuring Test Suite Assertions (`scripts/test_agent.py`)

To prevent regression and ensure that partial IDs do not bypass validation checks, update the testing framework assertions:

* 
**Upgrade Verification Logic**: Replace general regex matches that accept "any source-ish word or document ID" with structural validation checks.


* 
**Define Token Targets**: Force the assertion to validate that final text blocks contain concrete, authoritative source markers. The output must explicitly match keywords like `'nhs'`, `'nice'`, `'maudsley'`, `'hospital'`, `'trust'`, or `'http'`. A raw internal document ID alone must cause the test suite to fail.



## Common Mistakes

* 
**Allowing Failed Lookups to Raise Errors**: Failing to isolate exceptions inside `get_document_by_id` can allow individual network timeouts or missing entries to crash the primary search tool execution. Ensure exceptions are caught and logged internally, degrading to a clean, non-enriched return.


* 
**Fabricating Unreturned Metadata fields**: Do not invent placeholder values for fields that are missing from the underlying index. Only map fields that are explicitly returned by the `dementia_kb` index; anything else must remain `null`.


* 
**Unmonitored Latency Spikes on Search Hooks**: Because enrichment introduces additional round-trips per query, search latency can increase (e.g., rising from ~4s to ~7–8s in test traces). To prevent this from degrading live user interfaces, always verify that queries run concurrently via `asyncio.gather` and remain limited to the top 8 records. Monitor performance overhead closely using the log trace field `duration_ms`. Use caching strategies or adjust item limits if live execution parameters require optimization.