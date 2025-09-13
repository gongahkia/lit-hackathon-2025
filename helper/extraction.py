import csv
import spacy

nlp = spacy.load("en_core_web_sm")  # Make sure you've: python -m spacy download en_core_web_sm

def extract_names(text):
    doc = nlp(text)
    persons = set(ent.text for ent in doc.ents if ent.label_ == "PERSON")
    return ", ".join(persons)

POLICY_KEYWORDS = [
    "Act", "Scheme", "Policy", "COVID-19", "Grant", "Bill",
    "Subsidy", "CPF", "HDB", "Circuit Breaker", "TraceTogether", "NDP", "Parliament",
    "Levy", "Package", "Allowance", "Welfare", "Fund", "Support", "Programme", 
    "Assistance", "Benefit", "Voucher", "Initiative", "Bursary", "Rebate", "Budget",
    "Plan", "Charter", "Framework", "Mandate", "Order", "Resolution", "Pledge",
    "Campaign", "Strategy", "Directive", "Subvention", "Provision", "Code", 
    "Standard", "Compliance", "Agreement", "Moratorium", "Exemption", "Regulation", 
    "Licence", "Jurisdiction", "Duty", "Tariff", "Quota", "Guideline",
    "Sponsorship", "Petition", "Payout", "Bond", "Bonus"
]

def extract_policies(text):
    policies = set()
    for keyword in POLICY_KEYWORDS:
        if keyword.lower() in text.lower():
            policies.add(keyword)
    return ", ".join(policies)

# input_file = "hansard_master.csv"
# output_file = "full_hansard_master.csv"
# input_file = "full_cna_articles.csv"
# output_file = "full_cna_articles_2.csv"
input_file = "full_straits_times_articles.csv"
output_file = "full_straits_times_articles_2.csv"

with open(input_file, encoding="utf-8") as fin, open(output_file, "w", newline='', encoding="utf-8") as fout:
    reader = csv.DictReader(fin)
    fieldnames = reader.fieldnames + ["names", "policies"]
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        text = row['content'] if 'content' in row else next(
            (row[k] for k in row if k not in ('date',)), '')
        row['names'] = extract_names(text)
        row['policies'] = extract_policies(text)
        writer.writerow(row)


print(f"Annotated CSV written to {output_file}")