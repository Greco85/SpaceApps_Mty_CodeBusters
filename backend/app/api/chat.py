from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Try to import official google-genai SDK (optional)
try:
    import google.genai as genai
    from google.genai import types as genai_types
    HAS_GOOGLE_GENAI = True
except Exception:
    HAS_GOOGLE_GENAI = False

router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    raw: Optional[Dict[str, Any]] = None


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Proxy endpoint to send messages to Gemini (configurable). If GEMINI_API_URL/GEMINI_API_KEY are not set, returns a dummy reply."""
    # Prefer settings from app.core.config (reads .env) but allow environment override
    gemini_url = os.environ.get("GEMINI_API_URL") or settings.gemini_api_url
    gemini_key = os.environ.get("GEMINI_API_KEY") or settings.gemini_api_key

    # Clean values: remove surrounding whitespace and matching quotes if present
    def _clean_val(v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        v2 = v.strip()
        if (v2.startswith('"') and v2.endswith('"')) or (v2.startswith("'") and v2.endswith("'")):
            v2 = v2[1:-1]
        return v2

    gemini_url = _clean_val(gemini_url)
    gemini_key = _clean_val(gemini_key)

    # If the URL isn't provided but a model name is, build a sensible default (v1beta generateContent)
    if (not gemini_url) and settings.gemini_model:
        model_name = _clean_val(settings.gemini_model)
        if model_name:
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
            logger.info("Built GEMINI_API_URL from GEMINI_MODEL: %s", gemini_url)

    # Simple fallback/dummy reply when not configured
    if not gemini_url or not gemini_key:
        # Build a small deterministic dummy reply for UX while developing
        last = request.messages[-1].content if request.messages else ""
        reply = f"(respuesta dummy) He recibido tu mensaje: '{last}'. Configura GEMINI_API_URL y GEMINI_API_KEY para respuestas reales."
        return ChatResponse(reply=reply, raw=None)

    # Forward request to configured Gemini-compatible endpoint
    headers = {"Content-Type": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Special handling for Google Generative AI
            if gemini_url and ("generativelanguage.googleapis.com" in gemini_url or HAS_GOOGLE_GENAI):
                # Prefer google-genai SDK when available and a GEMINI_API_KEY is present
                if HAS_GOOGLE_GENAI and gemini_key:
                    try:
                        # Configure client with API key from env
                        genai.client = genai.GenAI(api_key=gemini_key)
                        # Build a single text prompt from the conversation
                        prompt_text = "\n".join([f"{m.role}: {m.content}" for m in request.messages])
                        resp = genai.client.models.generate_content(
                            model=request.model or "gemini-2.5-flash",
                            contents=prompt_text,
                        )
                        reply = getattr(resp, 'text', str(resp))
                        return ChatResponse(reply=reply, raw=resp.__dict__ if hasattr(resp, '__dict__') else None)
                    except Exception as e:
                        logger.exception("google-genai SDK call failed: %s", str(e))
                        # fall through to REST fallback

                # REST fallback for Google generativelanguage endpoint
                prompt_text = "\n".join([f"{m.role}: {m.content}" for m in request.messages])

                # Prepare a set of payload variants to try.
                # For generateContent the API expects `contents[]` where each Content is an object
                # with optional `role` and `parts` (each Part can have `text`).
                content_obj = {"role": "user", "parts": [{"text": prompt_text}]}
                # Keep also older legacy shapes as fallbacks
                payload_variants = [
                    {"contents": [content_obj]},
                    {"contents": [{"parts": [{"text": prompt_text}]}]},
                    {"contents": [prompt_text]},
                    {"prompt": {"text": prompt_text}},
                ]

                # Google API keys are passed as query parameter ?key=YOUR_KEY
                params = {"key": gemini_key} if gemini_key else None

                # Build candidate URLs to try: original, v1 <-> v1beta swaps, and alternative suffixes
                candidate_urls = []
                def add_candidate(u):
                    if u and u not in candidate_urls:
                        candidate_urls.append(u)

                add_candidate(gemini_url)
                # If URL contains /v1/ also try /v1beta/
                if gemini_url and '/v1/' in gemini_url:
                    add_candidate(gemini_url.replace('/v1/', '/v1beta/'))
                elif gemini_url and '/v1beta/' in gemini_url:
                    add_candidate(gemini_url.replace('/v1beta/', '/v1/'))

                # Also try swapping common action suffixes :generate <-> :generateContent
                suffix_pairs = [(':generate', ':generateContent'), (':generateContent', ':generate')]
                for base in list(candidate_urls):
                    for a, b in suffix_pairs:
                        if a in base:
                            add_candidate(base.replace(a, b))

                logger.info("Attempting Google REST calls against candidate URLs: %s", candidate_urls)

                resp = None
                data = None
                last_error = None

                for url in candidate_urls:
                    for payload in payload_variants:
                        try:
                            logger.info("Trying URL %s with payload shape keys: %s", url, list(payload.keys()))
                            resp = await client.post(url, json=payload, params=params, headers=headers)
                            resp.raise_for_status()
                            data = resp.json()
                            logger.info("Successful response from %s", url)
                            break
                        except httpx.HTTPStatusError as exc:
                            status = getattr(exc.response, 'status_code', None)
                            body = '<could not read body>'
                            try:
                                body = exc.response.text
                            except Exception:
                                pass
                            logger.warning("Request to %s returned status %s. Body: %s", url, status, body)
                            last_error = (status, body)
                            # if 404, try next candidate URL/payload; otherwise, continue trying other variants
                            continue
                        except Exception as exc:
                            logger.exception("Error while contacting %s: %s", url, str(exc))
                            last_error = (None, str(exc))
                            continue
                    if data is not None:
                        break

                if data is None:
                    # Nothing worked
                    status, body = last_error if last_error else (None, None)
                    logger.error("External API request failed with status %s and body: %s", status, body)
                    raise httpx.HTTPError(f"All REST attempts failed; last status={status}")

                # Try to extract reply from response shapes
                reply = None
                if isinstance(data, dict):
                    candidates = data.get("candidates") or data.get("choices")
                    if isinstance(candidates, list) and candidates:
                        first = candidates[0]
                        # Candidate may contain a structured `content` object with `parts`.
                        content_obj = None
                        if isinstance(first, dict):
                            content_obj = first.get("content") or first.get("message") or first.get("text")
                        else:
                            content_obj = first

                        if isinstance(content_obj, dict):
                            # Try parts -> first part -> text
                            parts = content_obj.get("parts") or []
                            if parts and isinstance(parts, list):
                                p0 = parts[0]
                                if isinstance(p0, dict):
                                    reply = p0.get("text") or p0.get("content") or str(p0)
                                else:
                                    reply = str(p0)
                            else:
                                # maybe content has a direct text field
                                reply = content_obj.get("text") or content_obj.get("content") or str(content_obj)
                        elif isinstance(content_obj, str):
                            reply = content_obj
                if reply is None:
                    reply = str(data)

                return ChatResponse(reply=reply, raw=data)

            # Fallback: generic OpenAI-like API (Bearer token expected)
            payload = {"messages": [m.dict() for m in request.messages]}
            if request.model:
                payload["model"] = request.model

            if gemini_key:
                headers["Authorization"] = f"Bearer {gemini_key}"

            resp = await client.post(gemini_url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            # Attempt to extract a reasonable reply from common response shapes
            reply = None
            if isinstance(data, dict):
                if "reply" in data and isinstance(data["reply"], str):
                    reply = data["reply"]
                elif "choices" in data and isinstance(data["choices"], list) and data["choices"]:
                    first = data["choices"][0]
                    if isinstance(first, dict):
                        if "message" in first and isinstance(first["message"], dict):
                            reply = first["message"].get("content")
                        elif "text" in first:
                            reply = first.get("text")
            if reply is None:
                reply = str(data)

            return ChatResponse(reply=reply, raw=data)

    except httpx.HTTPError as e:
        # If the exception has a response, log status and body to help debugging
        resp = getattr(e, 'response', None)
        try:
            if resp is not None:
                text = resp.text
                status = resp.status_code
                logger.error("External API request failed with status %s and body: %s", status, text)
            else:
                logger.error("External API request failed: %s", str(e))
        except Exception:
            logger.exception("Error while logging external API failure")
        raise HTTPException(status_code=502, detail=f"Error comunicando con Gemini: {str(e)}")
