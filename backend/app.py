from flask import Flask, request, jsonify
from flask_cors import CORS
import re
from datetime import datetime
import hashlib
import uuid

app = Flask(__name__)
CORS(app)

# Example validation workflows and helpers

def extract_statements(text):
    """
    Naive atomic sentence extractor (improve this with NLP for prod).
    Splits on sentence end, returns list of (text, start, end).
    """
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
    """SHA256 of raw content, for deduplication."""
    return hashlib.sha256(content.encode('utf-8')).hexdigest()

@app.route('/validate', methods=['POST'])
def validate():
    """
    Accepts JSON in the format:
      {
        "document": {
            "raw_text": "...full document...",
            "source": "hansard",
            "url": "https://...",
            "doc_type": "hansard_transcript",
            "published_at": "2025-09-01T11:00:00Z"
            // any additional metadata
        }
      }
    Returns extracted statement objects, provenance, and (optional) validation result.
    """
    try:
        data = request.get_json(force=True)
        assert data and "document" in data, "Missing document key"
        doc = data["document"]

        # Provenance fields
        doc_id = str(uuid.uuid4())
        source = doc.get("source", "unknown")
        url = doc.get("url", "")
        doc_type = doc.get("doc_type", "unknown")
        published_at = doc.get("published_at")
        raw_text = doc.get("raw_text", "")
        language = doc.get("language", "en")

        # Validation rules (example: must not be empty and must be English)
        if not raw_text or len(raw_text) < 40:
            return jsonify({
                "success": False,
                "error": "Document text is too short or missing.",
                "provenance": { "source": source, "url": url }
            }), 400
        if language != "en":
            return jsonify({
                "success": False,
                "error": "Only English-language documents supported in this MVP.",
                "provenance": { "source": source, "url": url }
            }), 400

        # Extraction phase
        statements = extract_statements(raw_text)
        statement_objs = []
        for idx, st in enumerate(statements):
            statement_obj = {
                "id": str(uuid.uuid4()),
                "document_id": doc_id,
                "text": st["text"],
                "start_offset": st["start_offset"],
                "end_offset": st["end_offset"],
                "speaker": doc.get("speaker", "UNKNOWN"),  # improve with NER/metadata
                "role": doc.get("role", "UNKNOWN"),
                "statement_ts": published_at,
                "embedding_id": None,  # Filled by downstream enricher/ML
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

        # (Extensible) Validator output: for contradiction detection
        validation = {
            "success": True,
            "statements_extracted": len(statement_objs),
            "statements": statement_objs,
            "provenance": provenance
        }

        # For auditing: add request and result log here if required (DB, file, etc)
        return jsonify(validation), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "provenance": None
        }), 400

@app.route('/')
def healthcheck():
    return jsonify({"status": "Flask validator running."})

if __name__ == '__main__':
    # For local only
    app.run(host='0.0.0.0', port=5000, debug=True)