import json
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from config import settings

logger = logging.getLogger("sih_helpdesk.firebase")

# Check if firebase_admin is available and credentials are configured
db = None
_is_real_firebase = False

if settings.is_firebase_configured:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Replace escaped newlines if private key is passed as string in env
        formatted_private_key = settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
        cred_dict = {
            "type": "service_account",
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key": formatted_private_key,
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "token_uri": "https://oauth2.googleapis.com/token",
        }
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        _is_real_firebase = True
        logger.info("Connected to Firebase Firestore successfully.")
    except Exception as e:
        logger.warning(f"Failed to initialize real Firebase Firestore: {e}. Falling back to local data store.")
        _is_real_firebase = False
        db = None
else:
    logger.info("Firebase credentials not set in .env. Using structured local data store for local development.")


# ==========================================
# Local Fallback Store Implementation
# ==========================================
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_FILE = DATA_DIR / "local_store.json"

DEFAULT_DATA: Dict[str, Any] = {
    "users": {
        "user_919876500001": {
            "user_id": "user_919876500001",
            "name": "Aarav Sharma",
            "phone": "+919876500001",
            "team_id": "SIH_TM_1042",
            "role": "Team Leader",
            "created_at": "2025-01-10T10:00:00Z"
        },
        "user_919876500002": {
            "user_id": "user_919876500002",
            "name": "Priya Patel",
            "phone": "+919876500002",
            "team_id": "SIH_TM_1042",
            "role": "Developer",
            "created_at": "2025-01-10T10:05:00Z"
        },
        "user_919876500003": {
            "user_id": "user_919876500003",
            "name": "Rohan Deshmukh",
            "phone": "+919876500003",
            "team_id": "SIH_TM_2088",
            "role": "Team Leader",
            "created_at": "2025-01-11T14:30:00Z"
        }
    },
    "teams": {
        "SIH_TM_1042": {
            "team_id": "SIH_TM_1042",
            "team_name": "CodeCrafters Hub",
            "leader_name": "Aarav Sharma",
            "leader_phone": "+919876500001",
            "problem_statement": "SIH1620 - AI Helpdesk for Smart Governance",
            "category": "Software Edition",
            "college": "National Institute of Technology",
            "members": [
                "Aarav Sharma (TL)",
                "Priya Patel",
                "Karan Verma",
                "Ananya Singh",
                "Rishi Mehta",
                "Deepika Joshi"
            ],
            "created_at": "2025-01-10T09:30:00Z"
        },
        "SIH_TM_2088": {
            "team_id": "SIH_TM_2088",
            "team_name": "RoboKnights",
            "leader_name": "Rohan Deshmukh",
            "leader_phone": "+919876500003",
            "problem_statement": "SIH1450 - Smart IoT Waste Sorter",
            "category": "Hardware Edition",
            "college": "College of Engineering Pune",
            "members": [
                "Rohan Deshmukh (TL)",
                "Sneha Kulkarni",
                "Vikas Shinde",
                "Pooja Nair",
                "Aditya Rao",
                "Manish Gupta"
            ],
            "created_at": "2025-01-11T14:00:00Z"
        }
    },
    "conversations": {},
    "messages": {},
    "tickets": {
        "tkt_demo_1": {
            "ticket_id": "tkt_demo_1",
            "user_id": "user_919876500001",
            "user_name": "Aarav Sharma",
            "phone_number": "+919876500001",
            "team_id": "SIH_TM_1042",
            "question": "Can we change our team mentor before the Grand Finale?",
            "conversation_id": "conv_919876500001",
            "created_at": "2025-01-12T11:20:00Z",
            "resolved_at": None,
            "priority": "HIGH",
            "status": "PENDING",
            "admin_notes": ""
        }
    },
    "call_requests": {
        "req_demo_1": {
            "request_id": "req_demo_1",
            "user_id": "user_919876500003",
            "name": "Rohan Deshmukh",
            "phone": "+919876500003",
            "team_id": "SIH_TM_2088",
            "reason": "Clarification on hardware components shipment to Nodal Center",
            "created_at": "2025-01-12T15:45:00Z",
            "status": "PENDING",
            "admin_notes": ""
        }
    },
    "knowledge_base": {
        "kb_1": {
            "id": "kb_1",
            "title": "Mandatory Female Participant Rule",
            "category": "Rules",
            "content": "Every SIH 6-member team must include at least 1 female participant. Teams failing this criterion will be rejected during verification.",
            "tags": ["team", "female", "rules", "eligibility"],
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z"
        },
        "kb_2": {
            "id": "kb_2",
            "title": "Standard Idea Presentation Format",
            "category": "Presentation",
            "content": "Idea presentations should be 5-7 slides containing problem approach, architecture, feasibility, novelty, and commercial viability.",
            "tags": ["ppt", "presentation", "slides", "submission"],
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z"
        }
    },
    "admins": {
        "admin_1": {
            "admin_id": "admin_1",
            "name": "SIH SPOC Admin",
            "email": "admin@sihhelpdesk.ac.in",
            "phone": settings.ADMIN_PHONE_NUMBER,
            "role": "SUPER_ADMIN"
        }
    }
}


import copy

_in_memory_cache: Optional[Dict[str, Any]] = None


def _load_local_data() -> Dict[str, Any]:
    global _in_memory_cache
    if _in_memory_cache is not None:
        return _in_memory_cache

    try:
        if not DATA_DIR.exists():
            DATA_DIR.mkdir(parents=True, exist_ok=True)
        if not DATA_FILE.exists():
            with open(DATA_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_DATA, f, indent=2)
            _in_memory_cache = copy.deepcopy(DEFAULT_DATA)
            return _in_memory_cache
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            _in_memory_cache = json.load(f)
            return _in_memory_cache
    except Exception as e:
        logger.warning(f"Local storage disk access failed ({e}); using resilient in-memory cache.")
        _in_memory_cache = copy.deepcopy(DEFAULT_DATA)
        return _in_memory_cache


def _save_local_data(data: Dict[str, Any]):
    global _in_memory_cache
    _in_memory_cache = data
    try:
        if not DATA_DIR.exists():
            DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.debug(f"Local storage disk write skipped in serverless read-only mode ({e}).")


class FirebaseService:
    @staticmethod
    def is_cloud_mode() -> bool:
        return _is_real_firebase

    # ==================== USERS & TEAMS ====================
    @staticmethod
    async def get_or_create_user(phone: str, name: Optional[str] = None, team_id: Optional[str] = None) -> Dict[str, Any]:
        phone_key = phone.replace("+", "").replace(" ", "").strip()
        user_id = f"user_{phone_key}"
        now_str = datetime.now(timezone.utc).isoformat()

        if _is_real_firebase and db:
            doc_ref = db.collection("users").document(user_id)
            doc = doc_ref.get()
            if doc.exists:
                user_data = doc.to_dict()
                if name and user_data.get("name") != name:
                    doc_ref.update({"name": name})
                    user_data["name"] = name
                return user_data
            else:
                new_user = {
                    "user_id": user_id,
                    "phone": phone,
                    "name": name or f"Student ({phone[-4:]})",
                    "team_id": team_id or "SIH_TM_1042",
                    "role": "Participant",
                    "created_at": now_str
                }
                doc_ref.set(new_user)
                return new_user
        else:
            data = _load_local_data()
            users = data.setdefault("users", {})
            if user_id in users:
                if name:
                    users[user_id]["name"] = name
                return users[user_id]
            else:
                new_user = {
                    "user_id": user_id,
                    "phone": phone,
                    "name": name or f"Student ({phone[-4:] if len(phone)>=4 else phone})",
                    "team_id": team_id or "SIH_TM_1042",
                    "role": "Participant",
                    "created_at": now_str
                }
                users[user_id] = new_user
                _save_local_data(data)
                return new_user

    @staticmethod
    async def get_all_users() -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            docs = db.collection("users").stream()
            return [doc.to_dict() for doc in docs]
        else:
            data = _load_local_data()
            return list(data.get("users", {}).values())

    @staticmethod
    async def get_all_teams() -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            docs = db.collection("teams").stream()
            return [doc.to_dict() for doc in docs]
        else:
            data = _load_local_data()
            return list(data.get("teams", {}).values())

    @staticmethod
    async def create_team(team_data: Dict[str, Any]) -> Dict[str, Any]:
        team_id = team_data.get("team_id") or f"SIH_TM_{uuid.uuid4().hex[:6].upper()}"
        team_data["team_id"] = team_id
        team_data["created_at"] = datetime.now(timezone.utc).isoformat()

        if _is_real_firebase and db:
            db.collection("teams").document(team_id).set(team_data)
        else:
            data = _load_local_data()
            data.setdefault("teams", {})[team_id] = team_data
            _save_local_data(data)
        return team_data

    # ==================== MESSAGES & CONVERSATIONS ====================
    @staticmethod
    async def save_message(
        conversation_id: str,
        user_id: str,
        sender: str,  # 'user' | 'assistant' | 'admin'
        message: str,
        source: str = "whatsapp",  # 'whatsapp' | 'local_web'
        user_name: Optional[str] = None,
        phone: Optional[str] = None
    ) -> Dict[str, Any]:
        msg_id = f"msg_{uuid.uuid4().hex[:10]}"
        timestamp = datetime.now(timezone.utc).isoformat()

        msg_obj = {
            "message_id": msg_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "sender": sender,
            "message": message,
            "timestamp": timestamp,
            "source": source
        }

        if _is_real_firebase and db:
            db.collection("messages").document(msg_id).set(msg_obj)
            conv_ref = db.collection("conversations").document(conversation_id)
            conv_doc = conv_ref.get()
            conv_data = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "user_name": user_name or "Student",
                "phone": phone or "",
                "last_message": message,
                "last_sender": sender,
                "last_updated": timestamp,
                "status": "ACTIVE"
            }
            if not conv_doc.exists:
                conv_data["created_at"] = timestamp
            conv_ref.set(conv_data, merge=True)
        else:
            data = _load_local_data()
            data.setdefault("messages", {})[msg_id] = msg_obj
            convs = data.setdefault("conversations", {})
            if conversation_id not in convs:
                convs[conversation_id] = {
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "user_name": user_name or "Student",
                    "phone": phone or "",
                    "last_message": message,
                    "last_sender": sender,
                    "last_updated": timestamp,
                    "created_at": timestamp,
                    "status": "ACTIVE"
                }
            else:
                convs[conversation_id].update({
                    "last_message": message,
                    "last_sender": sender,
                    "last_updated": timestamp,
                    "user_name": user_name or convs[conversation_id].get("user_name", "Student"),
                    "phone": phone or convs[conversation_id].get("phone", "")
                })
            _save_local_data(data)

        return msg_obj

    @staticmethod
    async def get_conversation_history(conversation_id: str, limit_count: int = 10) -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            docs = db.collection("messages")\
                .where("conversation_id", "==", conversation_id)\
                .order_by("timestamp", direction=firestore.Query.DESCENDING)\
                .limit(limit_count)\
                .stream()
            messages = [doc.to_dict() for doc in docs]
            messages.reverse()
            return messages
        else:
            data = _load_local_data()
            all_msgs = [m for m in data.get("messages", {}).values() if m.get("conversation_id") == conversation_id]
            all_msgs.sort(key=lambda x: x.get("timestamp", ""))
            return all_msgs[-limit_count:]

    @staticmethod
    async def get_all_conversations() -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            docs = db.collection("conversations").order_by("last_updated", direction=firestore.Query.DESCENDING).stream()
            return [doc.to_dict() for doc in docs]
        else:
            data = _load_local_data()
            convs = list(data.get("conversations", {}).values())
            convs.sort(key=lambda x: x.get("last_updated", ""), reverse=True)
            return convs

    # ==================== TICKETS ====================
    @staticmethod
    async def create_ticket(
        user_id: str,
        user_name: str,
        phone_number: str,
        team_id: str,
        question: str,
        conversation_id: str,
        priority: str = "MEDIUM"
    ) -> Dict[str, Any]:
        ticket_id = f"tkt_{uuid.uuid4().hex[:8]}"
        created_at = datetime.now(timezone.utc).isoformat()
        ticket_data = {
            "ticket_id": ticket_id,
            "user_id": user_id,
            "user_name": user_name,
            "phone_number": phone_number,
            "team_id": team_id,
            "question": question,
            "conversation_id": conversation_id,
            "created_at": created_at,
            "resolved_at": None,
            "priority": priority,
            "status": "PENDING",
            "admin_notes": ""
        }

        if _is_real_firebase and db:
            db.collection("tickets").document(ticket_id).set(ticket_data)
        else:
            data = _load_local_data()
            data.setdefault("tickets", {})[ticket_id] = ticket_data
            _save_local_data(data)
        logger.info(f"Created Support Ticket: {ticket_id} for {user_name} ({phone_number})")
        return ticket_data

    @staticmethod
    async def get_all_tickets(status: Optional[str] = None) -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            query = db.collection("tickets")
            if status:
                query = query.where("status", "==", status)
            docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
            return [doc.to_dict() for doc in docs]
        else:
            data = _load_local_data()
            tickets = list(data.get("tickets", {}).values())
            if status:
                tickets = [t for t in tickets if t.get("status") == status]
            tickets.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return tickets

    @staticmethod
    async def update_ticket(ticket_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if _is_real_firebase and db:
            doc_ref = db.collection("tickets").document(ticket_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            doc_ref.update(update_fields)
            updated = doc_ref.get().to_dict()
            return updated
        else:
            data = _load_local_data()
            tickets = data.setdefault("tickets", {})
            if ticket_id not in tickets:
                return None
            tickets[ticket_id].update(update_fields)
            if update_fields.get("status") == "RESOLVED" and not tickets[ticket_id].get("resolved_at"):
                tickets[ticket_id]["resolved_at"] = datetime.now(timezone.utc).isoformat()
            _save_local_data(data)
            return tickets[ticket_id]

    # ==================== CALL REQUESTS ====================
    @staticmethod
    async def create_call_request(
        user_id: str,
        name: str,
        phone: str,
        team_id: str,
        reason: str
    ) -> Dict[str, Any]:
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        created_at = datetime.now(timezone.utc).isoformat()
        call_data = {
            "request_id": request_id,
            "user_id": user_id,
            "name": name,
            "phone": phone,
            "team_id": team_id,
            "reason": reason,
            "created_at": created_at,
            "status": "PENDING",
            "admin_notes": ""
        }

        if _is_real_firebase and db:
            db.collection("call_requests").document(request_id).set(call_data)
        else:
            data = _load_local_data()
            data.setdefault("call_requests", {})[request_id] = call_data
            _save_local_data(data)
        logger.info(f"Created Call Request: {request_id} for {name} ({phone})")
        return call_data

    @staticmethod
    async def get_all_call_requests(status: Optional[str] = None) -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            query = db.collection("call_requests")
            if status:
                query = query.where("status", "==", status)
            docs = query.order_by("created_at", direction=firestore.Query.DESCENDING).stream()
            return [doc.to_dict() for doc in docs]
        else:
            data = _load_local_data()
            calls = list(data.get("call_requests", {}).values())
            if status:
                calls = [c for c in calls if c.get("status") == status]
            calls.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return calls

    @staticmethod
    async def update_call_request(request_id: str, update_fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if _is_real_firebase and db:
            doc_ref = db.collection("call_requests").document(request_id)
            doc = doc_ref.get()
            if not doc.exists:
                return None
            doc_ref.update(update_fields)
            return doc_ref.get().to_dict()
        else:
            data = _load_local_data()
            calls = data.setdefault("call_requests", {})
            if request_id not in calls:
                return None
            calls[request_id].update(update_fields)
            _save_local_data(data)
            return calls[request_id]

    # ==================== KNOWLEDGE BASE ====================
    @staticmethod
    async def get_all_knowledge() -> List[Dict[str, Any]]:
        if _is_real_firebase and db:
            docs = db.collection("knowledge_base").stream()
            return [doc.to_dict() for doc in docs]
        else:
            data = _load_local_data()
            return list(data.get("knowledge_base", {}).values())

    @staticmethod
    async def save_knowledge(kb_item: Dict[str, Any]) -> Dict[str, Any]:
        kb_id = kb_item.get("id") or f"kb_{uuid.uuid4().hex[:8]}"
        kb_item["id"] = kb_id
        now_str = datetime.now(timezone.utc).isoformat()
        if "created_at" not in kb_item:
            kb_item["created_at"] = now_str
        kb_item["updated_at"] = now_str

        if _is_real_firebase and db:
            db.collection("knowledge_base").document(kb_id).set(kb_item)
        else:
            data = _load_local_data()
            data.setdefault("knowledge_base", {})[kb_id] = kb_item
            _save_local_data(data)
        return kb_item

    @staticmethod
    async def delete_knowledge(kb_id: str) -> bool:
        if _is_real_firebase and db:
            db.collection("knowledge_base").document(kb_id).delete()
            return True
        else:
            data = _load_local_data()
            kb = data.setdefault("knowledge_base", {})
            if kb_id in kb:
                del kb[kb_id]
                _save_local_data(data)
                return True
            return False

    # ==================== DASHBOARD STATS ====================
    @staticmethod
    async def get_dashboard_stats() -> Dict[str, Any]:
        users = await FirebaseService.get_all_users()
        teams = await FirebaseService.get_all_teams()
        tickets = await FirebaseService.get_all_tickets()
        call_requests = await FirebaseService.get_all_call_requests()
        conversations = await FirebaseService.get_all_conversations()

        if _is_real_firebase and db:
            messages_count = len(list(db.collection("messages").stream()))
        else:
            data = _load_local_data()
            messages_count = len(data.get("messages", {}))

        pending_tickets = [t for t in tickets if t.get("status") == "PENDING"]
        resolved_tickets = [t for t in tickets if t.get("status") == "RESOLVED"]
        pending_calls = [c for c in call_requests if c.get("status") == "PENDING"]

        user_msgs_count = max(0, messages_count // 2) if messages_count > 0 else 0
        ai_resolved_count = max(0, user_msgs_count - len(tickets))

        return {
            "total_users": len(users),
            "total_teams": len(teams),
            "total_questions": max(user_msgs_count, len(conversations)),
            "ai_resolved": ai_resolved_count,
            "pending_tickets": len(pending_tickets),
            "resolved_tickets": len(resolved_tickets),
            "pending_call_requests": len(pending_calls),
            "total_conversations": len(conversations),
            "is_cloud_mode": _is_real_firebase
        }
