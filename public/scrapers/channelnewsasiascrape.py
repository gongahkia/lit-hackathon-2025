import requests
from bs4 import BeautifulSoup
import csv

url = "https://www.channelnewsasia.com/parliament"
headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MinLaw2Scraper/1.0; +https://example.org)"
}
response = requests.get(url, headers=headers, timeout=10)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")
results = []

for a in soup.find_all("a", class_="h6__link list-object__heading-link"):
    headline = a.get_text(strip=True)
    article_url = a["href"] if a.has_attr("href") else None
    # Make URL absolute if needed
    if article_url and article_url.startswith("/"):
        article_url = "https://www.channelnewsasia.com" + article_url

    # Try finding the date: the nearest following span
    date = None
    parent = a.parent
    # Search for the nearest 'list-object__timestamp timestamp timeago' span in parent or next siblings
    date_span = parent.find("span", class_="list-object__timestamp timestamp timeago")
    if not date_span:
        # Try next siblings (for some nested layouts)
        next_sibling = a.find_next_sibling("span", class_="list-object__timestamp timestamp timeago")
        if next_sibling:
            date_span = next_sibling
    date = date_span.get_text(strip=True) if date_span else None

    results.append({
        "headline": headline,
        "url": article_url,
        "date": date
    })

with open("cna_parliament_articles.csv", "w", newline='', encoding='utf-8') as csvfile:
    fieldnames = ["headline", "url", "date"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for item in results:
        writer.writerow(item)

print(f"Wrote {len(results)} results to cna_parliament_articles.csv")