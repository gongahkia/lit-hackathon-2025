from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

from validation_service import validate_document
from query_engine_service import process_query
from scraped_news_service import get_all_articles, search_articles

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

@app.route('/query', methods=['POST', 'GET'])
def query_engine():
    try:
        if request.method == 'POST':
            data = request.get_json(force=True)
        else:
            data = request.args.to_dict()
        result, status = process_query(data)
        return jsonify(result), status
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ---- NEW ENDPOINTS ----

@app.route('/articles', methods=['GET'])
def serve_articles():
    """ List all articles or filter by source, or search by query """
    try:
        # ?query=...&source=... for search/filtering
        query = request.args.get('query', '').strip()
        source = request.args.get('source', None)
        if query:
            articles = search_articles(query, source)
        else:
            articles = get_all_articles(source)
        return jsonify({"success": True, "articles": articles}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/articles/<source>', methods=['GET'])
def serve_articles_by_source(source):
    """ List all articles from a specific source only """
    try:
        articles = get_all_articles(source)
        return jsonify({"success": True, "articles": articles}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/')
def healthcheck():
    return jsonify({"status": "Flask validator running."})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)