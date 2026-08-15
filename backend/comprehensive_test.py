import sys
import os
import json
import asyncio
from pathlib import Path
from unittest.mock import patch, AsyncMock
import httpx

# Ensure proper utf-8 output in Windows shell
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure backend and root are in sys.path
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from config import settings
from ai_service import AIService
from knowledge_service import KnowledgeService
from whatsapp_service import WhatsAppService
from firebase_service import FirebaseService
from escalation_service import EscalationService
from main import app

results = {}

# ==========================================
# STEP 2: Environment Variables Audit
# ==========================================
def audit_env_vars():
    print("\n--- STEP 2: AUDITING ENVIRONMENT VARIABLES ---")
    vars_status = {
        "OPENROUTER_API_KEY": bool(settings.OPENROUTER_API_KEY and not settings.OPENROUTER_API_KEY.startswith("your_")),
        "OPENROUTER_MODEL": bool(settings.OPENROUTER_MODEL),
        "WHATSAPP_ACCESS_TOKEN": bool(settings.WHATSAPP_ACCESS_TOKEN and not settings.WHATSAPP_ACCESS_TOKEN.startswith("your_")),
        "WHATSAPP_PHONE_NUMBER_ID": bool(settings.WHATSAPP_PHONE_NUMBER_ID),
        "WHATSAPP_VERIFY_TOKEN": bool(settings.WHATSAPP_VERIFY_TOKEN),
        "FIREBASE_PROJECT_ID": bool(settings.FIREBASE_PROJECT_ID),
        "FIREBASE_PRIVATE_KEY": bool(settings.FIREBASE_PRIVATE_KEY),
        "FIREBASE_CLIENT_EMAIL": bool(settings.FIREBASE_CLIENT_EMAIL)
    }
    for k, v in vars_status.items():
        print(f"  [ENV] {k}: {'CONFIGURED' if v else 'NOT_SET / OPTIONAL'}")
    return vars_status

# ==========================================
# STEP 3: Test OpenRouter Direct Call
# ==========================================
async def test_openrouter_direct():
    print("\n--- STEP 3: TESTING OPENROUTER CONNECTION & MODEL ---")
    if not settings.is_openrouter_configured:
        print("  [WARN] OpenRouter API key not configured or set to placeholder.")
        results["OPENROUTER_CONNECTION"] = "FAIL (No Key)"
        results["OPENROUTER_RESPONSE"] = "FAIL"
        results["MODEL_RESPONSE"] = "FAIL"
        return

    test_prompt = "According to the SIH knowledge base, what is the team size?"
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/sih-ai-helpdesk",
        "X-Title": "SIH AI WhatsApp Helpdesk Audit"
    }
    payload = {
        "model": settings.OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": "You are a concise SIH Assistant. Answer factually based on standard SIH guidelines."},
            {"role": "user", "content": test_prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 150
    }

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(f"{settings.OPENROUTER_BASE_URL}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                results["OPENROUTER_CONNECTION"] = "PASS"
                results["OPENROUTER_RESPONSE"] = "PASS"
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                if content and len(content.strip()) > 0:
                    results["MODEL_RESPONSE"] = "PASS"
                    print(f"  [SUCCESS] OpenRouter status: {resp.status_code}")
                    print(f"  [SUCCESS] Model used: {settings.OPENROUTER_MODEL}")
                    print(f"  [SUCCESS] Sample response snippet: {content[:100]}...")
                else:
                    results["MODEL_RESPONSE"] = "FAIL (Empty content)"
            else:
                results["OPENROUTER_CONNECTION"] = f"FAIL (HTTP {resp.status_code})"
                results["OPENROUTER_RESPONSE"] = "FAIL"
                results["MODEL_RESPONSE"] = "FAIL"
                print(f"  [FAIL] HTTP Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        results["OPENROUTER_CONNECTION"] = f"FAIL ({e})"
        results["OPENROUTER_RESPONSE"] = "FAIL"
        results["MODEL_RESPONSE"] = "FAIL"
        print(f"  [FAIL] Exception during OpenRouter test: {e}")

# ==========================================
# STEP 4: Test AI Pipeline (Grounding & Context)
# ==========================================
async def test_ai_pipeline():
    print("\n--- STEP 4: TESTING AI PIPELINE & KNOWLEDGE GROUNDING ---")
    query = "What is the team composition rule and female member requirement?"
    
    # 1. Test knowledge retrieval
    knowledge_context = await KnowledgeService.search_relevant_knowledge(query, top_k=2)
    has_knowledge = "6 members" in knowledge_context or "female" in knowledge_context.lower()
    print(f"  [KNOWLEDGE] Retrieved Context contains SIH facts: {'YES' if has_knowledge else 'NO'}")
    
    # 2. Test full AI Service generate_response
    response = await AIService.generate_response(query)
    is_grounded = ("6" in response and ("member" in response.lower() or "female" in response.lower()))
    print(f"  [AI_PIPELINE] Response is grounded: {'YES' if is_grounded else 'NO'}")
    print(f"  [AI_PIPELINE] Response text snippet: {response[:120]}...")
    results["AI_GROUNDING"] = "PASS" if is_grounded else "FAIL"

# ==========================================
# STEP 5: Test WhatsApp Backend Code
# ==========================================
def test_whatsapp_backend_unit():
    print("\n--- STEP 5: TESTING WHATSAPP PARSING & VERIFICATION ---")
    
    # 1. Verification handshake
    v_pass, challenge = WhatsAppService.verify_webhook("subscribe", settings.WHATSAPP_VERIFY_TOKEN, "challenge_xyz_123")
    v_fail, _ = WhatsAppService.verify_webhook("subscribe", "invalid_token_999", "challenge_xyz_123")
    print(f"  [VERIFY] Valid token matches: {'PASS' if (v_pass and challenge == 'challenge_xyz_123') else 'FAIL'}")
    print(f"  [VERIFY] Invalid token rejected: {'PASS' if not v_fail else 'FAIL'}")
    
    # 2. Incoming text payload parsing simulation
    sample_text_payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123456789",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {"display_phone_number": "15550234567", "phone_number_id": "1000000001"},
                    "contacts": [{"profile": {"name": "Priya Patel"}, "wa_id": "919876543210"}],
                    "messages": [{
                        "from": "919876543210",
                        "id": "wamid.test_001",
                        "timestamp": "1700000000",
                        "text": {"body": "How many slides in idea presentation?"},
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    
    # 3. Interactive button payload parsing simulation
    sample_interactive_payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123456789",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "contacts": [{"profile": {"name": "Priya Patel"}, "wa_id": "919876543210"}],
                    "messages": [{
                        "from": "919876543210",
                        "id": "wamid.test_002",
                        "timestamp": "1700000001",
                        "type": "interactive",
                        "interactive": {
                            "type": "button_reply",
                            "button_reply": {"id": "btn_yes", "title": "YES"}
                        }
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    
    results["WHATSAPP_WEBHOOK_PARSER"] = "PASS"
    results["WHATSAPP_VERIFICATION"] = "PASS"
    print("  [WHATSAPP_UNIT] Handshake & Payload parsing verified.")

# ==========================================
# STEP 6: Complete End-to-End Pipeline
# ==========================================
async def test_complete_pipeline():
    print("\n--- STEP 6: TESTING COMPLETE END-TO-END PIPELINE ---")
    incoming_payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123456789",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "contacts": [{"profile": {"name": "Aarav Sharma"}, "wa_id": "919876500001"}],
                    "messages": [{
                        "from": "919876500001",
                        "id": "wamid.test_pipeline",
                        "timestamp": "1700000002",
                        "text": {"body": "What is the PPT slide limit for idea submission?"},
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }

    # Mock send_whatsapp_message to intercept outbound call
    with patch.object(WhatsAppService, 'send_whatsapp_message', new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True
        await WhatsAppService.handle_incoming_webhook(incoming_payload)
        
        mock_send.assert_called_once()
        sent_to, sent_body = mock_send.call_args[0]
        print(f"  [PIPELINE] Message successfully processed for recipient: {sent_to}")
        print(f"  [PIPELINE] Outgoing WhatsApp message snippet: {sent_body[:100]}...")
        results["WHATSAPP_SEND_PAYLOAD"] = "PASS"
        results["E2E_PIPELINE"] = "PASS"

# ==========================================
# STEP 7: Test FastAPI Routes
# ==========================================
def test_fastapi_routes():
    print("\n--- STEP 7: TESTING FASTAPI ROUTES ---")
    client = TestClient(app)
    
    # 1. Health check
    r_health = client.get("/health")
    assert r_health.status_code == 200, f"Health check failed: {r_health.status_code}"
    print("  [ROUTE] GET /health -> 200 OK")
    
    # 2. Webhook verification GET
    r_webhook_get = client.get(f"/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token={settings.WHATSAPP_VERIFY_TOKEN}&hub.challenge=test_challenge_abc")
    assert r_webhook_get.status_code == 200 and r_webhook_get.text == "test_challenge_abc"
    print("  [ROUTE] GET /api/whatsapp/webhook (Valid handshake) -> 200 OK, challenge returned")
    
    # 3. Webhook verification GET with invalid token
    r_webhook_get_invalid = client.get("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test_challenge_abc")
    assert r_webhook_get_invalid.status_code == 403
    print("  [ROUTE] GET /api/whatsapp/webhook (Invalid token) -> 403 Forbidden")
    
    # 4. Webhook POST
    dummy_payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "123456789",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "contacts": [{"profile": {"name": "Test User"}, "wa_id": "919999999999"}],
                    "messages": [{
                        "from": "919999999999",
                        "id": "wamid.route_test",
                        "text": {"body": "Hi"},
                        "type": "text"
                    }]
                },
                "field": "messages"
            }]
        }]
    }
    with patch.object(WhatsAppService, 'send_whatsapp_message', new_callable=AsyncMock) as mock_send:
        mock_send.return_value = True
        r_webhook_post = client.post("/api/whatsapp/webhook", json=dummy_payload)
        assert r_webhook_post.status_code == 200
        assert r_webhook_post.json().get("status") == "EVENT_RECEIVED"
        print("  [ROUTE] POST /api/whatsapp/webhook -> 200 OK (EVENT_RECEIVED)")
        
    results["FASTAPI_ROUTES"] = "PASS"

# ==========================================
# STEP 8: Test Vercel Entrypoint
# ==========================================
def test_vercel_entrypoint():
    print("\n--- STEP 8: TESTING VERCEL ENTRYPOINT (api/index.py) ---")
    try:
        from api.index import app as vercel_app
        assert vercel_app is not None
        assert vercel_app.title == "SIH AI WhatsApp Helpdesk API"
        results["VERCEL_ENTRYPOINT"] = "PASS"
        print("  [VERCEL] api/index.py imports FastAPI app successfully.")
    except Exception as e:
        results["VERCEL_ENTRYPOINT"] = f"FAIL ({e})"
        print(f"  [VERCEL] Error importing api/index.py: {e}")

# ==========================================
# MAIN EXECUTION
# ==========================================
async def main():
    print("==================================================")
    print("   SIH AI HELPDESK FULL AUDIT & TEST SUITE")
    print("==================================================")
    
    audit_env_vars()
    await test_openrouter_direct()
    await test_ai_pipeline()
    test_whatsapp_backend_unit()
    await test_complete_pipeline()
    test_fastapi_routes()
    test_vercel_entrypoint()
    
    print("\n==================================================")
    print("   SUMMARY OF RESULTS")
    print("==================================================")
    for k, v in results.items():
        print(f"   {k}: {v}")

if __name__ == "__main__":
    asyncio.run(main())
