from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import requests

app = Flask(__name__)
CORS(app)

OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434/api/chat')
MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2:1b')
TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT_SECONDS', '120'))

XIRA_SYSTEM_PROMPT = os.getenv(
    'XIRA_SYSTEM_PROMPT',
    "You are Xira, the AI companion inside Xpedition. Be student-focused, practical, concise, supportive, and honest. Help with learning, planning, projects, exams, and career exploration. Never invent learner data or guarantee outcomes."
)

LESSON_SYSTEM_PROMPT = (
    "You are Xira, Xpedition's AI teaching-content engine. "
    "Generate accurate, engaging, structured theory lessons for students. "
    "Return ONLY valid JSON without markdown fences. "
    "Use schema: chunks[{say,code?,visual?}], checkpoint{ask,options,answerIndex,why}. "
    "Teach the real concept, start with useful context, include a concrete example, "
    "name a common misunderstanding, keep visuals simple and truthful, adapt to learner level and language, "
    "and never fabricate citations, measurements, formulas, or learner performance."
)

def ollama(messages, temperature=0.3):
    response = requests.post(
        OLLAMA_URL,
        json={
            'model': MODEL,
            'messages': messages,
            'stream': False,
            'options': {'temperature': temperature},
        },
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    return response.json()['message']['content']

@app.get('/')
def home():
    return 'Xira AI Server is Running!'

@app.post('/chat')
def chat():
    data = request.get_json(silent=True) or {}
    message = str(data.get('message', '')).strip()[:2000]
    if not message:
        return jsonify({'error': 'Message is required'}), 400
    context = data.get('context') or {}
    try:
        reply = ollama([
            {'role': 'system', 'content': XIRA_SYSTEM_PROMPT + '\\nLearner context: ' + str(context)},
            {'role': 'user', 'content': message},
        ], temperature=0.4)
        return jsonify({'reply': reply})
    except Exception as exc:
        return jsonify({'error': str(exc)}), 502

@app.post('/generate-lesson')
def generate_lesson():
    data = request.get_json(silent=True) or {}
    concept = str(data.get('conceptName', '')).strip()
    if not concept:
        return jsonify({'error': 'conceptName is required'}), 400
    language = str(data.get('language', 'english'))
    level = str(data.get('startingLevel', 'Complete beginner'))
    mastery = data.get('masteryPercentage', 0)
    summary = str(data.get('conceptSummary', ''))
    quick = bool(data.get('isQuickLearn', False))
    user_prompt = (
        f'Create a theory class for: {concept}\\n'
        f'Summary if available: {summary}\\n'
        f'Learner language: {language}\\n'
        f'Learner level: {level}\\n'
        f'Current mastery: {mastery}%\\n'
        f'Quick lesson: {quick}\\n'
        'Generate authentic subject teaching content now.'
    )
    try:
        raw = ollama([
            {'role': 'system', 'content': LESSON_SYSTEM_PROMPT},
            {'role': 'user', 'content': user_prompt},
        ], temperature=0.25)
        cleaned = raw.strip()
        if cleaned.startswith('```'):
            parts = cleaned.split('\\n', 1)
            cleaned = parts[1] if len(parts) == 2 else cleaned
        if cleaned.endswith('```'):
            cleaned = cleaned[:-3]
        parsed = json.loads(cleaned.strip())
        if not isinstance(parsed.get('chunks'), list) or not parsed.get('checkpoint'):
            raise ValueError('Invalid lesson schema')
        return jsonify(parsed)
    except Exception as exc:
        return jsonify({'error': str(exc)}), 502

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5000')), debug=False)