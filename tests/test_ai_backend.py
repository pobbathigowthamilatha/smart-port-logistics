import os

from app import build_ai_operational_context, generate_ai_chat_response


def test_build_ai_operational_context_includes_port_data():
    context = build_ai_operational_context()

    assert isinstance(context, dict)
    assert "vessels" in context
    assert "cargo" in context
    assert "trucks" in context
    assert "berths" in context
    assert len(context["vessels"]) > 0
    assert len(context["cargo"]) > 0
    assert len(context["berths"]) > 0


def test_generate_ai_chat_response_without_api_key_returns_clear_error(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)

    result = generate_ai_chat_response("Show delayed cargo shipments")

    assert result["status"] == "error"
    assert "GEMINI_API_KEY" in result["message"]
