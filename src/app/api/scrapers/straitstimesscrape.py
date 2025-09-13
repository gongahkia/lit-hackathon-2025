import requests
from bs4 import BeautifulSoup
import csv

url = "https://www.straitstimes.com/tags/singapore-parliament"
headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MinLaw2Scraper/1.0; +https://example.org)"
}
response = requests.get(url, headers=headers, timeout=10)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")
results = []
for h4 in soup.find_all("h4", class_="font-header-sm-semibold"):
    headline = h4.get_text(strip=True)
    parent_a = h4.find_parent("a")
    url = parent_a["href"] if parent_a and parent_a.has_attr("href") else None
    date_p = h4.find_previous("p", class_="font-eyebrow-baseline-regular text-tertiary")
    date = date_p.get_text(strip=True) if date_p else None
    results.append({
        "headline": headline,
        "url": f'https://www.straitstimes.com{url}' if url else url,
        "date": date
    })

# Write results to a CSV file
with open("parliament_articles.csv", "w", newline='', encoding='utf-8') as csvfile:
    fieldnames = ["headline", "url", "date"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for item in results:
        writer.writerow(item)

print(f"Wrote {len(results)} results to parliament_articles.csv")