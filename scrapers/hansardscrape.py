import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import os
from datetime import datetime, timedelta

MASTER_FILE_XLSX = "hansard_master.xlsx"
MASTER_FILE_CSV = "/golden_dataset/hansard_master.csv"


def ensure_xlsx_from_csv():
    """If CSV exists, convert to XLSX so we can work with it internally."""
    if os.path.exists(MASTER_FILE_CSV):
        print(f"📄 Found existing CSV: {MASTER_FILE_CSV}, converting to XLSX...")
        df = pd.read_csv(MASTER_FILE_CSV)
        df.to_excel(MASTER_FILE_XLSX, index=False)
        print(f"✅ Converted {MASTER_FILE_CSV} to {MASTER_FILE_XLSX}")


def save_xlsx_to_csv():
    """Convert final XLSX back to CSV after scraping is done."""
    if os.path.exists(MASTER_FILE_XLSX):
        df = pd.read_excel(MASTER_FILE_XLSX)
        df.to_csv(MASTER_FILE_CSV, index=False)
        print(f"✅ Saved {MASTER_FILE_XLSX} back to {MASTER_FILE_CSV}")


def scrape_hansard_api(sitting_date):
    url = f"https://sprs.parl.gov.sg/search/getHansardReport/?sittingDate={sitting_date}"
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.HTTPError as e:
        print(f"❌ Failed to fetch data for {sitting_date}: {e}")
        return False

    soup = BeautifulSoup(response.text, "html.parser")

    all_texts = []
    for element in soup.find_all(True, recursive=True):
        text = element.get_text(" ", strip=True)
        if text:
            all_texts.append(text)

    if not all_texts:
        print(f"⚠️ No content found for date {sitting_date}. Skipping.")
        return False

    # Concatenate all texts into one string column "Content"
    full_content = " ".join(all_texts)

    data = {"Date": sitting_date, "Content": full_content}
    new_df = pd.DataFrame([data])

    if os.path.exists(MASTER_FILE_XLSX):
        existing_df = pd.read_excel(MASTER_FILE_XLSX)
        # Skip if date already exists
        if sitting_date in existing_df["Date"].astype(str).values:
            print(f"⚠️ Date {sitting_date} already exists in master file. Skipping append.")
            return True
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined_df = new_df

    combined_df.to_excel(MASTER_FILE_XLSX, index=False)
    print(f"✅ Added {sitting_date} to {MASTER_FILE_XLSX} (content length {len(full_content)} characters).")
    return True


def clean_master_file_bruteforce(filepath):
    """Temp method to remove escape chars"""
    if not os.path.exists(filepath):
        print(f"File {filepath} does not exist. Nothing to clean.")
        return

    df = pd.read_excel(filepath)

    def brute_clean(cell):
        if isinstance(cell, str):
            cell = cell.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
            cell = re.sub(r'\\[rnt]', ' ', cell)
            cell = re.sub(r'\s+', ' ', cell)
            return cell.strip()
        else:
            return cell

    for col in df.columns:
        df[col] = df[col].apply(brute_clean)

    df.to_excel(filepath, index=False)
    print(f"✅ Cleaned escape characters in {filepath}.")


def daterange(start_date, end_date):
    """Get dates from start_date to end_date inclusive."""
    for n in range((end_date - start_date).days + 1):
        yield start_date + timedelta(n)


if __name__ == '__main__':
    # 1️⃣ Convert CSV to XLSX if exists
    ensure_xlsx_from_csv()

    start_date_obj = datetime.strptime("22-02-2025", "%d-%m-%Y")
    today_obj = datetime.today()

    if os.path.exists(MASTER_FILE_XLSX):
        df_existing = pd.read_excel(MASTER_FILE_XLSX)
        if 'Date' in df_existing.columns and not df_existing.empty:
            dates_in_file = pd.to_datetime(df_existing['Date'], dayfirst=True, errors='coerce').dropna()
            if not dates_in_file.empty:
                max_date = dates_in_file.max()
                start_date_obj = max_date + timedelta(days=1)

    print(f"⏳ Starting scraping from {start_date_obj.strftime('%d-%m-%Y')} up to {today_obj.strftime('%d-%m-%Y')}")

    for single_date in daterange(start_date_obj, today_obj):
        date_str = single_date.strftime("%d-%m-%Y")
        scrape_hansard_api(date_str)

    clean_master_file_bruteforce(MASTER_FILE_XLSX)

    # 2️⃣ Convert XLSX back to CSV at the end
    save_xlsx_to_csv()
