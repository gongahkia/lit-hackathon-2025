from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

from validation import validate_document  # Import your validation method

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/validate', methods=['POST'])
def validate():
    try:
        data = request.get_json(force=True)
        result, status = validate_document(data)
        return jsonify(result), status
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "provenance": None
        }), 500

@app.route('/')
def healthcheck():
    return jsonify({"status": "Flask validator running."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
