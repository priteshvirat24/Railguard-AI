"""RailGuard AI — LLM Provider Configuration"""

from __future__ import annotations
import os
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()


def get_llm(temperature: float = 0.3, model: str | None = None) -> ChatOpenAI:
    """
    Get the configured LLM instance.
    Supports OpenAI and any OpenAI-compatible API (Groq, Together, etc.)
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    base_url = os.getenv("OPENAI_BASE_URL", None)
    model_name = model or os.getenv("LLM_MODEL", "gpt-4o-mini")

    kwargs = {
        "model": model_name,
        "temperature": temperature,
        "api_key": api_key,
    }
    if base_url:
        kwargs["base_url"] = base_url

    return ChatOpenAI(**kwargs)
