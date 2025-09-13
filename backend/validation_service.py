import os
import re
from datetime import datetime
import hashlib
import uuid
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash-latest")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

def extract_statements(text):
    sentences = [m.group() for m in re.finditer(r'[^.?!\n\r]+[.?!\n\r]', text)]
    result = []
    index = 0
    for sent in sentences:
        start = text.index(sent, index)
        end = start + len(sent)
        result.append({
            "text": sent.strip(),
            "start_offset": start,
            "end_offset": end
        })
        index = end
    return result

def calculate_fetch_signature(content):
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

def call_gemini(prompt):
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ]
    }
    response = requests.post(GEMINI_API_URL, headers=headers, json=data)
    if response.status_code != 200:
        raise Exception(f"Gemini API error [{response.status_code}]: {response.text}")
    gemini_json = response.json()
    out_text = gemini_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    return out_text

def build_validation_prompt(document, preview_statements):
    text = document.get("raw_text", "")
    sample = "\n".join([s['text'] for s in preview_statements[:3]])  # few-shot
    return (
        "You are a policy validation and contradiction detection AI. "
        "Analyze the following government document. "
        "Instructions:\n"
        "- Validate if each extracted statement is factual, self-consistent, and not obviously contradicted by other statements in the text or by a set of provided past policy statements (if any).\n"
        "- If contradictions exist, clearly list them and provide reasoning.\n"
        "- If the document is generally valid and consistent, say so and summarize the main point.\n"
        "Here is the beginning of the document:\n"
        f"{sample}\n\n"
        "Full document is below (for in-depth analysis):\n"
        f"{text}\n"
        "-- End of document --"
    )

def validate_document(data):
    assert data and "document" in data, "Missing document key"
    doc = data["document"]
    doc_id = str(uuid.uuid4())
    source = doc.get("source", "unknown")
    url = doc.get("url", "")
    doc_type = doc.get("doc_type", "unknown")
    published_at = doc.get("published_at")
    raw_text = doc.get("raw_text", "")
    language = doc.get("language", "en")
    if not raw_text or len(raw_text) < 40:
        return ({
            "success": False,
            "error": "Document text is too short or missing.",
            "provenance": { "source": source, "url": url }
        }, 400)
    if language != "en":
        return ({
            "success": False,
            "error": "Only English-language documents supported in this MVP.",
            "provenance": { "source": source, "url": url }
        }, 400)
    statements = extract_statements(raw_text)
    statement_objs = []
    for idx, st in enumerate(statements):
        statement_obj = {
            "id": str(uuid.uuid4()),
            "document_id": doc_id,
            "text": st["text"],
            "start_offset": st["start_offset"],
            "end_offset": st["end_offset"],
            "speaker": doc.get("speaker", "UNKNOWN"),
            "role": doc.get("role", "UNKNOWN"),
            "statement_ts": published_at,
            "embedding_id": None,
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
        statement_objs.append(statement_obj)
    fetch_signature = calculate_fetch_signature(raw_text)
    provenance = {
        "document_id": doc_id,
        "source": source,
        "url": url,
        "fetch_signature": fetch_signature,
        "doc_type": doc_type,
        "published_at": published_at,
        "extract_time": datetime.utcnow().isoformat() + 'Z'
    }
    prompt = build_validation_prompt(doc, statement_objs)
    gemini_out = call_gemini(prompt)
    validation = {
        "success": True,
        "statements_extracted": len(statement_objs),
        "statements": statement_objs,
        "provenance": provenance,
        "gemini_analysis": gemini_out
    }
    return validation, 200