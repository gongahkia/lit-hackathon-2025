import requests
from bs4 import BeautifulSoup
import csv

def extract_straits_times(url):
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        raw_text = " ".join(
            p.get_text(strip=True)
            for p in soup.select("div.storyline-wrapper.default p")
        )
        return raw_text
    except Exception as e:
        return f"ST extraction error: {e}"

def extract_cna(url):
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        raw_text = " ".join(
            p.get_text(strip=True)
            for p in soup.select("div.text-long p")
        )
        return raw_text
    except Exception as e:
        return f"CNA extraction error: {e}"

# input_csv = "cna_parliament_articles.csv"  
# output_csv = "full_cna_articles.csv"
input_csv = "straits_times_parliament_articles.csv"  
output_csv = "full_straits_times_articles.csv"

with open(input_csv, "r", newline='', encoding='utf-8') as f_in, \
     open(output_csv, "w", newline='', encoding='utf-8') as f_out:
    reader = csv.DictReader(f_in)
    fieldnames = reader.fieldnames + ["raw_text"]
    writer = csv.DictWriter(f_out, fieldnames=fieldnames)
    writer.writeheader()

    for row in reader:
        url = row.get("url", "")
        raw_text = ""
        if "straitstimes.com" in url:
            raw_text = extract_straits_times(url)
        elif "channelnewsasia.com" in url:
            raw_text = extract_cna(url)
        else:
            raw_text = "Domain not supported."
        # Add column and write row
        row["raw_text"] = raw_text
        writer.writerow(row)

print(f"Finished processing. Output written to {output_csv}")