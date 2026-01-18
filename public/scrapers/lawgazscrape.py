import os
import re
import time
import pandas as pd
import spacy
from bs4 import BeautifulSoup
import unicodedata

# Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))  # repo root
GOLDEN_DIR = os.path.join(BASE_DIR, "golden_dataset")
os.makedirs(GOLDEN_DIR, exist_ok=True)
EXCEL_FILE = os.path.join(GOLDEN_DIR, "temp_lawgazette.xlsx")  # temporary
CSV_FILE = os.path.join(GOLDEN_DIR, "lawgazette_master.csv")

# NLP setup
nlp = spacy.load("en_core_web_sm")

POLICY_KEYWORDS = [
    "Act", "Scheme", "Policy", "COVID-19", "Grant", "Bill",
    "Subsidy", "CPF", "HDB", "Circuit Breaker", "TraceTogether", "NDP", "Parliament"
]

def extract_names(text):
    doc = nlp(text)
    persons = set(ent.text for ent in doc.ents if ent.label_ == "PERSON")
    return ", ".join(persons)

def extract_policies(text):
    policies = set()
    for keyword in POLICY_KEYWORDS:
        if keyword.lower() in text.lower():
            policies.add(keyword)
    return ", ".join(policies)

def extract_date_from_url(issue_url):
    """Extract month and year from issue URL as ddMMYYYY"""
    match = re.search(r"/issue/(\d{4})-(\d{2})/", issue_url)
    if match:
        year, month = match.groups()
        return f"dd{month}{year}"  # dd + month + year
    return ""

def clean_master_file_bruteforce(filepath):
    """Clean escape characters and fix common mis-encodings in Excel file"""
    if not os.path.exists(filepath):
        print(f"File {filepath} does not exist. Nothing to clean.")
        return

    df = pd.read_excel(filepath)

    def brute_clean(cell):
        if isinstance(cell, str):
            # Remove escape characters
            cell = cell.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
            cell = re.sub(r'\\[rnt]', ' ', cell)
            cell = re.sub(r'\s+', ' ', cell)

            # Normalize Unicode
            cell = unicodedata.normalize("NFC", cell)

            # Fix common mojibake (UTF-8 misread as cp1252)
            replacements = {
                "â€“": "–",   # en dash
                "â€”": "—",   # em dash
                "â€˜": "‘",   # left single quote
                "â€™": "’",   # right single quote
                "â€œ": "“",   # left double quote
                "â€": "”",   # right double quote
                "â€¦": "…",   # ellipsis
                "Â": "",      # stray non-breaking space
            }
            for k, v in replacements.items():
                cell = cell.replace(k, v)

            return cell.strip()
        else:
            return cell

    # Apply cleaning to all columns
    for col in df.columns:
        df[col] = df[col].apply(brute_clean)

    # Save back to Excel with UTF-8 compatibility
    df.to_excel(filepath, index=False, engine="openpyxl")
    print(f"✅ Cleaned escape characters and fixed symbols in {filepath}.")


def get_issue_links(driver, start_year=2025):
    """Get all issue URLs from /archives/ starting from start_year"""
    ARCHIVE_URL = "https://lawgazette.com.sg/archives/"
    driver.get(ARCHIVE_URL)
    time.sleep(2)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    issues = []
    for a in soup.select("a.issue-block"):
        title_tag = a.select_one(".issue-title")
        if not title_tag:
            continue
        title_text = title_tag.get_text(strip=True)
        try:
            year = int(re.search(r"\b(\d{4})\b", title_text).group(1))
            if year >= start_year:
                issues.append(a.get("href"))
        except Exception:
            continue
    return issues

def get_article_links(driver, issue_url):
    """Get all article links from a single issue page"""
    driver.get(issue_url)
    time.sleep(1)
    soup = BeautifulSoup(driver.page_source, "html.parser")
    links = []
    for a in soup.select("div.mkdf-news-item-inner a"):
        href = a.get("href")
        if href and href.startswith("http"):
            links.append(href)
    return list(set(links))  # remove duplicates

def parse_article(driver, article_url, issue_url):
    driver.get(article_url)
    time.sleep(1)
    soup = BeautifulSoup(driver.page_source, "html.parser")

    # Headline
    title_tag = soup.select_one("h2") or soup.select_one("h1")
    headline = title_tag.get_text(strip=True) if title_tag else ""

    # Raw text from h2, h3, p
    body_elements = soup.find_all(["h2", "h3", "p"])
    raw_text = "\n\n".join([el.get_text(strip=True) for el in body_elements if el.get_text(strip=True)])

    # Date of publish from issue URL
    date_of_publish = extract_date_from_url(issue_url)

    # Names & Policies
    names = extract_names(raw_text)
    policies = extract_policies(raw_text)

    return {
        "headline": headline,
        "url": article_url,
        "date of publish (DDMMYYYY)": date_of_publish,
        "raw_text": raw_text,
        "names": names,
        "policies": policies
    }

def save_cleaned_csv(records):
    """Save records to Excel, clean, then convert to CSV, delete Excel"""
    df = pd.DataFrame(records)
    df.to_excel(EXCEL_FILE, index=False, engine="openpyxl")
    print(f"✅ Temporary Excel saved: {EXCEL_FILE}")

    # Clean escape characters
    clean_master_file_bruteforce(EXCEL_FILE)

    # Convert cleaned Excel to CSV with UTF-8
    df_cleaned = pd.read_excel(EXCEL_FILE)
    df_cleaned.to_csv(CSV_FILE, index=False, encoding="utf-8-sig")
    print(f"✅ CSV saved: {CSV_FILE}")

    # Delete temporary Excel
    os.remove(EXCEL_FILE)
    print(f"🗑 Temporary Excel deleted: {EXCEL_FILE}")

def crawl_law_gazette(start_year=2025, driver=None):
    if driver is None:
        import undetected_chromedriver as uc
        driver = uc.Chrome()

    all_records = []
    try:
        issues = get_issue_links(driver, start_year=start_year)
        print(f"Found {len(issues)} issues from {start_year} onwards.")

        for issue_url in issues:
            print(f"Scraping issue: {issue_url}")
            article_links = get_article_links(driver, issue_url)
            print(f"  Found {len(article_links)} articles.")
            for i, art_url in enumerate(article_links):
                print(f"    [{i+1}/{len(article_links)}] {art_url}")
                record = parse_article(driver, art_url, issue_url)
                all_records.append(record)

    finally:
        if all_records:
            save_cleaned_csv(all_records)

    return all_records

if __name__ == "__main__":
    driver = None
    scraped_records = []
    try:
        import undetected_chromedriver as uc
        driver = uc.Chrome()
        scraped_records = crawl_law_gazette(start_year=2025, driver=driver)

    except KeyboardInterrupt:
        print("\n🛑 Scraper interrupted by user!")
        if scraped_records:
            save_cleaned_csv(scraped_records)

    finally:
        if driver:
            driver.quit()
        print(f"💾 Scraping complete. CSV saved in {CSV_FILE}")

