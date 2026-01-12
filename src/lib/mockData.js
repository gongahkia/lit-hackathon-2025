import { makeId } from "./utils"

// Pofact specific data exports - REALISTIC DATASET
export const INITIAL_SOURCES = [
  {
    id: "parliament-gov",
    name: "Parliament of Singapore",
    url: "https://www.parliament.gov.sg",
    type: "official",
    lastUpdated: "2026-01-10T09:00:00.000Z",
    status: "active"
  },
  {
    id: "minlaw-gov",
    name: "Ministry of Law",
    url: "https://www.mlaw.gov.sg",
    type: "official",
    lastUpdated: "2026-01-08T14:30:00.000Z",
    status: "active"
  },
  {
    id: "cna",
    name: "Channel News Asia",
    url: "https://www.channelnewsasia.com",
    type: "news",
    lastUpdated: "2026-01-12T08:15:00.000Z",
    status: "active"
  },
  {
    id: "straitstimes",
    name: "The Straits Times",
    url: "https://www.straitstimes.com",
    type: "news",
    lastUpdated: "2026-01-12T07:45:00.000Z",
    status: "active"
  }
]

export const INITIAL_DOCUMENTS = [
  {
    id: "doc-hdb-01",
    title: "Ministerial Statement on Public Housing Affordability and Accessibility",
    source: "parliament-gov",
    date: "2025-11-04",
    type: "statement",
    content: "Mr Speaker, creating affordable and accessible homes for Singaporeans remains a key priority for the Government. We have ramped up the supply of Build-To-Order (BTO) flats and introduced the new Standard, Plus, and Prime classification to better reflect the locational attributes of public housing...",
    summary: "Minister addresses concerns on housing affordability and outlines the new BTO classification framework.",
    speaker: "Minister for National Development",
    tags: ["housing", "HDB", "BTO", "affordability"]
  },
  {
    id: "doc-moh-01",
    title: "Enhancements to MediShield Life Scheme for 2026",
    source: "parliament-gov",
    date: "2025-12-10",
    type: "statement",
    content: "To better support Singaporeans with large hospital bills, the Ministry of Health will enhance MediShield Life claim limits starting 1 Jan 2026. This review ensures that the scheme remains relevant amidst rising medical costs and evolving healthcare needs...",
    summary: "MOH announces increased claim limits and premium adjustments for MediShield Life.",
    speaker: "Minister for Health",
    tags: ["healthcare", "insurance", "MediShield"]
  },
  {
    id: "doc-tpt-01",
    title: "Oral Answer to Question on Certificate of Entitlement (COE) Prices",
    source: "parliament-gov",
    date: "2025-10-15",
    type: "debate",
    content: "Mr Speaker, the COE system is designed to manage vehicle growth. The recent spike in Category A and B prices reflects strong demand. We are monitoring the market closely and have brought forward the deregistrations quota to smoothen supply...",
    summary: "Transport Minister responds to MP queries regarding record high COE premiums.",
    speaker: "Minister for Transport",
    tags: ["transport", "COE", "vehicles"]
  }
]

export const INITIAL_TOPICS = [
  {
    id: "topic-housing",
    name: "Housing & Development",
    description: "Public housing policies, HDB affordability, BTO launches, and property cooling measures.",
    documentCount: 42,
    lastUpdated: "2026-01-05T10:00:00.000Z"
  },
  {
    id: "topic-healthcare",
    name: "Healthcare & Ageing",
    description: "MediShield Life, specialized care for seniors, and hospital infrastructure.",
    documentCount: 35,
    lastUpdated: "2026-01-08T11:20:00.000Z"
  },
  {
    id: "topic-transport",
    name: "Transport & Infrastructure",
    description: "COE system reviews, MRT network expansion, and public transport fares.",
    documentCount: 28,
    lastUpdated: "2025-12-20T09:00:00.000Z"
  },
  {
    id: "topic-cpf",
    name: "Social Security (CPF)",
    description: "CPF interest rates, retirement sums, and payout eligibility.",
    documentCount: 19,
    lastUpdated: "2026-01-02T15:45:00.000Z"
  }
]

export const INITIAL_CONVERSATIONS = []

export const INITIAL_TEMPLATES = []

export const INITIAL_FOLDERS = [
  { id: "f1", name: "Research" },
  { id: "f2", name: "Briefs" }
]