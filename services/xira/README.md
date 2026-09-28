# Xira AI Backend

This service reuses the existing Ungal Thozhan Ollama intelligence as Xira for Xpedition.

Endpoints:
- POST /chat
- POST /generate-lesson

Environment:
- OLLAMA_URL (default: http://localhost:11434/api/chat)
- OLLAMA_MODEL (default: llama3.2:1b)
- OLLAMA_TIMEOUT_SECONDS (default: 120)
- XIRA_SYSTEM_PROMPT (optional override)

Run:
pip install -r requirements.txt
python server.py

Set XIRA_BACKEND_URL in the Xpedition Vercel environment to the public HTTPS URL of this service.