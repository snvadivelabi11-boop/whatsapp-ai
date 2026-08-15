# SIH AI WhatsApp Helpdesk – Production-Ready MVP

> An intelligent, multi-channel AI WhatsApp Helpdesk system built specifically for **Smart India Hackathon (SIH)** student teams, mentors, and college SPOCs. Powered by **FastAPI**, **OpenRouter AI**, **Firebase Firestore**, **WhatsApp Cloud API**, and a modern dark **React/Vite Admin Dashboard**.

---

## 1. Project Overview

During Smart India Hackathon (SIH), hundreds of student teams face critical questions regarding team eligibility, female member mandates, PPT submission format, nodal center rules, and technical architecture. 

**SIH AI Helpdesk** delivers:
- **Instant 24/7 AI Assistance via WhatsApp**: Grounded strictly on official SIH guidelines, rules, FAQs, and presentation criteria.
- **Strict Anti-Hallucination Guardrails**: Never fabricates official dates, rules, or judging criteria.
- **Intelligent Admin Escalation**: When doubts cannot be definitively answered by AI, tickets are auto-created with `PENDING` status for human admins.
- **Direct Student Call Requests**: Teams can request phone calls from admins/mentors, logging priority and reason.
- **Modern Dark Admin Dashboard**: Live conversation monitoring, direct admin takeover replies, support ticket resolution, team registry, and knowledge base CRUD editor.
- **Built-in Local Simulator**: Test the entire WhatsApp AI pipeline and escalation flows without needing Meta credentials.

---

## 2. System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Student WhatsApp         │
                                  │      (Mobile / Desktop)       │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────┐          ┌───────────────────────────┐
│ Meta WhatsApp Cloud API ├─────────►│  FastAPI Backend (Port 8000│
└─────────────────────────┘ Webhook  │  /api/whatsapp/webhook    │
                                     └───────────┬───────────────┘
                                                 │
                  ┌──────────────────────────────┼──────────────────────────────┐
                  │                              │                              │
                  ▼                              ▼                              ▼
      ┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
      │  Knowledge Service   │       │  Escalation Machine  │       │  OpenRouter Engine   │
      │  (Markdown + DB RAG) │       │  (Tickets & Calls)   │       │  (DeepSeek / Gemini) │
      └──────────┬───────────┘       └──────────┬───────────┘       └──────────┬───────────┘
                 │                              │                              │
                 └──────────────────────────────┼──────────────────────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────┐
                               │       Firebase Firestore       │
                               │  (Users, Teams, Messages,      │
                               │   Tickets, Calls, KB)          │
                               └────────────────┬───────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────┐
                               │   React Admin Dashboard (5173) │
                               │   - Live Chat Inspector        │
                               │   - Support Ticket Queue       │
                               │   - Call Request Roster        │
                               │   - Knowledge Base CRUD        │
                               │   - AI Chat Simulator          │
                               └────────────────────────────────┘
```

---

## 3. Requirements

- **Python**: 3.10+ (Tested on Python 3.13)
- **Node.js**: 18.0+ & npm 9+
- **OpenRouter API Key**: (Get one at [openrouter.ai](https://openrouter.ai))
- **Firebase Account**: (Optional for local testing; required for live cloud Firestore)
- **Meta Developer Account**: (Optional for local testing; required for live WhatsApp Cloud API)

---

## 4. Installation

### 1. Clone or Open Workspace
```bash
cd "whatsapp ai"
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 5. Environment Variables

Edit `.env` at the root of the project:

```env
# OpenRouter AI Configuration
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=deepseek/deepseek-chat

# Firebase Admin SDK Configuration (Firestore)
# Leave empty to use automatic structured Local Storage mode for development!
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=EAABxxxxxxxxxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=109283746592817
WHATSAPP_VERIFY_TOKEN=sih_ai_verify_token_secure_2025

# Admin Contact
ADMIN_PHONE_NUMBER=+919876543210

# Backend Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

---

## 6. Firebase Setup (Optional for Cloud Mode)

The backend features **graceful dual-mode storage**:
1. **Local Mode (Default)**: If Firebase credentials are empty in `.env`, the app automatically stores data in `backend/data/local_store.json`.
2. **Cloud Mode**: To connect real Firebase Firestore:
   - Go to [Firebase Console](https://console.firebase.google.com/) -> Create Project.
   - Go to **Project Settings** -> **Service Accounts** -> **Generate New Private Key**.
   - Copy `project_id`, `client_email`, and `private_key` into `.env`.

---

## 7. OpenRouter Setup

1. Sign up at [OpenRouter](https://openrouter.ai/).
2. Generate an API Key under **Settings -> Keys**.
3. Add `OPENROUTER_API_KEY=your_key` to `.env`.
4. Choose any model, e.g., `deepseek/deepseek-chat`, `google/gemini-2.0-flash-001`, or `meta-llama/llama-3.3-70b-instruct`.

---

## 8. Local Development & Running the App

### Start FastAPI Backend:
```bash
cd backend
python main.py
# Server running at: http://localhost:8000
# API Docs Swagger at: http://localhost:8000/docs
```

### Start React Admin Dashboard:
```bash
cd frontend
npm run dev
# Dashboard running at: http://localhost:5173
```

---

## 9. WhatsApp Cloud API Setup

1. Go to [Meta for Developers](https://developers.facebook.com/) -> Create App -> Choose **Business** type.
2. Add **WhatsApp** product to your App.
3. Under WhatsApp -> **API Setup**:
   - Copy the **Temporary Access Token** (or generate a System User permanent token).
   - Copy the **Phone Number ID**.
   - Paste these into `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `.env`.

---

## 10. Webhook Configuration

1. Expose your local backend port `8000` to the internet using `ngrok` or similar:
   ```bash
   ngrok http 8000
   ```
2. In Meta Developer Portal -> WhatsApp -> **Configuration** -> **Webhook**:
   - **Callback URL**: `https://<your-ngrok-subdomain>.ngrok-free.app/api/whatsapp/webhook`
   - **Verify Token**: `sih_ai_verify_token_secure_2025` (must match `WHATSAPP_VERIFY_TOKEN` in `.env`).
   - Click **Verify and Save**.
3. Under **Webhook Fields**, click **Manage** and subscribe to **`messages`**.

---

## 11. Testing & Verification

### Local Chat Testing (Without WhatsApp)
1. Open the Admin Dashboard at `http://localhost:5173`.
2. Click **Chat Simulator** in the sidebar.
3. Select any quick test scenario or type custom questions:
   - *"What is the team size and is a female mandatory?"* -> Answers with 6 members & 1 female rule.
   - *"What is the PPT format?"* -> Lists 5-7 slide structure.
   - *"I want to talk to admin"* -> Prompts for YES/NO and registers a Call Request.
   - *"Can I change my registered mentor?"* -> Offers admin escalation and creates a Support Ticket.
4. Navigate to **Support Tickets** and **Call Requests** to observe the live items created.
5. In **Conversations**, reply as an admin to simulate live human intervention.

### Automated API Verification
```bash
# Health check
curl http://localhost:8000/health

# Local chat endpoint
curl -X POST http://localhost:8000/api/chat -H "Content-Type: application/json" -d "{\"message\": \"What is the team size?\", \"phone\": \"+919876500001\", \"name\": \"Student\"}"

# Support Tickets list
curl http://localhost:8000/api/tickets
```

---

## 12. Deployment

- **Backend**: Can be containerized with Docker or deployed to Render, AWS ECS, GCP Cloud Run, or Fly.io.
  ```dockerfile
  FROM python:3.11-slim
  WORKDIR /app
  COPY backend/requirements.txt .
  RUN pip install --no-cache-dir -r requirements.txt
  COPY backend/ .
  COPY knowledge/ ../knowledge/
  CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
  ```
- **Frontend**: Build production bundle with `npm run build` inside `frontend/` and host on Vercel, Netlify, or Firebase Hosting.

---

## 13. Security Notes

- **Zero Secret Exposure**: Backend API keys, tokens, and Firestore private keys are kept in `.env` and never bundled or sent to the frontend.
- **Webhook Handshake Verification**: Strict cryptographic token validation on `GET /api/whatsapp/webhook`.
- **CORS Protection**: CORS origins are strictly restricted via `CORS_ORIGINS`.
- **Safe Fallbacks & Logging**: Sensitive headers and tokens are scrubbed from server logs.
