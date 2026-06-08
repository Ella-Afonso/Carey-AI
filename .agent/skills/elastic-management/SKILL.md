---
name: elastic-management
description: >-
  Manage Elastic Cloud Serverless indices and ingestion pipelines for the
  Caregiver AI Agent.
---

# Elastic Management Skill

## Overview
This skill governs the provisioning, seeding, and management of the Elasticsearch indexes used by the Caregiver AI Agent:
1.  `dementia_kb` - Ingests clinical care guidelines (real NICE/NHS sources) with ELSER-backed hybrid search.
2.  `patient_log` - Ingests synthetic caregiver daily reports with temporal sundowning clusters.

## Quick Start
To set up and populate the databases:
1.  Verify the environment has `ELASTIC_MCP_URL` and `ELASTIC_API_KEY` defined.
2.  Run the index creation script.
3.  Run the patient log generation script.
4.  Run the bulk ingestion script.

## Utility Scripts & Workflows

### 1. Provisioning Indices
Run the index setup script to configure mappings (such as dense vector fields, text analyzers, and pipeline settings):
```bash
python backend/elastic/index_setup.py
```
*(If the file is in the root, run: `python elastic/index_setup.py`)*

### 2. Generating Synthetic Patient Data
Generate the 99 synthetic entries simulating caregiver observations with sundowning clusters and distractor events:
```bash
python backend/data/generate_patient_log.py
```
*(If in root, run: `python data/generate_patient_log.py`)*

### 3. Running Data Ingestion
Ingest clinical guidelines and patient logs into the respective indexes:
```bash
python backend/elastic/ingest.py
```
*(If in root, run: `python elastic/ingest.py`)*

### 4. Connection Verification
Verify that the Elastic Serverless MCP is reachable and responsive:
```bash
python backend/scripts/mcp_sanity_check.py
```

## Common Mistakes
*   **Missing API Key**: Ensure `ELASTIC_API_KEY` is loaded in `.env` before attempting to run setup or ingestion.
*   **Duplicate Ingestion**: Running the ingest script multiple times without purging indices may cause duplicate records. Ensure index setup cleans/re-creates the mappings if a fresh start is required.
*   **ELSER Model State**: If performing semantic searches, verify that the ELSER model (`.elser_model_2`) is fully deployed and started on your Elastic Serverless project.
