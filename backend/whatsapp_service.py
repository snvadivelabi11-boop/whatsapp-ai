import logging
import httpx
from typing import Any, Dict, Optional, Tuple
from config import settings
from firebase_service import FirebaseService
from escalation_service import EscalationService
from ai_service import AIService

logger = logging.getLogger("sih_helpdesk.whatsapp")


class WhatsAppService:
    @staticmethod
    def verify_webhook(hub_mode: Optional[str], hub_token: Optional[str], hub_challenge: Optional[str]) -> Tuple[bool, Optional[str]]:
        """
        Handles Meta webhook verification handshake GET request.
        """
        if hub_mode == "subscribe" and hub_token == settings.WHATSAPP_VERIFY_TOKEN:
            logger.info("WhatsApp webhook verified successfully.")
            return True, hub_challenge
        logger.warning(f"WhatsApp webhook verification failed. Token mismatch or invalid mode: mode={hub_mode}")
        return False, None

    @classmethod
    async def process_incoming_message(
        cls,
        phone: str,
        user_name: str,
        message_text: str,
        source: str = "whatsapp"
    ) -> str:
        """
        End-to-end processing pipeline for an incoming user message.
        Used by both WhatsApp Webhook and the local test chat endpoint.
        """
        conv_id = f"conv_{phone.replace('+', '').replace(' ', '')}"

        # 1. Identify or register user in Firestore
        user_data = await FirebaseService.get_or_create_user(
            phone=phone,
            name=user_name
        )
        user_id = user_data.get("user_id")

        # 2. Save user message in conversation history
        await FirebaseService.save_message(
            conversation_id=conv_id,
            user_id=user_id,
            sender="user",
            message=message_text,
            source=source,
            user_name=user_name,
            phone=phone
        )

        # 3. Check for welcome / greeting if user explicitly says hi/start/menu
        text_clean = message_text.strip().lower()
        if text_clean in ("hi", "hello", "hey", "start", "menu", "help", "/start"):
            welcome_msg = (
                "👋 *Welcome to SIH AI Helpdesk!*\n\n"
                "I can help you with:\n\n"
                "1️⃣ *SIH Information & Guidelines*\n"
                "2️⃣ *Team Rules & Eligibility*\n"
                "3️⃣ *Idea PPT & Submission Help*\n"
                "4️⃣ *Evaluation Criteria*\n"
                "5️⃣ *Technical & Architecture Doubts*\n"
                "6️⃣ *Contact Admin / Request Call*\n\n"
                "💬 *Just type your question or doubt below.*"
            )
            await FirebaseService.save_message(
                conversation_id=conv_id,
                user_id=user_id,
                sender="assistant",
                message=welcome_msg,
                source=source,
                user_name=user_name,
                phone=phone
            )
            return welcome_msg

        # 4. Check Escalation & Call Request State Machine
        handled_by_escalation, escalation_resp = await EscalationService.process_user_intent(
            conv_id=conv_id,
            user_message=message_text,
            user_data=user_data
        )

        if handled_by_escalation and escalation_resp:
            await FirebaseService.save_message(
                conversation_id=conv_id,
                user_id=user_id,
                sender="assistant",
                message=escalation_resp,
                source=source,
                user_name=user_name,
                phone=phone
            )
            return escalation_resp

        # 5. Fetch conversation history for AI context
        history = await FirebaseService.get_conversation_history(conv_id, limit_count=6)

        # 6. Generate AI response via OpenRouter (with SIH Knowledge Base grounding)
        ai_response = await AIService.generate_response(
            user_message=message_text,
            conversation_history=history,
            user_context=user_data
        )

        # If AI offered escalation in its response, set state to await YES/NO
        if "connect you with the admin" in ai_response.lower() or "reply yes or no" in ai_response.lower():
            EscalationService.set_state(conv_id, "AWAITING_ESCALATION_CONFIRM", last_question=message_text)

        # 7. Save AI response
        await FirebaseService.save_message(
            conversation_id=conv_id,
            user_id=user_id,
            sender="assistant",
            message=ai_response,
            source=source,
            user_name=user_name,
            phone=phone
        )

        return ai_response

    @classmethod
    async def handle_incoming_webhook(cls, payload: Dict[str, Any]):
        """
        Parses Meta WhatsApp Webhook event payload and triggers responses.
        """
        try:
            entry = payload.get("entry", [])[0]
            changes = entry.get("changes", [])[0]
            value = changes.get("value", {})

            # Check if messages list exists in payload
            messages = value.get("messages", [])
            if not messages:
                logger.info("Received WhatsApp webhook event without messages (status update/acknowledgement).")
                return

            contacts = value.get("contacts", [])
            user_name = contacts[0].get("profile", {}).get("name", "Student") if contacts else "Student"

            for msg in messages:
                sender_phone = msg.get("from", "")
                msg_type = msg.get("type", "")

                text_content = ""
                if msg_type == "text":
                    text_content = msg.get("text", {}).get("body", "")
                elif msg_type == "interactive":
                    # Quick reply or list reply
                    interactive = msg.get("interactive", {})
                    if interactive.get("type") == "button_reply":
                        text_content = interactive.get("button_reply", {}).get("title", "")
                    elif interactive.get("type") == "list_reply":
                        text_content = interactive.get("list_reply", {}).get("title", "")
                elif msg_type == "button":
                    text_content = msg.get("button", {}).get("text", "")

                if not text_content:
                    logger.warning(f"Received unsupported message type: {msg_type}")
                    continue

                logger.info(f"Incoming WhatsApp message from {sender_phone} ({user_name}): {text_content}")

                # Process message through pipeline
                response_text = await cls.process_incoming_message(
                    phone=sender_phone,
                    user_name=user_name,
                    message_text=text_content,
                    source="whatsapp"
                )

                # Send reply back via WhatsApp Cloud API
                await cls.send_whatsapp_message(sender_phone, response_text)

        except Exception as e:
            logger.error(f"Error handling WhatsApp webhook: {e}", exc_info=True)

    @classmethod
    async def send_whatsapp_message(cls, to_phone: str, message_text: str) -> bool:
        """
        Dispatches outbound message via Meta WhatsApp Cloud API.
        """
        if not settings.is_whatsapp_configured:
            logger.info(f"[DEV MODE - NO WHATSAPP CREDENTIALS] Outbound to {to_phone}:\n{message_text}")
            return True

        clean_phone = to_phone.replace("+", "").replace(" ", "").strip()
        url = f"https://graph.facebook.com/{settings.WHATSAPP_API_VERSION}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": clean_phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message_text
            }
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code in (200, 201):
                    logger.info(f"WhatsApp message dispatched to {clean_phone} successfully.")
                    return True
                else:
                    logger.error(f"Failed to send WhatsApp message [{response.status_code}]: {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Exception sending WhatsApp message to {clean_phone}: {e}")
            return False
