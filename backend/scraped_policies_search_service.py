import csv
from typing import List, Dict

CSV_PATH = "../golden_dataset/full_hansard_master.csv"

class PolicySearchService:
    def __init__(self, csv_path=CSV_PATH):
        self.data = self._load_csv(csv_path)

    def _load_csv(self, path: str) -> List[Dict]:
        with open(path, encoding="utf-8") as fin:
            reader = csv.DictReader(fin)
            rows = []
            for row in reader:
                row['names'] = [n.strip() for n in row['names'].split(',') if n.strip()]
                row['policies'] = [p.strip() for p in row['policies'].split(',') if p.strip()]
                rows.append(row)
            return rows

    def get_all_policies(self) -> List[str]:
        policies = set()
        for row in self.data:
            policies.update(row['policies'])
        return sorted([p for p in policies if p])

    def search(self, query_terms: List[str] = None) -> List[Dict]:
        if not query_terms:
            # Return all results if no query given
            return [
                {
                    "date": row['Date'],
                    "content": row['content'],
                    "names": row['names'],
                    "policies": row['policies']
                }
                for row in self.data
            ]

        results = []
        for row in self.data:
            found = False
            # check each query term against all fields
            for term in query_terms:
                term_lower = term.lower()
                # Match: in date string, any name, any policy, or in content text
                if (term_lower in row['Date'].lower()
                    or any(term_lower in name.lower() for name in row['names'])
                    or any(term_lower in policy.lower() for policy in row['policies'])
                    or term_lower in row['content'].lower()):
                    found = True
                    break
            if found:
                results.append({
                    "date": row['Date'],
                    "content": row['content'],
                    "names": row['names'],
                    "policies": row['policies']
                })
        return results

# Singleton instance
policy_search_service = PolicySearchService()