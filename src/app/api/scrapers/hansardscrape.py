import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import os
from datetime import datetime, timedelta

MASTER_FILE = "hansard_master.xlsx"

def scrape_hansard_api(sitting_date):
    url = f"https://sprs.parl.gov.sg/search/getHansardReport/?sittingDate={sitting_date}"
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.HTTPError as e:
        # return false
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

    # column labels
    data = {"Date": sitting_date}
    for i, text in enumerate(all_texts, start=1):
        data[f"Section_{i}"] = text

    new_df = pd.DataFrame([data])

    # check if main file exists
    if os.path.exists(MASTER_FILE):
        existing_df = pd.read_excel(MASTER_FILE)
        # skip existing dates
        if sitting_date in existing_df["Date"].astype(str).values:
            print(f"⚠️ Date {sitting_date} already exists in master file. Skipping append.")
            return True
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
    else:
        combined_df = new_df

    combined_df.to_excel(MASTER_FILE, index=False)
    print(f"✅ Added {sitting_date} to {MASTER_FILE} ({len(all_texts)} sections captured).")
    return True

def clean_master_file_bruteforce(filepath):
    """temp method till i find a way to remove escape char"""
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
    """get dates from start_date to end_date inclusive."""
    for n in range((end_date - start_date).days + 1):
        yield start_date + timedelta(n)

if __name__ == '__main__':
    #startdate
    start_date_obj = datetime.strptime("22-04-1955", "%d-%m-%Y")
    today_obj = datetime.today()

    # if file exists check latest
    if os.path.exists(MASTER_FILE):
        df_existing = pd.read_excel(MASTER_FILE)
        if 'Date' in df_existing.columns and not df_existing.empty:
            # parse the 'Date' column and find max date
            dates_in_file = pd.to_datetime(df_existing['Date'], dayfirst=True, errors='coerce').dropna()
            if not dates_in_file.empty:
                max_date = dates_in_file.max()
                # start from next day after the max_date
                start_date_obj = max_date + timedelta(days=1)

    print(f"⏳ Starting scraping from {start_date_obj.strftime('%d-%m-%Y')} up to {today_obj.strftime('%d-%m-%Y')}")

    # loop through dates and scrape
    for single_date in daterange(start_date_obj, today_obj):
        date_str = single_date.strftime("%d-%m-%Y")
        scrape_hansard_api(date_str)

    clean_master_file_bruteforce(MASTER_FILE)  # clean the master file after scraping
