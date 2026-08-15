import asyncio
import sys
from fastapi.testclient import TestClient
from main import app

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "SIH AI Helpdesk"
    print("[PASS] Health check passed:", data)

def test_stats():
    response = client.get("/api/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_teams" in data
    assert "pending_tickets" in data
    print("[PASS] Dashboard stats endpoint passed:", data)

def test_local_chat_faq():
    payload = {
        "message": "What is the team size rule and is a female member mandatory in SIH?",
        "phone": "+919876500001",
        "name": "Aarav Sharma",
        "team_id": "SIH_TM_1042"
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "6 members" in data["response"] or "female" in data["response"].lower()
    print("[PASS] Local chat FAQ response passed:", data["response"][:80], "...")

def test_call_request_flow():
    # 1. Trigger call intent
    payload1 = {
        "message": "I want to talk to admin",
        "phone": "+919876500099",
        "name": "Test Student",
        "team_id": "SIH_TM_1042"
    }
    res1 = client.post("/api/chat", json=payload1)
    assert res1.status_code == 200
    assert "request a call from the admin" in res1.json()["response"]

    # 2. Confirm YES
    payload2 = {
        "message": "YES",
        "phone": "+919876500099",
        "name": "Test Student",
        "team_id": "SIH_TM_1042"
    }
    res2 = client.post("/api/chat", json=payload2)
    assert res2.status_code == 200
    assert "tell me the reason" in res2.json()["response"].lower()

    # 3. Provide reason
    payload3 = {
        "message": "Hardware parts delivery delay to nodal center",
        "phone": "+919876500099",
        "name": "Test Student",
        "team_id": "SIH_TM_1042"
    }
    res3 = client.post("/api/chat", json=payload3)
    assert res3.status_code == 200
    assert "Call Request Registered" in res3.json()["response"]
    print("[PASS] Call Request multi-turn conversation flow passed!")

def test_escalation_ticket_flow():
    # 1. Trigger escalation
    payload1 = {
        "message": "I need to escalate my issue to human admin",
        "phone": "+919876500088",
        "name": "Escalation Tester",
        "team_id": "SIH_TM_2088"
    }
    res1 = client.post("/api/chat", json=payload1)
    assert res1.status_code == 200
    assert "create a support ticket" in res1.json()["response"].lower() or "connect you with the admin" in res1.json()["response"].lower()

    # 2. Confirm YES
    payload2 = {
        "message": "YES",
        "phone": "+919876500088",
        "name": "Escalation Tester",
        "team_id": "SIH_TM_2088"
    }
    res2 = client.post("/api/chat", json=payload2)
    assert res2.status_code == 200
    assert "Support Ticket Created" in res2.json()["response"]
    print("[PASS] Escalation Ticket multi-turn flow passed!")

def test_webhook_verification():
    res = client.get("/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=sih_ai_verify_token_secure_2025&hub.challenge=test_challenge_12345")
    assert res.status_code == 200
    assert res.text == "test_challenge_12345"
    print("[PASS] WhatsApp Webhook challenge verification passed!")

def test_knowledge_api():
    res = client.get("/api/knowledge")
    assert res.status_code == 200
    data = res.json()
    assert len(data.get("static_files", [])) >= 4
    print(f"[PASS] Knowledge Base API returned {len(data.get('static_files', []))} static files and {len(data.get('dynamic_items', []))} dynamic items.")

if __name__ == "__main__":
    print("--- RUNNING AUTOMATED E2E BACKEND SUITE ---")
    test_health()
    test_stats()
    test_local_chat_faq()
    test_call_request_flow()
    test_escalation_ticket_flow()
    test_webhook_verification()
    test_knowledge_api()
    print("--- ALL BACKEND SUITE TESTS PASSED! ---")
