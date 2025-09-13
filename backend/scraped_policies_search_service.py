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
                # Normalize names/policies to list for easier search
                row['names'] = [n.strip() for n in row['names'].split(',') if n.strip()]
                row['policies'] = [p.strip() for p in row['policies'].split(',') if p.strip()]
                rows.append(row)
            return rows

    def get_all_policies(self) -> List[str]:
        policies = set()
        for row in self.data:
            policies.update(row['policies'])
        return sorted([p for p in policies if p])

    def search(self, date: str = None, names: List[str] = None, policies: List[str] = None) -> List[Dict]:
        result = []
        for row in self.data:
            match = True
            if date and date not in row['Date']:
                match = False
            if names:
                if not any(name in row['names'] for name in names):
                    match = False
            if policies:
                if not any(policy in row['policies'] for policy in policies):
                    match = False
            if match:
                result.append({
                    "date": row['Date'],
                    "content": row['content'],
                    "names": row['names'],
                    "policies": row['policies']
                })
        return result

# Singleton instance
policy_search_service = PolicySearchService()