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
            "amendments": [],
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
        "policy": "Temporary Relief Fund",
        "speakers": ["Sam Tan Chin Siong"],
        "summary": "Emergency relief for lower- and middle-income Singaporeans affected by job loss.",
        "changes": {
            "creation": {
                "date": "2020-04-01",
                "url": "https://sprs.parl.gov.sg/hansard/example4",
                "speakers": ["Sam Tan Chin Siong"],
                "summary": "Provision of immediate financial relief to those affected by COVID-19 disruptions.",
            },
            "amendments": [],
            "dissolution": {
                "date": "2020-06-30",
                "url": "https://sprs.parl.gov.sg/hansard/example4",
                "speakers": ["Sam Tan Chin Siong"],
                "summary": "Closure as COVID-19 situation improved and other aid schemes ramped up.",
            }
        }
    },
    {
        "policy": "TraceTogether Rollout",
        "speakers": ["Vivian Balakrishnan"],
        "summary": "Deployment of digital contact tracing application.",
        "changes": {
            "creation": {
                "date": "2020-03-20",
                "url": "https://sprs.parl.gov.sg/hansard/example6",
                "speakers": ["Vivian Balakrishnan"],
                "summary": "Official launch of the TraceTogether digital contact tracing application.",
            },
            "amendments": [],
            "dissolution": None
        }
    },
    {
        "policy": "Parenthood Provisional Housing Scheme",
        "speakers": ["Lawrence Wong"],
        "summary": "Temporary public housing for young families awaiting new Build-To-Order flats.",
        "changes": {
            "creation": {
                "date": "2013-01-01",
                "url": "https://sprs.parl.gov.sg/hansard/example8",
                "speakers": ["Lawrence Wong"],
                "summary": "Introduction of PPHS as interim housing support for newly married couples.",
            },
            "amendments": [
                {
                    "date": "2020-06-15",
                    "url": "https://sprs.parl.gov.sg/hansard/example8",
                    "speakers": ["Lawrence Wong"],
                    "summary": "Increase in supply to support more young families during construction delays.",
                }
            ],
            "dissolution": None
        }
    },
    {
        "policy": "Digital Presentation Grant for the Arts",
        "speakers": ["Baey Yam Keng"],
        "summary": "Funding for digital arts projects, online performances and content creation.",
        "changes": {
            "creation": {
                "date": "2020-03-25",
                "url": "https://sprs.parl.gov.sg/hansard/example10",
                "speakers": ["Baey Yam Keng"],
                "summary": "Launch of a digitalization grant as part of ACRP to support art sector.",
            },
            "amendments": [],
            "dissolution": None
        }
    },
    {
        "policy": "Assisted Reproductive Technology (ART) Co-funding Updates",
        "speakers": ["Amy Khor Lean Suan"],
        "summary": "Enhanced subsidies for fertility treatments, including criteria for older couples.",
        "changes": {
            "creation": {
                "date": "2020-07-01",
                "url": "https://sprs.parl.gov.sg/hansard/example18",
                "speakers": ["Amy Khor Lean Suan"],
                "summary": "Announcement of enhanced ART and IUI treatment subsidies.",
            },
            "amendments": [],
            "dissolution": None
        }
    },
    {
        "policy": "Foreign Employee Dormitories Act Amendment",
        "speakers": ["Louis Ng Kok Kwang"],
        "summary": "Expansion of regulatory controls and minimum living conditions for dormitories.",
        "changes": {
            "creation": {
                "date": "2020-04-20",
                "url": "https://sprs.parl.gov.sg/hansard/example5",
                "speakers": ["Louis Ng Kok Kwang"],
                "summary": "Proposal to enhance dormitory regulations to improve living conditions.",
            },
            "amendments": [],
            "dissolution": None
        }
    },
    {
        "policy": "Solidarity Payment",
        "speakers": ["Heng Swee Keat"],
        "summary": "One-off cash payment for Singaporeans during the pandemic.",
        "changes": {
            "creation": {
                "date": "2020-04-14",
                "url": "https://sprs.parl.gov.sg/hansard/example7",
                "speakers": ["Heng Swee Keat"],
                "summary": "Announcement of special cash payout to support Singaporeans.",
            },
            "amendments": [],
            "dissolution": None
        }
    },
]

def get_policy_timeline():
    return timeline
