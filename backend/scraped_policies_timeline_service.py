# scraped_policies_timeline_service.py

timeline = [
    {
        "policy": "COVID-19 Support Grant",
        "speakers": ["Heng Swee Keat", "Josephine Teo"],
        "summary": "Financial assistance for individuals and families affected by the COVID-19 pandemic.",
        "changes": {
            "creation": {
                "date": "2020-04-01",
                "url": "https://sprs.parl.gov.sg/hansard/example1",
                "speakers": ["Heng Swee Keat", "Josephine Teo"],
                "summary": "Introduction of the COVID-19 Support Grant to provide financial assistance during the pandemic.",
            },
            "amendments": [
                {
                    "date": "2020-04-15",
                    "url": "https://sprs.parl.gov.sg/hansard/example12",
                    "speakers": ["Heng Swee Keat"],
                    "summary": "Expanded eligibility to include part-time workers.",
                },
                {
                    "date": "2020-05-01",
                    "url": "https://sprs.parl.gov.sg/hansard/example13",
                    "speakers": ["Josephine Teo"],
                    "summary": "Increased grant amount for families with children under 12.",
                },
                {
                    "date": "2020-06-01",
                    "url": "https://sprs.parl.gov.sg/hansard/example14",
                    "speakers": ["Heng Swee Keat", "Josephine Teo"],
                    "summary": "Extended application deadline due to high demand.",
                }
            ],
            "dissolution": None
        }
    },
    {
        "policy": "Jobs Support Scheme",
        "speakers": ["Heng Swee Keat"],
        "summary": "Salary subsidies to help businesses retain workers during economic downturn.",
        "changes": {
            "creation": {
                "date": "2020-04-06",
                "url": "https://sprs.parl.gov.sg/hansard/example2",
                "speakers": ["Heng Swee Keat"],
                "summary": "Launched Jobs Support Scheme to subsidise employee salaries.",
            },
            "amendments": [
                {
                    "date": "2020-04-21",
                    "url": "https://sprs.parl.gov.sg/hansard/example11",
                    "speakers": ["Heng Swee Keat"],
                    "summary": "Scheme extended to include shareholder-directors under certain conditions.",
                }
            ],
            "dissolution": None
        }
    },
    {
        "policy": "Circuit Breaker Measures",
        "speakers": ["Gan Kim Yong", "Lawrence Wong"],
        "summary": "Temporary restrictions on businesses, schools, and gathering to control COVID-19 spread.",
        "changes": {
            "creation": {
                "date": "2020-04-07",
                "url": "https://sprs.parl.gov.sg/hansard/example3",
                "speakers": ["Gan Kim Yong", "Lawrence Wong"],
                "summary": "Announcement of comprehensive COVID-19 restrictions.",
            },
            "amendments": [],
            "dissolution": {
                "date": "2020-06-01",
                "url": "https://sprs.parl.gov.sg/hansard/example3",
                "speakers": ["Lawrence Wong"],
                "summary": "Gradual lifting of Circuit Breaker restrictions.",
            }
        }
    },
    {
        "policy": "COVID-19 Recovery Grant",
        "speakers": ["Minister for Social and Family Development"],
        "summary": "Financial assistance for lower- to middle-income employees and self-employed persons affected by COVID-19.",
        "changes": {
            "creation": {
                "date": "2021-01-18",
                "url": "https://www.msf.gov.sg/media-room/article/COVID-19-Recovery-Grant-to-Provide-Further-Support",
                "speakers": ["Minister for Social and Family Development"],
                "summary": "Introduction of the COVID-19 Recovery Grant to support individuals facing job loss, no-pay leave, or significant income loss due to COVID-19.",
            },
            "amendments": [
                {
                    "date": "2021-04-19",
                    "url": "https://www.msf.gov.sg/media-room/article/COVID-19-Recovery-Grant-to-Provide-Further-Support",
                    "speakers": ["Minister for Social and Family Development"],
                    "summary": "Introduction of a second tranche of CRG support for eligible recipients.",
                },
                {
                    "date": "2022-12-16",
                    "url": "https://www.msf.gov.sg/media-room/article/COVID-19-Recovery-Grant-Extended-to-31-December-2023",
                    "speakers": ["Minister for Social and Family Development"],
                    "summary": "Extension of the CRG application period until 31 December 2023 to continue providing support for affected workers.",
                }
            ],
            "dissolution": None
        }
    }
]

def get_policy_timeline():
    return timeline
