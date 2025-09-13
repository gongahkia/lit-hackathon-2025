import csv
import os

# Paths to your CSV files, adjust as necessary.
CNA_CSV = os.getenv("CNA_CSV", "full_cna_articles.csv")
ST_CSV = os.getenv("ST_CSV", "full_straits_times_articles.csv")

def load_articles_from_csv(csv_path):
    articles = []
    if not os.path.exists(csv_path):
        return articles
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            articles.append(row)
    return articles

def get_all_articles(source=None):
    articles = []
    if source is None or source.lower() == "cna":
        articles.extend(load_articles_from_csv(CNA_CSV))
    if source is None or source.lower() in ["straitstimes", "str", "st"]:
        articles.extend(load_articles_from_csv(ST_CSV))
    return articles

def search_articles(query, source=None):
    articles = get_all_articles(source)
    if not query:
        return articles
    result = []
    query_lower = query.lower()
    for article in articles:
        if (
            query_lower in (article.get("headline") or "").lower()
            or query_lower in (article.get("raw_text") or "").lower()
        ):
            result.append(article)
    return result