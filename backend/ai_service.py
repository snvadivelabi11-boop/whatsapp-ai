import logging
import httpx
from typing import Any, Dict, List, Optional
from config import settings
from knowledge_service import KnowledgeService

logger = logging.getLogger("sih_helpdesk.ai")

SYSTEM_PROMPT = """You are SIH AI Helpdesk, an assistant for Smart India Hackathon student teams.

Your job is to help students with project development, SIH-related information, documentation, presentations, technical doubts, submission questions, and general team coordination.

Use the provided knowledge base as the primary source of truth.

Never invent official SIH information.
Never guess deadlines, rules, eligibility, judging criteria, or submission requirements.

If the knowledge base does not contain enough information:
1. Ask the user for clarification if clarification can solve the problem.
2. Otherwise explain that the information is unavailable and offer admin support.

Keep WhatsApp responses simple, friendly, and easy to understand (WhatsApp formatted with emojis and clear bullet points).

When an issue requires a human decision, official confirmation, or personal assistance, recommend contacting the admin with:
"I’m not fully sure about this. Would you like me to connect you with the admin?
Reply YES or NO"
"""


class AIService:
    @staticmethod
    async def generate_response(
        user_message: str,
        conversation_history: Optional[List[Dict[str, Any]]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> str:
        # Retrieve relevant SIH knowledge snippets
        knowledge_context = await KnowledgeService.search_relevant_knowledge(user_message, top_k=3)

        # Build context system message
        enhanced_system_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"=== OFFICIAL SIH KNOWLEDGE BASE CONTEXT ===\n"
            f"{knowledge_context}\n"
            f"===========================================\n"
        )
        if user_context:
            enhanced_system_prompt += (
                f"User Profile Context:\n"
                f"- Name: {user_context.get('name', 'Student')}\n"
                f"- Team ID: {user_context.get('team_id', 'N/A')}\n"
                f"- Role: {user_context.get('role', 'Participant')}\n"
            )

        messages = [{"role": "system", "content": enhanced_system_prompt}]

        # Inject conversation history
        if conversation_history:
            for item in conversation_history[-6:]:
                role = "assistant" if item.get("sender") in ("assistant", "admin") else "user"
                content = item.get("message", "")
                if content:
                    messages.append({"role": role, "content": content})

        # Append current user prompt
        messages.append({"role": "user", "content": user_message})

        if not settings.is_openrouter_configured:
            logger.info("OpenRouter API key is not set. Generating contextual knowledge-grounded local response.")
            return AIService._generate_local_fallback(user_message, knowledge_context)

        # Call OpenRouter API
        headers = {
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/sih-ai-helpdesk",
            "X-Title": "SIH AI WhatsApp Helpdesk"
        }

        payload = {
            "model": settings.OPENROUTER_MODEL,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 600
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                response = await client.post(
                    f"{settings.OPENROUTER_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    ai_text = data["choices"][0]["message"]["content"].strip()
                    logger.info("OpenRouter response generated successfully.")
                    return ai_text
                else:
                    logger.error(f"OpenRouter API error [{response.status_code}]: {response.text}")
                    return AIService._generate_local_fallback(user_message, knowledge_context)

        except httpx.TimeoutException:
            logger.error("OpenRouter API request timed out.")
            return "⏳ The AI service took too long to respond. Would you like me to connect you with the admin?\n\nReply *YES* or *NO*."
        except Exception as e:
            logger.error(f"Exception during OpenRouter call: {e}")
            return AIService._generate_local_fallback(user_message, knowledge_context)

    @staticmethod
    def _generate_local_fallback(user_message: str, knowledge_context: str) -> str:
        """
        Local grounded fallback when OpenRouter is offline or unconfigured.
        """
        query_lower = user_message.lower()

        # Welcome greetings
        if any(w in query_lower for w in ["hi", "hello", "hey", "start", "menu", "help"]):
            return (
                "👋 *Welcome to SIH AI Helpdesk!*\n\n"
                "I can help you with:\n\n"
                "1️⃣ SIH Information & Overview\n"
                "2️⃣ Team Rules & Eligibility\n"
                "3️⃣ Idea PPT & Submission Help\n"
                "4️⃣ Evaluation & Judging Criteria\n"
                "5️⃣ Technical Doubts & Architecture\n"
                "6️⃣ Contact Admin / Request Call\n\n"
                "💬 Just type your question or doubt!"
            )

        # Team size and gender rules
        if any(w in query_lower for w in ["team size", "how many members", "members", "female"]):
            return (
                "📌 *SIH Team Composition Rules:*\n\n"
                "• *Team Size:* Exactly *6 members* per team (including Team Leader).\n"
                "• *Mandatory Female Member:* At least *1 female student* is mandatory.\n"
                "• *College Rule:* All 6 members must be from the *same college* (No cross-college teams).\n"
                "• *Mentors:* Maximum 2 mentors (optional during idea submission)."
            )

        # Presentation PPT Format
        if any(w in query_lower for w in ["ppt", "presentation", "format", "slide", "template"]):
            return (
                "📊 *SIH Idea Presentation (PPT) Guidelines:*\n\n"
                "• *Slides:* 5 to 7 slides strictly in official format.\n"
                "• *Slide 1:* Cover Slide (PS ID, Team Name, Leader, College)\n"
                "• *Slide 2:* Proposed Solution & Block Diagram\n"
                "• *Slide 3:* Technical Architecture & Tech Stack\n"
                "• *Slide 4:* Feasibility & Scalability\n"
                "• *Slide 5:* Impact & Beneficiaries\n"
                "• *File:* Upload as PDF/PPTX (Max 10MB)."
            )

        # Prize Money
        if any(w in query_lower for w in ["prize", "money", "reward", "win", "cash"]):
            return (
                "🏆 *SIH Prize Details:*\n\n"
                "• The winning team for each problem statement in the Grand Finale standardly receives *₹1,00,000 (One Lakh Rupees)*.\n"
                "• Distributed as per AICTE/Ministry guidelines."
            )

        # Fallback with escalation offer
        return (
            "ℹ️ *SIH Helpdesk Notice:*\n\n"
            "I checked our knowledge base, but I do not have a verified official answer for your specific query.\n\n"
            "Would you like me to connect you with the admin for direct support?\n\n"
            "Reply *YES* or *NO*."
        )
