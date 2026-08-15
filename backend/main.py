import logging
import sys
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, Query, Request, Response, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import settings
from firebase_service import FirebaseService
from knowledge_service import KnowledgeService
from ai_service import AIService
from whatsapp_service import WhatsAppService

# ==================== STRUCTURED LOGGING ====================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("sih_helpdesk.main")

# ==================== FASTAPI APP INITIALIZATION ====================
app = FastAPI(
    title="SIH AI WhatsApp Helpdesk API",
    description="Backend API for Smart India Hackathon AI WhatsApp Helpdesk",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== PYDANTIC SCHEMAS ====================
class LocalChatRequest(BaseModel):
    message: str = Field(..., description="Student message text")
    phone: str = Field("+919876500001", description="Student phone number")
    name: str = Field("Student Tester", description="Student name")
    team_id: Optional[str] = Field("SIH_TM_1042", description="Assigned team ID")


class AdminReplyRequest(BaseModel):
    message: str = Field(..., description="Admin message text to send to student")
    admin_name: str = Field("SIH Admin", description="Admin display name")


class TicketCreateRequest(BaseModel):
    user_id: str
    user_name: str
    phone_number: str
    team_id: str
    question: str
    conversation_id: str
    priority: str = "MEDIUM"


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None  # PENDING | RESOLVED
    admin_notes: Optional[str] = None
    priority: Optional[str] = None


class CallRequestCreate(BaseModel):
    user_id: str
    name: str
    phone: str
    team_id: str
    reason: str


class CallRequestUpdate(BaseModel):
    status: Optional[str] = None  # PENDING | CONTACTED | RESOLVED
    admin_notes: Optional[str] = None


class TeamCreateRequest(BaseModel):
    team_id: Optional[str] = None
    team_name: str
    leader_name: str
    leader_phone: str
    problem_statement: str
    category: str = "Software Edition"
    college: str
    members: List[str] = []


class KnowledgeItemSchema(BaseModel):
    id: Optional[str] = None
    title: str
    category: str = "General"  # SIH | Rules | Submission | Technical | Presentation | FAQ | Team | General
    content: str
    tags: List[str] = []


# ==================== HEALTH & STATS ====================
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "app": "SIH AI Helpdesk",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "services": {
            "openrouter_configured": settings.is_openrouter_configured,
            "openrouter_model": settings.OPENROUTER_MODEL,
            "firebase_mode": "cloud_firestore" if FirebaseService.is_cloud_mode() else "local_store",
            "whatsapp_configured": settings.is_whatsapp_configured
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/api/stats", tags=["Dashboard"])
async def get_dashboard_stats():
    """Returns real-time analytics for the Admin Dashboard."""
    return await FirebaseService.get_dashboard_stats()


# ==================== LOCAL AI CHAT TESTING (PHASE 3) ====================
@app.post("/api/chat", tags=["AI Chat Simulator"])
async def local_chat_endpoint(req: LocalChatRequest):
    """
    Local testing endpoint allowing testing of the full AI + Escalation pipeline without WhatsApp.
    """
    clean_phone = req.phone.strip()
    if not clean_phone:
        clean_phone = "+919876500001"

    response_text = await WhatsAppService.process_incoming_message(
        phone=clean_phone,
        user_name=req.name,
        message_text=req.message,
        source="local_web"
    )

    conv_id = f"conv_{clean_phone.replace('+', '').replace(' ', '')}"
    return {
        "status": "success",
        "conversation_id": conv_id,
        "phone": clean_phone,
        "name": req.name,
        "response": response_text,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ==================== WHATSAPP CLOUD API WEBHOOK ====================
@app.get("/api/whatsapp/webhook", tags=["WhatsApp"])
async def whatsapp_webhook_verification(
    hub_mode: Optional[str] = Query(None, alias="hub.mode"),
    hub_challenge: Optional[str] = Query(None, alias="hub.challenge"),
    hub_verify_token: Optional[str] = Query(None, alias="hub.verify_token")
):
    """
    Handles WhatsApp Cloud API Webhook verification challenge (GET request from Meta).
    """
    logger.info(f"Webhook verification attempt: mode={hub_mode}")
    verified, challenge = WhatsAppService.verify_webhook(hub_mode, hub_verify_token, hub_challenge)
    if verified and challenge:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch or invalid mode.")


@app.post("/api/whatsapp/webhook", tags=["WhatsApp"])
async def whatsapp_webhook_event(request: Request):
    """
    Handles incoming WhatsApp messages and notifications (POST request from Meta).
    Directly awaits processing to guarantee complete execution in serverless (Vercel) environments.
    """
    try:
        payload = await request.json()
        logger.info("Received WhatsApp webhook event payload.")
        await WhatsAppService.handle_incoming_webhook(payload)
        return {"status": "EVENT_RECEIVED"}
    except Exception as e:
        logger.error(f"Failed to process webhook payload: {e}")
        return {"status": "ERROR", "detail": str(e)}


# ==================== CONVERSATIONS & ADMIN DIRECT REPLY ====================
@app.get("/api/conversations", tags=["Conversations"])
async def list_conversations():
    """List all WhatsApp and local conversations."""
    return await FirebaseService.get_all_conversations()


@app.get("/api/conversations/{conv_id}/messages", tags=["Conversations"])
async def get_conversation_messages(conv_id: str, limit: int = Query(50, ge=1, le=100)):
    """Fetch complete message history for a conversation."""
    return await FirebaseService.get_conversation_history(conv_id, limit_count=limit)


@app.post("/api/conversations/{conv_id}/reply", tags=["Conversations"])
async def admin_reply_to_conversation(conv_id: str, req: AdminReplyRequest):
    """
    Allows admin from the dashboard to send a direct message into the student's conversation.
    Also sends outbound WhatsApp message if phone number exists.
    """
    convs = await FirebaseService.get_all_conversations()
    target_conv = next((c for c in convs if c.get("conversation_id") == conv_id), None)
    if not target_conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_id = target_conv.get("user_id", "unknown")
    phone = target_conv.get("phone", "")

    # Save admin message in database
    msg = await FirebaseService.save_message(
        conversation_id=conv_id,
        user_id=user_id,
        sender="admin",
        message=f"👨‍💼 *Admin ({req.admin_name}):*\n{req.message}",
        source="dashboard_admin",
        user_name=target_conv.get("user_name", "Student"),
        phone=phone
    )

    # If WhatsApp is configured and phone exists, dispatch WhatsApp message
    if phone and settings.is_whatsapp_configured:
        await WhatsAppService.send_whatsapp_message(phone, f"👨‍💼 *Admin Reply:*\n{req.message}")

    return {"status": "success", "message": msg}


# ==================== USERS & TEAMS ====================
@app.get("/api/users", tags=["Users"])
async def list_users():
    return await FirebaseService.get_all_users()


@app.get("/api/teams", tags=["Teams"])
async def list_teams():
    return await FirebaseService.get_all_teams()


@app.post("/api/teams", tags=["Teams"], status_code=status.HTTP_201_CREATED)
async def create_team(req: TeamCreateRequest):
    return await FirebaseService.create_team(req.model_dump())


# ==================== SUPPORT TICKETS (ESCALATION) ====================
@app.get("/api/tickets", tags=["Tickets"])
async def list_tickets(status: Optional[str] = Query(None, description="Filter by PENDING or RESOLVED")):
    return await FirebaseService.get_all_tickets(status=status)


@app.post("/api/tickets", tags=["Tickets"], status_code=status.HTTP_201_CREATED)
async def create_ticket(req: TicketCreateRequest):
    return await FirebaseService.create_ticket(
        user_id=req.user_id,
        user_name=req.user_name,
        phone_number=req.phone_number,
        team_id=req.team_id,
        question=req.question,
        conversation_id=req.conversation_id,
        priority=req.priority
    )


@app.put("/api/tickets/{ticket_id}", tags=["Tickets"])
async def update_ticket(ticket_id: str, req: TicketUpdateRequest):
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    updated = await FirebaseService.update_ticket(ticket_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return updated


# ==================== CALL REQUESTS ====================
@app.get("/api/call-requests", tags=["Call Requests"])
async def list_call_requests(status: Optional[str] = Query(None, description="Filter by PENDING, CONTACTED, or RESOLVED")):
    return await FirebaseService.get_all_call_requests(status=status)


@app.post("/api/call-requests", tags=["Call Requests"], status_code=status.HTTP_201_CREATED)
async def create_call_request(req: CallRequestCreate):
    return await FirebaseService.create_call_request(
        user_id=req.user_id,
        name=req.name,
        phone=req.phone,
        team_id=req.team_id,
        reason=req.reason
    )


@app.put("/api/call-requests/{request_id}", tags=["Call Requests"])
async def update_call_request(request_id: str, req: CallRequestUpdate):
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    updated = await FirebaseService.update_call_request(request_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Call request not found")
    return updated


# ==================== KNOWLEDGE BASE CRUD ====================
@app.get("/api/knowledge", tags=["Knowledge Base"])
async def list_all_knowledge():
    """
    Returns both markdown files and dynamic Firestore knowledge entries.
    """
    # 1. Local markdown docs
    md_docs = KnowledgeService.load_markdown_files()
    # 2. Dynamic DB docs
    db_items = await FirebaseService.get_all_knowledge()

    return {
        "static_files": md_docs,
        "dynamic_items": db_items
    }


@app.post("/api/knowledge", tags=["Knowledge Base"], status_code=status.HTTP_201_CREATED)
async def add_knowledge_item(req: KnowledgeItemSchema):
    return await FirebaseService.save_knowledge(req.model_dump())


@app.put("/api/knowledge/{kb_id}", tags=["Knowledge Base"])
async def update_knowledge_item(kb_id: str, req: KnowledgeItemSchema):
    data = req.model_dump()
    data["id"] = kb_id
    return await FirebaseService.save_knowledge(data)


@app.delete("/api/knowledge/{kb_id}", tags=["Knowledge Base"])
async def delete_knowledge_item(kb_id: str):
    deleted = await FirebaseService.delete_knowledge(kb_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return {"status": "deleted", "id": kb_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
