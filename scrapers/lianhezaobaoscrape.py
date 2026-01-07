import argparse
import csv
import re
import time
from typing import List, Optional, Set, Dict
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.zaobao.com.sg"
DEFAULT_SECTION_URLS = [
    # These are common public sections; adjust as needed if the site structure changes.
    f"{BASE_URL}/realtime/singapore",
    f"{BASE_URL}/realtime/china",
    f"{BASE_URL}/realtime/world",
]


HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; POFactScraper/1.0; +https://example.org)"
}


def fetch_html(url: str, timeout: int = 15) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=timeout)
    resp.raise_for_status()
    return resp.text


def extract_links_from_section(html: str) -> List[str]:
    soup = BeautifulSoup(html, "html.parser")
    urls: Set[str] = set()

    for a in soup.find_all("a", href=True):
        href = a.get("href") or ""
        href = href.strip()
        if not href:
            continue

        # Heuristic: Zaobao article URLs often live under /realtime/ or /news/
        if "/realtime/" not in href and "/news/" not in href:
            continue

        # Filter out section/category pages and anchors
        if href.endswith("/realtime") or href.endswith("/news"):
            continue
        if href.startswith("#"):
            continue

        abs_url = urljoin(BASE_URL, href)
        urls.add(abs_url)

    return sorted(urls)


def extract_meta_time(soup: BeautifulSoup) -> Optional[str]:
    # Prefer <time datetime="...">
    time_tag = soup.find("time")
    if time_tag and time_tag.get("datetime"):
        return time_tag.get("datetime")

    # Try common meta properties
    for key in ["article:published_time", "og:updated_time", "article:modified_time"]:
        meta = soup.find("meta", attrs={"property": key})
        if meta and meta.get("content"):
            return meta.get("content")

    meta = soup.find("meta", attrs={"name": "pubdate"})
    if meta and meta.get("content"):
        return meta.get("content")

    return None


def extract_title(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1:
        title = h1.get_text(" ", strip=True)
        if title:
            return title

    og = soup.find("meta", attrs={"property": "og:title"})
    if og and og.get("content"):
        return og.get("content").strip()

    title_tag = soup.find("title")
    if title_tag:
        return title_tag.get_text(" ", strip=True)

    return "Untitled"


def extract_content(soup: BeautifulSoup) -> str:
    # Prefer <article> content
    article = soup.find("article")
    if article:
        paragraphs = [p.get_text(" ", strip=True) for p in article.find_all("p")]
        text = "\n".join([p for p in paragraphs if p])
        if len(text) > 50:
            return text

    # Fallback: grab main paragraph text
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    text = "\n".join([p for p in paragraphs if p])
    return text.strip()


def clean_text(text: str) -> str:
    # Collapse excessive whitespace but preserve paragraph breaks
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def scrape_article(url: str, sleep_s: float = 0.6) -> Optional[Dict[str, str]]:
    try:
        html = fetch_html(url)
        soup = BeautifulSoup(html, "html.parser")

        title = extract_title(soup)
        published = extract_meta_time(soup) or ""
        content = extract_content(soup)
        content = clean_text(content)

        if not content or len(content) < 50:
            # Skip pages that don't look like real articles
            return None

        time.sleep(sleep_s)

        return {
            "source": "zaobao",
            "headline": title,
            "url": url,
            "date": published,
            "raw_text": content,
            "names": "",
            "policies": "",
        }
    except Exception as e:
        print(f"⚠️  Failed to scrape {url}: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Scrape Lianhe Zaobao (联合早报) articles into a CSV for POFact.")
    parser.add_argument(
        "--sections",
        nargs="*",
        default=DEFAULT_SECTION_URLS,
        help="Zaobao section/list URLs to crawl (default: common realtime sections).",
    )
    parser.add_argument(
        "--max-articles",
        type=int,
        default=50,
        help="Max number of articles to scrape across all sections.",
    )
    parser.add_argument(
        "--output",
        default="golden_dataset/full_lianhezaobao_articles.csv",
        help="Output CSV path.",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.6,
        help="Sleep seconds between article fetches.",
    )

    args = parser.parse_args()

    all_links: List[str] = []
    seen: Set[str] = set()

    for section_url in args.sections:
        try:
            html = fetch_html(section_url)
            links = extract_links_from_section(html)
            for link in links:
                if link in seen:
                    continue
                seen.add(link)
                all_links.append(link)
        except Exception as e:
            print(f"⚠️  Failed to fetch section {section_url}: {e}")

    # Limit links
    all_links = all_links[: args.max_articles]

    print(f"🔎 Found {len(all_links)} candidate article links")

    rows: List[Dict[str, str]] = []
    for i, url in enumerate(all_links, start=1):
        print(f"[{i}/{len(all_links)}] Scraping: {url}")
        row = scrape_article(url, sleep_s=args.sleep)
        if row:
            rows.append(row)

    if not rows:
        print("❌ No articles scraped. The site structure may have changed or blocked requests.")
        return

    fieldnames = ["source", "headline", "url", "date", "raw_text", "names", "policies"]
    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Wrote {len(rows)} rows to {args.output}")


if __name__ == "__main__":
    main()


