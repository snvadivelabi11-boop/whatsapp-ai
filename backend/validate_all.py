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

# Add project root and backend to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi.testclient import TestClient

report = {}

async def run_all_checks():
    print("==================================================")
    print("   SIH AI HELPDESK VERCEL READINESS VALIDATION")
    print("==================================================")

    # 1. Python Import & Dependency Test
    try:
        import fastapi
        import httpx
        import pydantic
        import pydantic_settings
        from config import settings
        from ai_service import AIService
        from knowledge_service import KnowledgeService
        from whatsapp_service import WhatsAppService
        from firebase_service import FirebaseService
        from main import app
        from api.index import app as vercel_app
        
        assert vercel_app is app
        report["PROJECT_IMPORT"] = "PASS"
        report["FASTAPI_DEPENDENCY"] = "PASS"
        report["FASTAPI_STARTUP"] = "PASS"
        report["VERCEL_ENTRYPOINT"] = "PASS"
        print("[PASS] Imports and FastAPI startup verified.")
    except Exception as e:
        report["PROJECT_IMPORT"] = f"FAIL ({e})"
        report["FASTAPI_DEPENDENCY"] = f"FAIL ({e})"
        report["FASTAPI_STARTUP"] = f"FAIL ({e})"
        report["VERCEL_ENTRYPOINT"] = f"FAIL ({e})"
        print(f"[FAIL] Import error: {e}")
        return

    client = TestClient(app)

    # 2. Health Endpoint Test
    try:
        r_health = client.get("/health")
        assert r_health.status_code == 200
        health_data = r_health.json()
        assert health_data.get("status") == "ok"
        report["HEALTH_ENDPOINT"] = "PASS"
        print(f"[PASS] GET /health -> 200 OK: {health_data['app']}")
    except Exception as e:
        report["HEALTH_ENDPOINT"] = f"FAIL ({e})"
        print(f"[FAIL] Health endpoint error: {e}")

    # 3. WhatsApp Webhook Verification Test (Valid & Invalid)
    try:
        # Valid token
        valid_url = f"/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token={settings.WHATSAPP_VERIFY_TOKEN}&hub.challenge=test_challenge_val_123"
        r_valid = client.get(valid_url)
        assert r_valid.status_code == 200
        assert r_valid.text == "test_challenge_val_123"

        # Invalid token
        invalid_url = f"/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token_xyz&hub.challenge=test_challenge_val_123"
        r_invalid = client.get(invalid_url)
        assert r_invalid.status_code == 403

        report["WEBHOOK_VERIFICATION"] = "PASS"
        print("[PASS] GET /api/whatsapp/webhook -> Valid returns challenge (200), Invalid returns 403.")
    except Exception as e:
        report["WEBHOOK_VERIFICATION"] = f"FAIL ({e})"
        print(f"[FAIL] Webhook verification error: {e}")

    # 4. WhatsApp POST Webhook Test
    try:
        mock_payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "id": "123456789",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "contacts": [{"profile": {"name": "Test Student"}, "wa_id": "919876500001"}],
                        "messages": [{
                            "from": "919876500001",
                            "id": "wamid.test_val_01",
                            "timestamp": "1700000000",
                            "text": {"body": "What is the team size rule for SIH?"},
                            "type": "text"
                        }]
                    },
                    "field": "messages"
                }]
            }]
        }

        with patch.object(WhatsAppService, 'send_whatsapp_message', new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True
            r_post = client.post("/api/whatsapp/webhook", json=mock_payload)
            assert r_post.status_code == 200
            assert r_post.json().get("status") == "EVENT_RECEIVED"
            mock_send.assert_called_once()
            recipient, body = mock_send.call_args[0]
            assert recipient == "919876500001"
            assert "6" in body or "member" in body.lower()

        report["WHATSAPP_WEBHOOK"] = "PASS"
        print("[PASS] POST /api/whatsapp/webhook -> 200 OK (EVENT_RECEIVED, AI response dispatched).")
    except Exception as e:
        report["WHATSAPP_WEBHOOK"] = f"FAIL ({e})"
        print(f"[FAIL] POST webhook error: {e}")

    # 5. Local Chat /api/chat Test
    try:
        r_chat = client.post("/api/chat", json={
            "phone": "+919876500001",
            "name": "Aarav Sharma",
            "team_id": "SIH_TM_1042",
            "message": "What is the PPT format for SIH?"
        })
        assert r_chat.status_code == 200
        chat_data = r_chat.json()
        assert "response" in chat_data
        print(f"[PASS] POST /api/chat -> 200 OK (Response generated).")
    except Exception as e:
        print(f"[FAIL] Local chat endpoint error: {e}")

    # 6. OpenRouter Live Connection Test
    if settings.is_openrouter_configured:
        try:
            test_resp = await AIService.generate_response("According to the SIH knowledge base, what is the team size?")
            if test_resp and len(test_resp.strip()) > 0:
                report["OPENROUTER_API"] = "PASS"
                print(f"[PASS] OpenRouter API connection verified live.")
            else:
                report["OPENROUTER_API"] = "FAIL (Empty response)"
        except Exception as e:
            report["OPENROUTER_API"] = f"FAIL ({e})"
    else:
        report["OPENROUTER_API"] = "SKIPPED (missing environment variable)"
        print("[SKIP] OpenRouter test skipped (key missing).")

    # 7. Vercel & Knowledge Directory Path Compatibility Check
    try:
        from knowledge_service import KnowledgeService
        docs = KnowledgeService.load_markdown_files()
        assert len(docs) >= 4, f"Expected 4 static markdown files, got {len(docs)}"
        report["VERCEL_COMPATIBILITY"] = "PASS"
        print(f"[PASS] Vercel serverless path resolution verified ({len(docs)} knowledge files loaded).")
    except Exception as e:
        report["VERCEL_COMPATIBILITY"] = f"FAIL ({e})"
        print(f"[FAIL] Knowledge path resolution error: {e}")

    # 8. Security Check
    try:
        gitignore_path = ROOT_DIR / ".gitignore"
        assert gitignore_path.exists()
        gitignore_content = gitignore_path.read_text(encoding="utf-8")
        assert ".env" in gitignore_content
        report["SECURITY_CHECK"] = "PASS"
        print("[PASS] Security check verified (.env ignored in git).")
    except Exception as e:
        report["SECURITY_CHECK"] = f"FAIL ({e})"

    print("\n==================================================")
    print("   VALIDATION SUMMARY")
    print("==================================================")
    for k, v in report.items():
        print(f"   {k} = {v}")

if __name__ == "__main__":
    asyncio.run(run_all_checks())
