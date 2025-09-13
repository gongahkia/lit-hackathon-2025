from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from scraped_policies_search_service import policy_search_service
from scraped_policies_timeline_service import get_policy_timeline

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

@app.route('/api/policies', methods=['GET'])
def list_policies():
    policies = policy_search_service.get_all_policies()
    return jsonify({"policies": policies})

@app.route('/api/search', methods=['GET'])
def search_records():
    # Use unified ('indiscriminate') search
    q = request.args.get('q', '').strip()
    # Support multi-term search by splitting, or just use [q] for single term.
    query_terms = [term.strip() for term in q.split()] if q else None
    results = policy_search_service.search(query_terms=query_terms)
    return jsonify({"results": results})

@app.route('/api/timeline', methods=['GET'])
def timeline():
    # Returns hardcoded timeline
    return jsonify({"timeline": get_policy_timeline()})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
