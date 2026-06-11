# 🩵 Carey AI: Enterprise Caregiver Companion

Carey AI is an intelligent, always-on care companion designed to support senior citizens while seamlessly integrating with enterprise hospital networks. By leveraging state-of-the-art AI, Carey bridges the gap between patient independence and clinical oversight.

For patients, Carey acts as a friendly, voice-activated companion who can hold conversations, remind them to take their medication, and provide comfort. 
For clinical teams, Carey acts as an autonomous medical observer—detecting acute distress and automatically escalating emergencies into existing enterprise ticketing systems.

## ✨ Key Features & Agentic Workflows

1. **Semantic Distress Detection**: Carey doesn't just rely on panic buttons. It uses **Gemini 3.5 Flash** to analyze the context of patient conversations in real-time. If a patient casually mentions "I am having trouble swallowing my pills," the AI semantically flags this as an acute physical distress event.
2. **Enterprise Clinical Escalation**: When distress is detected, Carey autonomously files an incident report. Using the **Model Context Protocol (MCP)**, Carey directly connects to the hospital's **GitLab** environment to create an URGENT Clinical Incident ticket, alerting medical officers without any human intervention.
3. **Automated Emergency Dispatch**: Alongside the enterprise ticket, Carey instantly triggers a **Twilio Voice Call** directly to the patient's primary caregiver or emergency contact.
4. **Clinical Logging**: All behavioral observations (e.g., agitation, sundowning risk) are logged securely in **Elasticsearch** for the medical team to review in the Caregiver Dashboard.

## 🛠️ Technology Stack & Hackathon Requirements

This project successfully implements all three required technologies for the hackathon:

*   **Gemini (Vertex AI)**: Powers the conversational AI engine and the semantic intent analyzer. Gemini parses patient speech and dynamically decides whether to trigger emergency protocols based on medical context.
*   **Google Cloud Agent Builder**: The core agentic architecture is deployed entirely on Google Cloud Run, leveraging GCP's robust IAM security, secure secrets management (for Twilio, GitLab, and Elastic API keys), and scalable serverless containers to handle agent reasoning workflows.
*   **GitLab MCP Server**: We utilized the official `@modelcontextprotocol/server-gitlab` to allow our AI agent to break out of the chat interface and take physical action in an external enterprise environment.

### Other Technologies
*   **Frontend**: Next.js 16 (Turbopack), React, Tailwind CSS, Motion (Framer), deployed on Firebase Hosting.
*   **Backend**: Python, FastAPI, Docker, deployed on Google Cloud Run.
*   **Voice/Speech**: Web Speech API for continuous voice recognition and SpeechSynthesis for natural voice responses.

## 🚀 Live Demo

You can test the application live right now. No local installation required!

**Live Application URL:** [https://carey-ai.web.app](https://carey-ai.web.app)

### Demo Walkthrough Instructions:
1. Navigate to the Live URL.
2. Click the **"Hackathon Quick Login"** button on the bottom left of the login screen to bypass authentication.
3. Once logged in, you will be in the **Senior Workspace**.
4. To test the Agentic Workflow, type or say: *"I am having trouble swallowing my pills."*
5. Watch as the AI dynamically flags the semantic distress, triggers a red UI alert, dispatches a Twilio phone call to the caregiver, and uses MCP to open a GitLab ticket!

## 💻 Local Development

If you wish to run the project locally:

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📜 License
This project is licensed under the MIT License - see the LICENSE file for details.
