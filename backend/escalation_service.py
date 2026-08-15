import logging
import re
from typing import Any, Dict, Optional, Tuple
from firebase_service import FirebaseService

logger = logging.getLogger("sih_helpdesk.escalation")

# In-memory tracking of conversation states for multi-turn prompts
# Maps conversation_id / phone -> { "state": str, "last_question": str, "reason": str }
_conversation_states: Dict[str, Dict[str, Any]] = {}


class EscalationService:
    @staticmethod
    def get_state(conv_id: str) -> Dict[str, Any]:
        return _conversation_states.get(conv_id, {"state": "IDLE"})

    @staticmethod
    def set_state(conv_id: str, state: str, **kwargs):
        data = _conversation_states.setdefault(conv_id, {})
        data["state"] = state
        data.update(kwargs)

    @staticmethod
    def clear_state(conv_id: str):
        if conv_id in _conversation_states:
            del _conversation_states[conv_id]

    @classmethod
    async def process_user_intent(
        cls,
        conv_id: str,
        user_message: str,
        user_data: Dict[str, Any]
    ) -> Tuple[bool, Optional[str]]:
        """
        Returns (handled: bool, response_message: Optional[str])
        If handled is True, the escalation/call-request state machine generated the response.
        If handled is False, the message proceeds to normal AI generation.
        """
        text = user_message.strip()
        text_lower = text.lower()
        state_data = cls.get_state(conv_id)
        current_state = state_data.get("state", "IDLE")

        user_id = user_data.get("user_id", "user_unknown")
        user_name = user_data.get("name", "Student")
        phone = user_data.get("phone", "Unknown")
        team_id = user_data.get("team_id", "SIH_TM_1042")

        # 1. State: AWAITING_CALL_CONFIRM
        if current_state == "AWAITING_CALL_CONFIRM":
            if text_lower in ("yes", "y", "sure", "ok", "please", "request call", "1"):
                cls.set_state(conv_id, "AWAITING_CALL_REASON")
                return True, "📞 Please briefly tell me the reason for your call request so the admin is prepared."
            elif text_lower in ("no", "n", "cancel", "nevermind", "2"):
                cls.clear_state(conv_id)
                return True, "👍 Call request cancelled. How else can I help your SIH team?"
            else:
                # If they provided a reason directly
                call_req = await FirebaseService.create_call_request(
                    user_id=user_id,
                    name=user_name,
                    phone=phone,
                    team_id=team_id,
                    reason=text
                )
                cls.clear_state(conv_id)
                return True, (
                    f"✅ *Call Request Registered!*\n\n"
                    f"• *Request ID:* `{call_req['request_id']}`\n"
                    f"• *Student:* {user_name}\n"
                    f"• *Phone:* {phone}\n"
                    f"• *Status:* PENDING\n\n"
                    f"Our SIH Admin will call you at *{phone}* as soon as possible."
                )

        # 2. State: AWAITING_CALL_REASON
        if current_state == "AWAITING_CALL_REASON":
            reason = text
            call_req = await FirebaseService.create_call_request(
                user_id=user_id,
                name=user_name,
                phone=phone,
                team_id=team_id,
                reason=reason
            )
            cls.clear_state(conv_id)
            return True, (
                f"✅ *Call Request Registered!*\n\n"
                f"• *Request ID:* `{call_req['request_id']}`\n"
                f"• *Student:* {user_name}\n"
                f"• *Phone:* {phone}\n"
                f"• *Reason:* {reason}\n"
                f"• *Status:* PENDING\n\n"
                f"Our SIH Admin has been notified and will call you soon."
            )

        # 3. State: AWAITING_ESCALATION_CONFIRM
        if current_state == "AWAITING_ESCALATION_CONFIRM":
            last_question = state_data.get("last_question", "General SIH Query")
            if text_lower in ("yes", "y", "sure", "ok", "please", "connect", "1"):
                ticket = await FirebaseService.create_ticket(
                    user_id=user_id,
                    user_name=user_name,
                    phone_number=phone,
                    team_id=team_id,
                    question=last_question,
                    conversation_id=conv_id,
                    priority="HIGH"
                )
                cls.clear_state(conv_id)
                return True, (
                    f"🎫 *Support Ticket Created!*\n\n"
                    f"• *Ticket ID:* `{ticket['ticket_id']}`\n"
                    f"• *Status:* PENDING\n"
                    f"• *Query:* {last_question}\n\n"
                    f"An SIH Admin has been notified and will review your question. You will receive an update here on WhatsApp."
                )
            elif text_lower in ("no", "n", "cancel", "2"):
                cls.clear_state(conv_id)
                return True, "👌 Understood. What other questions do you have about your SIH project?"

        # 4. Direct triggers for Call Request
        call_triggers = [
            "talk to admin", "speak with admin", "call me", "request call",
            "request a call", "phone call", "talk to human", "speak to mentor",
            "voice call", "admin call"
        ]
        if any(trigger in text_lower for trigger in call_triggers):
            cls.set_state(conv_id, "AWAITING_CALL_CONFIRM")
            return True, (
                "Sure. Would you like to request a call from the admin?\n\n"
                "Reply *YES* or *NO*"
            )

        # 5. Direct triggers for Escalation / Support Ticket
        escalate_triggers = [
            "escalate", "contact admin", "create ticket", "raise ticket",
            "human agent", "talk to support", "admin support", "file complaint"
        ]
        if any(trigger in text_lower for trigger in escalate_triggers):
            cls.set_state(conv_id, "AWAITING_ESCALATION_CONFIRM", last_question=text)
            return True, (
                "Would you like me to connect you with the admin and create a support ticket?\n\n"
                "Reply *YES* or *NO*"
            )

        # Not intercepted by state machine; continue to AI
        return False, None
