import csv
from typing import List, Dict

CSV_PATHS = [
    "../golden_dataset/full_hansard_master.csv",
    "../golden_dataset/full_cna_articles.csv",
    "../golden_dataset/full_straits_times_articles.csv"
]

HEADERS_MAP = {
    "full_hansard_master.csv": ["source", "Date", "content", "names", "policies"],
    "full_cna_articles.csv": ["source", "headline", "url", "date", "raw_text", "names", "policies"],
    "full_straits_times_articles.csv": ["source", "headline", "url", "date", "raw_text", "names", "policies"]
}

class PolicySearchService:
    def __init__(self, csv_paths=CSV_PATHS):
        self.data = self._load_csvs(csv_paths)

    def _load_csvs(self, paths: List[str]) -> List[Dict]:
        rows = []
        for path in paths:
            file_key = path.split("/")[-1]
            headers = HEADERS_MAP[file_key] if file_key in HEADERS_MAP else []
            with open(path, encoding="utf-8") as fin:
                reader = csv.DictReader(fin)
                for row in reader:
                    row_standard = {}
                    # Map keys, handle URL for news sources
                    row_standard['source'] = row.get('source')
                    row_standard['date'] = row.get('Date') or row.get('date')
                    row_standard['content'] = row.get('content') or row.get('raw_text') or row.get('headline')
                    row_standard['names'] = [n.strip() for n in row.get('names', '').split(',') if n.strip()]
                    row_standard['policies'] = [p.strip() for p in row.get('policies', '').split(',') if p.strip()]
                    row_standard['url'] = row.get('url') if 'url' in row else None
                    rows.append(row_standard)
        return rows

    def get_all_policies(self) -> List[str]:
        policies = set()
        for row in self.data:
            policies.update(row['policies'])
        return sorted([p for p in policies if p])

    def search(self, query_terms: List[str] = None) -> List[Dict]:
        if not query_terms:
            return [
                self._format_result(row)
                for row in self.data
            ]
        results = []
        for row in self.data:
            found = False
            for term in query_terms:
                term_lower = term.lower()
                if (
                    (row['date'] and term_lower in row['date'].lower())
                    or any(term_lower in name.lower() for name in row['names'])
                    or any(term_lower in policy.lower() for policy in row['policies'])
                    or (row['source'] and term_lower in row['source'].lower())
                    or (row['content'] and term_lower in row['content'].lower())
                ):
                    found = True
                    break
            if found:
                results.append(self._format_result(row))
        return results

    def _format_result(self, row: Dict) -> Dict:
        # only include 'url' for CNA or ST
        result = {
            "source": row['source'],
            "date": row['date'],
            "content": row['content'],
            "names": row['names'],
            "policies": row['policies']
        }
        if row['source'] and row['source'].lower() in ['straitstimes', 'cna', 'straits_times', 'straits times'] and row.get('url'):
            result["url"] = row["url"]
        return result

# Singleton instance
policy_search_service = PolicySearchService()
for row in policy_search_service.data:
    if row.get('url'):
        print(row)