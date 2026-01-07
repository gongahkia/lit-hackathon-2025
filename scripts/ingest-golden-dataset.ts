import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import * as fs from 'fs'
import csv from 'csv-parser'
import { createReadStream } from 'fs'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please create a .env.local file with:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_key')
  process.exit(1)
}

// Initialize Supabase client with service role key
// Note: Supabase now uses "secret" API keys (not JWT tokens starting with 'eyJ')
// The service role key should bypass RLS, but PostgREST still requires UPDATE policies for upsert
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
})

// Verify key is not empty (format validation removed - supports both legacy JWT and new secret keys)
if (!supabaseKey || supabaseKey.trim().length === 0) {
  console.error('❌ ERROR: Service role key is empty!')
  console.error('   Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local')
  process.exit(1)
}

console.log(`✅ Using service role key (${supabaseKey.length} characters)`)
console.log('   Note: Supabase now uses "secret" API keys, not JWT tokens')

// Warn if key seems too short (service role keys are typically 200+ chars for JWT or 40+ for secret keys)
if (supabaseKey.length < 30) {
  console.warn('⚠️  WARNING: Service role key seems very short!')
  console.warn('   Make sure you\'re using SUPABASE_SERVICE_ROLE_KEY, not SUPABASE_ANON_KEY')
  console.warn('   Service role keys should be:')
  console.warn('     - Legacy JWT: 200+ characters (starts with "eyJ")')
  console.warn('     - New secret key: 40+ characters')
}

console.log('   If you get RLS errors, run: database/fix-rls-service-role.sql in Supabase SQL Editor')
console.log('')

// Interface for CSV article data
interface ArticleData {
  source?: string
  headline: string
  url: string
  date?: string
  raw_text?: string
  names?: string[]
  policies?: string[]
}

// Interface for processed document data
interface ProcessedDocument {
  id: string
  title: string
  source_id: string
  content: string
  speaker?: string
  role?: string | null
  date?: string
  published_at?: string | null
  type: string
  summary?: string
  tags: string[]
  topics?: string[]
  source_type?: string
  verified?: boolean
  confidence?: number | null
  url?: string | null
  language?: string
}

// Interface for source data
interface SourceData {
  id: string
  name: string
  url: string
  type: string
  last_updated: string
  status: string
  language?: string
}

// Helper function to generate unique ID
function generateId(prefix: string, text: string): string {
  const hash = text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return `${prefix}-${Math.abs(hash).toString(36)}`
}

// Helper function to extract speaker from headline/content
function extractSpeaker(headline: string, content?: string): string {
  const text = content || headline
  
  // Common speaker patterns
  const patterns = [
    /(?:PM|Prime Minister)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    /(?:Minister|DPM|Deputy Prime Minister)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)\s+(?:said|announced|stated)/,
    /(?:Mr|Ms|Mrs)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return ''
}

// Helper function to generate summary from content
function generateSummary(content: string, maxLength: number = 200): string {
  if (!content) return ''
  
  // Clean content and get first sentence
  const cleaned = content.replace(/\s+/g, ' ').trim()
  const sentences = cleaned.split(/[.!?]+/)
  const firstSentence = sentences[0]?.trim()
  
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence
  }
  
  // Truncate if too long
  return cleaned.substring(0, maxLength).replace(/\s+\w*$/, '') + '...'
}

// Helper function to parse comma-separated lists from CSV (names/policies)
function parseCsvList(value?: string): string[] {
  if (!value) return []
  // Handle JSON-ish list strings or bracketed lists
  const cleaned = value
    .replace(/^\s*\[|\]\s*$/g, '')
    .replace(/^"+|"+$/g, '')
    .trim()

  if (!cleaned) return []

  // Split on comma; keep Chinese phrases intact (no extra splitting)
  return cleaned
    .split(',')
    .map(s => s.trim().replace(/^"+|"+$/g, ''))
    .filter(Boolean)
}

// Detect document language (en/zh/mixed) by Unicode ranges
function detectLanguage(text?: string): 'en' | 'zh' | 'mixed' {
  if (!text) return 'en'
  // CJK Unified Ideographs + extensions
  const hasChinese = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/.test(text)
  const hasEnglish = /[a-zA-Z]/.test(text)
  if (hasChinese && hasEnglish) return 'mixed'
  if (hasChinese) return 'zh'
  return 'en'
}

// Extract a rough role signal from text (best-effort)
function extractRole(text?: string): string | null {
  if (!text) return null
  const patterns: Array<[RegExp, string]> = [
    [/\bPrime Minister\b|\bPM\b/i, 'Prime Minister'],
    [/\bDeputy Prime Minister\b|\bDPM\b/i, 'Deputy Prime Minister'],
    [/\bMinister\b/i, 'Minister'],
    [/\bSpeaker\b/i, 'Speaker'],
    [/\bMP\b|\bMember of Parliament\b/i, 'MP'],
  ]
  for (const [re, role] of patterns) {
    if (re.test(text)) return role
  }
  return null
}

function safeIsoTimestampFromYyyyMmDd(date?: string): string | null {
  if (!date) return null
  // date already normalized to YYYY-MM-DD by parseDate()
  const d = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function normalizeUrl(url?: string): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  // Guard against obvious placeholders
  if (trimmed === '#' || trimmed.toLowerCase() === 'n/a') return null
  // Make protocol-relative or relative URLs absolute when possible (caller should handle domain)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return null
}

function buildParliamentReportUrlFromDate(date?: string): string | null {
  if (!date) return null
  // SPRS full report URL pattern used in the UI fallback
  return `https://sprs.parl.gov.sg/search/#/fullreport?sittingdate=${date}`
}

function calculateConfidence(params: {
  sourceType: 'parliamentary' | 'ministerial' | 'news'
  verified: boolean
  date?: string
  contentLength: number
  hasUrl: boolean
}): number {
  let score = 0.5

  // Source-type boost
  if (params.sourceType === 'parliamentary') score += 0.3
  if (params.sourceType === 'ministerial') score += 0.25
  if (params.sourceType === 'news') score += 0.15

  // Verified boost
  if (params.verified) score += 0.1

  // Date recency boost (within last year)
  if (params.date) {
    const ts = Date.parse(`${params.date}T00:00:00.000Z`)
    if (!Number.isNaN(ts)) {
      const oneYearMs = 365 * 24 * 60 * 60 * 1000
      if (Date.now() - ts <= oneYearMs) score += 0.05
    }
  }

  // Content quality boost
  if (params.contentLength > 500) score += 0.05

  // URL presence (helps provenance)
  if (params.hasUrl) score += 0.03

  // Clamp 0..1 and round to 2dp
  score = Math.max(0, Math.min(1, score))
  return Math.round(score * 100) / 100
}

// Helper function to extract tags from content
function extractTags(headline: string, content?: string): string[] {
  const text = (content || headline).toLowerCase()
  const tags: string[] = []
  
  // Policy-related keywords
  const policyKeywords = [
    'healthcare', 'health', 'medical', 'hospital', 'moh',
    'economy', 'economic', 'trade', 'business', 'mti',
    'education', 'school', 'university', 'moe',
    'housing', 'hdb', 'bto', 'mnd',
    'transport', 'mrt', 'bus', 'moh',
    'security', 'defence', 'mha', 'mindef',
    'environment', 'climate', 'sustainability', 'mse',
    'finance', 'monetary', 'mas', 'mof',
    'social', 'welfare', 'community', 'msf'
  ]
  
  // Parliament-related keywords
  const parliamentKeywords = [
    'parliament', 'ministerial', 'statement', 'debate',
    'bill', 'act', 'legislation', 'policy'
  ]
  
  // Check for policy keywords
  for (const keyword of policyKeywords) {
    if (text.includes(keyword)) {
      tags.push(keyword)
    }
  }
  
  // Check for parliament keywords
  for (const keyword of parliamentKeywords) {
    if (text.includes(keyword)) {
      tags.push(keyword)
    }
  }
  
  // Add source-based tags
  if (text.includes('cna') || text.includes('channel news')) {
    tags.push('news')
  }
  if (text.includes('straits times')) {
    tags.push('news')
  }
  if (text.includes('parliament') || text.includes('ministerial')) {
    tags.push('official')
  }
  
  return [...new Set(tags)] // Remove duplicates
}

function getSourceTypeFromSourceId(sourceId: string): 'parliamentary' | 'ministerial' | 'news' {
  if (sourceId === 'hansard' || sourceId === 'parliament-gov') return 'parliamentary'
  if (sourceId === 'lawgazette') return 'ministerial'
  return 'news'
}

function topicIdFromName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''
  // Prefer human-readable slug ids for ASCII; fall back to hash for non-ASCII (Chinese)
  const isAscii = /^[\x00-\x7F]+$/.test(trimmed)
  if (isAscii) {
    const slug = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return slug ? `topic-${slug}` : generateId('topic', trimmed)
  }
  return generateId('topic', trimmed)
}

// Helper function to determine document type
function getDocumentType(headline: string, content?: string): string {
  const text = (content || headline).toLowerCase()
  
  if (text.includes('ministerial statement') || text.includes('parliament')) {
    return 'statement'
  }
  if (text.includes('press release') || text.includes('announcement')) {
    return 'release'
  }
  if (text.includes('debate') || text.includes('question')) {
    return 'debate'
  }
  if (text.includes('news') || text.includes('article')) {
    return 'news'
  }
  
  return 'document'
}

// Helper function to parse date
function parseDate(dateStr?: string): string | undefined {
  if (!dateStr) return undefined
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return undefined
    return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
  } catch {
    return undefined
  }
}

// Process CSV file and return articles
// Handles different CSV formats from different scrapers
async function processCSVFile(filePath: string): Promise<ArticleData[]> {
  return new Promise((resolve, reject) => {
    const articles: ArticleData[] = []
    const fileName = filePath.split(/[/\\]/).pop() || ''
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        // Handle different CSV formats:
        // - full_hansard_master.csv: uses "Date" and "content" (no headline, no url)
        // - full_cna_articles.csv: uses "headline", "url", "date", "raw_text"
        // - full_straits_times_articles.csv: uses "headline", "url", "date", "raw_text"
        // - full_lawgaz_master.csv: uses "headline", "url", "date", "content"
        
        const headline = row.headline || row.content?.substring(0, 200) || 'Untitled'
        const url = row.url || ''
        const date = row.date || row.Date || undefined
        const raw_text = row.raw_text || row.content || headline
        const source = row.source || fileName
        const names = parseCsvList(row.names)
        const policies = parseCsvList(row.policies)
        
        articles.push({
          source,
          headline: headline,
          url: url,
          date: date,
          raw_text: raw_text,
          names,
          policies
        })
      })
      .on('end', () => {
        console.log(`📄 Processed ${articles.length} articles from ${fileName}`)
        resolve(articles)
      })
      .on('error', reject)
  })
}

// Create source entries
async function createSources(): Promise<Map<string, string>> {
  const sourceMap = new Map<string, string>()
  
  const sources: SourceData[] = [
    {
      id: "parliament-gov",
      name: "Parliament of Singapore",
      url: "https://www.parliament.gov.sg",
      type: "official",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active",
      language: "en"
    },
    {
      id: "cna",
      name: "Channel News Asia",
      url: "https://www.channelnewsasia.com",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active",
      language: "en"
    }, 
    { 
      id: "straitstimes",
      name: "The Straits Times",
      url: "https://www.straitstimes.com",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active",
      language: "en"
    }, 
    { 
      id: "hansard",
      name: "Hansard",
      url: "https://sprs.parl.gov.sg/search/",
      type: "official",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active",
      language: "en"
    }, 
    {
      id: "lawgazette",
      name: "Singapore Law Gazette",
      url: "https://www.lawgazette.gov.sg",
      type: "official",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active",
      language: "en"
    },
    {
      id: "lianhezaobao",
      name: "Lianhe Zaobao (联合早报)",
      url: "https://www.zaobao.com.sg",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active",
      language: "zh"
    }
  ]
  
  console.log('📊 Creating sources...')
  
  for (const source of sources) {
    const { data, error } = await supabase
      .from('sources')
      .upsert(source, { onConflict: 'id' })
      .select()
    
    if (error) {
      console.error(`❌ Error creating source ${source.name} (ID: "${source.id}"):`, error.message)
      console.error(`   This will cause foreign key constraint errors!`)
      // Don't throw - continue to see all errors, but mark as failed
    } else {
      console.log(`✅ Source created/updated: ${source.name} (ID: "${source.id}")`)
      sourceMap.set(source.name.toLowerCase(), source.id)
    }
  }
  
  // Verify all sources were created
  if (sourceMap.size < sources.length) {
    console.error(`❌ Only ${sourceMap.size} of ${sources.length} sources were created successfully!`)
    console.error('   This will cause foreign key constraint errors when inserting documents.')
  }
  
  return sourceMap
}

// Process and insert documents
async function processDocuments(
  articles: ArticleData[],
  sourceMap: Map<string, string>
): Promise<{
  documents: ProcessedDocument[]
  topicMetaById: Map<string, { id: string; name: string; description: string }>
}> {
  console.log('📄 Processing documents...')
  
  // Verify sources exist in database before proceeding
  console.log('🔍 Verifying sources in database...')
  const { data: existingSources, error: sourcesError } = await supabase
    .from('sources')
    .select('id, name')
  
  if (sourcesError) {
    console.error('❌ Error fetching sources:', sourcesError.message)
    throw sourcesError
  }
  
  const existingSourceIds = new Set(existingSources?.map(s => s.id) || [])
  console.log(`✅ Found ${existingSourceIds.size} sources in database:`)
  existingSources?.forEach(s => console.log(`   - "${s.id}" (${s.name})`))
  
  // Verify all expected sources exist
  const expectedSources = ['parliament-gov', 'cna', 'straitstimes', 'hansard', 'lawgazette', 'lianhezaobao']
  const missingSources = expectedSources.filter(id => !existingSourceIds.has(id))
  if (missingSources.length > 0) {
    console.error(`❌ Missing sources in database: ${missingSources.join(', ')}`)
    console.error('   This will cause foreign key constraint errors!')
    throw new Error(`Missing sources: ${missingSources.join(', ')}`)
  }
  
  const documents: ProcessedDocument[] = []
  const topicMetaById = new Map<string, { id: string; name: string; description: string }>()
  
  for (const article of articles) {
    // Determine source - must match the IDs created in createSources()
    const urlLower = (article.url || '').toLowerCase()
    const sourceLower = (article.source || '').toLowerCase()

    let sourceId = 'cna' // default

    // Prefer explicit CSV source label when present
    if (sourceLower) {
      if (sourceLower.includes('zaobao') || sourceLower.includes('lianhe')) {
        sourceId = 'lianhezaobao'
      } else if (sourceLower.includes('straits') || sourceLower.includes('st')) {
        sourceId = 'straitstimes'
      } else if (sourceLower.includes('cna') || sourceLower.includes('channel news')) {
        sourceId = 'cna'
      } else if (sourceLower.includes('lawgaz')) {
        sourceId = 'lawgazette'
      } else if (sourceLower.includes('hansard')) {
        sourceId = 'hansard'
      } else if (sourceLower.includes('parliament') || sourceLower.includes('sprs')) {
        sourceId = 'parliament-gov'
      }
    }

    // Fallback to URL-based detection
    if (urlLower.includes('zaobao.com.sg')) {
      sourceId = 'lianhezaobao'
    } else if (urlLower.includes('straitstimes.com')) {
      sourceId = 'straitstimes'
    } else if (urlLower.includes('channelnewsasia.com') || urlLower.includes('cna')) {
      sourceId = 'cna'
    } else if (urlLower.includes('lawgazette')) {
      sourceId = 'lawgazette'
    } else if (urlLower.includes('sprs.parl.gov.sg')) {
      sourceId = 'hansard'
    } else if (urlLower.includes('parliament.gov.sg') || urlLower.includes('parl.gov.sg')) {
      sourceId = 'parliament-gov'
    }
    
    // Verify source exists in database
    if (!existingSourceIds.has(sourceId)) {
      console.warn(`⚠️  Warning: Source ID "${sourceId}" not found in database for article: ${article.headline.substring(0, 50)}...`)
      console.warn(`   URL: ${article.url}`)
      console.warn(`   Available sources: ${Array.from(existingSourceIds).join(', ')}`)
      // Skip this document or use a default source
      continue
    }
    
    // Parse date
    const date = parseDate(article.date)

    // Determine document language (en/zh/mixed)
    const language = detectLanguage(article.raw_text || article.headline)

    // Determine source type (parliamentary / ministerial / news)
    const source_type = getSourceTypeFromSourceId(sourceId)

    // Verified by default for official sources
    const verified = source_type !== 'news'

    // Normalize URL (and generate for parliamentary reports if missing)
    let rawUrl = (article.url || '').trim()
    if (rawUrl.startsWith('/')) {
      if (sourceId === 'lianhezaobao') rawUrl = `https://www.zaobao.com.sg${rawUrl}`
      if (sourceId === 'cna') rawUrl = `https://www.channelnewsasia.com${rawUrl}`
    }
    let url = normalizeUrl(rawUrl)
    if (!url && source_type === 'parliamentary') {
      url = buildParliamentReportUrlFromDate(date)
    }

    // Generate document ID (include source + date for stability even when url missing)
    const docId = generateId('doc', `${sourceId}|${date || ''}|${article.headline}|${url || ''}`)
    
    // Extract speaker
    const speaker =
      extractSpeaker(article.headline, article.raw_text) ||
      (article.names && article.names.length > 0 ? article.names[0] : '')
    
    // Generate summary
    const summary = generateSummary(article.raw_text || article.headline)
    
    // Extract tags
    const tags = extractTags(article.headline, article.raw_text)
    
    // Determine document type
    const type = getDocumentType(article.headline, article.raw_text)
    
    // Role (best effort)
    const role = extractRole(`${article.headline}\n${article.raw_text || ''}`)

    // Topics: prefer policies from CSV; fallback to tags (limit to keep UI tidy)
    const topicNames =
      article.policies && article.policies.length > 0 ? article.policies : tags

    const topicPairs = (topicNames || [])
      .map(name => (name || '').toString().trim())
      .filter(Boolean)
      .map(name => ({ name, id: topicIdFromName(name) }))
      .filter(pair => Boolean(pair.id))

    const topics = Array.from(new Set(topicPairs.map(p => p.id))).slice(0, 8)

    // Register topic metadata for later upsert into `topics` table
    for (const pair of topicPairs) {
      if (!topics.includes(pair.id)) continue
      if (topicMetaById.has(pair.id)) continue
      const displayName =
        /^[\x00-\x7F]+$/.test(pair.name) && pair.name.length > 1
          ? pair.name.charAt(0).toUpperCase() + pair.name.slice(1)
          : pair.name
      topicMetaById.set(pair.id, {
        id: pair.id,
        name: displayName,
        description: `Documents related to ${displayName}`,
      })
    }

    // published_at (TIMESTAMPTZ) from date when available
    const published_at = safeIsoTimestampFromYyyyMmDd(date)

    // Confidence (heuristic)
    const confidence = calculateConfidence({
      sourceType: source_type,
      verified,
      date,
      contentLength: (article.raw_text || article.headline || '').length,
      hasUrl: Boolean(url),
    })
    
    documents.push({
      id: docId,
      title: article.headline,
      source_id: sourceId,
      content: article.raw_text || article.headline,
      speaker: speaker,
      role: role,
      date: date,
      published_at,
      type: type,
      summary: summary,
      tags: tags,
      topics,
      source_type,
      verified,
      confidence,
      url,
      language,
    })
  }
  
  // Check for existing documents and handle accordingly
  console.log('🔍 Checking for existing documents...')
  const { data: existingDocs, error: checkError, count } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
  
  if (checkError) {
    console.warn('⚠️  Warning: Could not check existing documents:', checkError.message)
  } else if (count && count > 0) {
    console.log(`ℹ️  Found ${count} existing document(s) in database.`)
    console.log('ℹ️  Using upsert to update existing documents and insert new ones.')
    console.log('ℹ️  To clear all data first, run this SQL in Supabase:')
    console.log('   DELETE FROM documents; DELETE FROM topics;')
  } else {
    console.log('✅ No existing documents found - will insert new documents')
  }
  
  // Verify we have documents to insert
  if (documents.length === 0) {
    console.error('❌ ERROR: No documents to insert!')
    console.error('   This means no articles were successfully processed from CSV files.')
    console.error('   Check that:')
    console.error('   1. CSV files exist in golden_dataset/ directory')
    console.error('   2. CSV files have valid data')
    console.error('   3. Source IDs match between articles and created sources')
    throw new Error('No documents to insert')
  }
  
  console.log(`📄 Prepared ${documents.length} documents for insertion`)
  console.log(`   Sample document: ${documents[0]?.title?.substring(0, 50)}...`)
  console.log(`   Sample source_id: "${documents[0]?.source_id}"`)
  console.log('')
  
  // First, test if we can read from the database (verifies key works)
  console.log('🔍 Testing service role key access...')
  const { data: testRead, error: readError } = await supabase
    .from('sources')
    .select('id')
    .limit(1)
  
  if (readError) {
    console.error('❌ Cannot read from database!')
    console.error(`   Error: ${readError.message}`)
    console.error('   This suggests the service role key might not be working correctly.')
    console.error('   Verify you\'re using SUPABASE_SERVICE_ROLE_KEY (not SUPABASE_ANON_KEY)')
    throw readError
  }
  console.log('✅ Service role key can read from database')
  
  // Test RLS with a single document insert
  console.log('🧪 Testing document insert...')
  const testDoc = documents[0]
  
  // Log the test document structure for debugging
  console.log(`   Test document structure:`)
  console.log(`   - id: "${testDoc.id}"`)
  console.log(`   - source_id: "${testDoc.source_id}"`)
  console.log(`   - title: "${testDoc.title.substring(0, 50)}..."`)
  console.log(`   - content length: ${testDoc.content.length} chars`)
  console.log(`   - type: "${testDoc.type}"`)
  
  // Log the exact JSON being sent to PostgREST
  console.log(`   Document JSON being sent:`)
  console.log(`   ${JSON.stringify(testDoc, null, 2)}`)
  console.log('')
  
  // Check for potential issues
  const issues: string[] = []
  if (!testDoc.id || testDoc.id.trim() === '') issues.push('id is empty')
  if (!testDoc.title || testDoc.title.trim() === '') issues.push('title is empty')
  if (!testDoc.source_id || testDoc.source_id.trim() === '') issues.push('source_id is empty')
  if (!testDoc.content || testDoc.content.trim() === '') issues.push('content is empty')
  if (!testDoc.type || testDoc.type.trim() === '') issues.push('type is empty')
  if (testDoc.date && testDoc.date.trim() !== '' && isNaN(Date.parse(testDoc.date))) {
    issues.push(`date is invalid: "${testDoc.date}"`)
  }
  if (testDoc.tags && !Array.isArray(testDoc.tags)) issues.push('tags is not an array')
  
  if (issues.length > 0) {
    console.error(`   ⚠️  Potential data issues found:`)
    issues.forEach(issue => console.error(`      - ${issue}`))
    console.error('')
  }
  
  // Use upsert for test insert to handle duplicates
  const { data: testData, error: testError } = await supabase
    .from('documents')
    .upsert([testDoc], {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
  
  if (testError) {
    console.error('❌ Document Insert Test Failed!')
    console.error(`   Error: ${testError.message}`)
    console.error(`   Code: ${testError.code || 'N/A'}`)
    console.error(`   Details: ${testError.details || 'N/A'}`)
    console.error(`   Hint: ${testError.hint || 'N/A'}`)
    console.error('')
    
    // Check if it's a data validation issue
    if (testError.message.includes('null value') || testError.message.includes('violates not-null')) {
      console.error('🔍 Data Validation Error!')
      console.error('   One or more required fields are NULL or invalid')
      console.error('   Check the document structure above')
    }
    
    // Check if it's a foreign key issue
    if (testError.message.includes('foreign key') || testError.message.includes('source_id')) {
      console.error('🔍 Foreign Key Error!')
      console.error(`   source_id "${testDoc.source_id}" might not exist in sources table`)
    }
    
    // Check if it's a trigger issue
    if (testError.message.includes('trigger') || testError.message.includes('function')) {
      console.error('🔍 Trigger/Function Error!')
      console.error('   The trigger function might be causing issues')
      console.error('   Check: database/schema.sql line 151-164 (update_topic_document_count function)')
    }
    
    console.error('')
    
    // Check if it's the "UPDATE requires WHERE clause" error
    if (testError.message.includes('UPDATE requires') || testError.code === '21000') {
      console.error('🔍 PostgREST RLS Error Detected!')
      console.error('   This error occurs when PostgREST checks UPDATE policies even for INSERT.')
      console.error('   Even with RLS disabled, PostgREST might still enforce this.')
      console.error('')
      console.error('🔄 Trying RPC function workaround (bypasses PostgREST RLS checks)...')
      
      // Try using RPC function as workaround
      // PostgREST will convert the array to jsonb[] automatically
      const testDocJson = {
        id: testDoc.id,
        title: testDoc.title,
        source_id: testDoc.source_id,
        content: testDoc.content,
        speaker: testDoc.speaker || null,
        role: testDoc.role || null,
        date: testDoc.date || null,
        published_at: testDoc.published_at || null,
        type: testDoc.type,
        summary: testDoc.summary || null,
        tags: testDoc.tags || [],
        topics: testDoc.topics || [],
        url: testDoc.url || null,
        source_type: testDoc.source_type || 'news',
        verified: typeof testDoc.verified === 'boolean' ? testDoc.verified : null,
        confidence: typeof testDoc.confidence === 'number' ? testDoc.confidence : null,
        language: testDoc.language || null,
      }
      
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('insert_documents', {
          doc_data: [testDocJson]
        })
      
      if (rpcError) {
        if (rpcError.message.includes('function') || rpcError.message.includes('does not exist')) {
          console.error('   ❌ RPC function not found!')
          console.error('   📋 SOLUTION: Run this SQL in Supabase SQL Editor:')
          console.error('      File: database/create-insert-function.sql')
          console.error('   This creates a function that bypasses PostgREST RLS checks.')
        } else {
          console.error(`   ❌ RPC function also failed: ${rpcError.message}`)
        }
        throw testError // Throw original error
      } else {
        console.log('   ✅ RPC function workaround succeeded!')
        console.log('   Using RPC function for all document inserts...')
        // Delete test document
        await supabase.from('documents').delete().eq('id', testDoc.id)
        // Set flag to use RPC for all inserts
        ;(global as any).useRpcForDocuments = true
        console.log('')
      }
    }
    
    // Check if it's a foreign key issue
    if (testError.message.includes('foreign key') || testError.message.includes('source_id')) {
      console.error('🔍 Foreign Key Issue Detected!')
      const { data: sources } = await supabase.from('sources').select('id, name')
      console.error(`   Available source IDs: ${sources?.map(s => s.id).join(', ') || 'NONE'}`)
      console.error(`   Document is trying to use: "${testDoc.source_id}"`)
    }
    
    throw testError
  } else {
    console.log('✅ Document Insert Test Passed!')
    console.log(`   Test document ID: ${testData?.[0]?.id}`)
    // Delete the test document
    await supabase.from('documents').delete().eq('id', testDoc.id)
    console.log('   Test document cleaned up.')
    console.log('')
  }
  
  // Insert documents in smaller batches
  const batchSize = 10
  let successCount = 0
  let errorCount = 0
  
  // Check if we should use RPC function (set during test)
  const useRpc = (global as any).useRpcForDocuments === true
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    
    try {
      // Use RPC function if direct insert failed during test
      if (useRpc) {
        // Convert batch to JSONB array format for RPC
        const docData = batch.map(doc => ({
          id: doc.id,
          title: doc.title,
          source_id: doc.source_id,
          content: doc.content,
          speaker: doc.speaker || null,
          role: doc.role || null,
          date: doc.date || null,
          published_at: doc.published_at || null,
          type: doc.type,
          summary: doc.summary || null,
          tags: doc.tags || [],
          topics: doc.topics || [],
          url: doc.url || null,
          source_type: doc.source_type || 'news',
          verified: typeof doc.verified === 'boolean' ? doc.verified : null,
          confidence: typeof doc.confidence === 'number' ? doc.confidence : null,
          language: doc.language || null,
        }))
        
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('insert_documents', { doc_data: docData })
        
        if (rpcError) {
          console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1} via RPC:`, rpcError.message)
          errorCount += batch.length
        } else {
          console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} via RPC (${batch.length} documents)`)
          successCount += batch.length
        }
        continue
      }
      
      // Use upsert to handle duplicates gracefully (insert new, update existing)
      const { error, data } = await supabase
        .from('documents')
        .upsert(batch, {
          onConflict: 'id',
          ignoreDuplicates: false // Update if exists, insert if new
        })
        .select()
      
      if (error) {
        console.error(`❌ Error upserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
        console.error(`   Error code: ${error.code || 'N/A'}`)
        console.error(`   Error details: ${error.details || 'N/A'}`)
        console.error(`   Error hint: ${error.hint || 'N/A'}`)
        
        // If error is "update requires where clause", trigger function might need fixing
        if (error.message.includes('update requires where clause') || error.message.includes('UPDATE') || error.code === '21000') {
          console.error(`   ⚠️  This error is likely caused by the trigger function`)
          console.error(`   📋 SOLUTION: Run database/fix-schema.sql in Supabase SQL Editor`)
          console.error(`   This fixes the ambiguous trigger function`)
        } else {
          // Log detailed debugging info for other errors (non-duplicate errors)
          if (batch.length > 0) {
            const firstDoc = batch[0]
            console.error(`   📄 First document in batch:`)
            console.error(`      - source_id: "${firstDoc.source_id}"`)
            console.error(`      - title: ${firstDoc.title.substring(0, 50)}...`)
            
            // Check if source exists
            const sourceExists = existingSourceIds.has(firstDoc.source_id)
            console.error(`      - Source exists in database: ${sourceExists}`)
            
            if (!sourceExists) {
              console.error(`      - Available source IDs: ${Array.from(existingSourceIds).join(', ')}`)
            }
            
            // Check for foreign key constraint
            if (error.message.includes('foreign key') || error.message.includes('source_id')) {
              console.error(`   🔍 Foreign Key Constraint Error!`)
              console.error(`      The source_id "${firstDoc.source_id}" does not exist in sources table.`)
            }
            
            // Check for RLS issues
            if (error.message.includes('RLS') || error.message.includes('policy') || error.message.includes('permission')) {
              console.error(`   🔍 RLS/Permission Error!`)
              console.error(`      Even with service role key, this might indicate a policy issue.`)
            }
          }
          errorCount += batch.length
        }
      } else {
        // Success! Insert worked
        const insertedCount = data?.length || batch.length
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${insertedCount} documents)`)
        successCount += batch.length
      }
    } catch (error) {
      console.error(`❌ Unexpected error in batch ${Math.floor(i / batchSize) + 1}:`, error)
      errorCount += batch.length
    }
  }
  
  console.log('')
  console.log(`📊 Documents processed: ${successCount} successful, ${errorCount} errors`)
  console.log(`📊 Total documents prepared: ${documents.length}`)
  
  // Verify final count
  const { count: finalCount, error: countError } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.warn(`⚠️  Could not verify final document count: ${countError.message}`)
  } else {
    console.log(`📊 Final document count in database: ${finalCount || 0}`)
    if (finalCount === 0 && successCount > 0) {
      console.error('❌ WARNING: Script reported success but database is empty!')
      console.error('   This suggests a transaction rollback or silent failure.')
    }
  }

  return { documents, topicMetaById }
}

// Create topics based on extracted topic IDs in documents
async function createTopics(
  documents: ProcessedDocument[],
  topicMetaById: Map<string, { id: string; name: string; description: string }>
): Promise<void> {
  console.log('📋 Creating topics...')
  
  // Count documents per topic
  const topicCounts = new Map<string, number>()
  
  for (const doc of documents) {
    for (const topicId of doc.topics || []) {
      topicCounts.set(topicId, (topicCounts.get(topicId) || 0) + 1)
    }
  }
  
  const nowIso = new Date().toISOString()

  // Create topic entries
  const topics = Array.from(topicMetaById.values()).map(meta => ({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    document_count: topicCounts.get(meta.id) || 0,
    last_updated: nowIso
  }))

  if (topics.length === 0) {
    console.warn('⚠️  No topics generated (documents have no topics). Skipping topics upsert.')
    return
  }
  
  // Insert topics with better error handling
  try {
    const { error } = await supabase
      .from('topics')
      .upsert(topics, { onConflict: 'id' })
    
    if (error) {
      console.error('❌ Error inserting topics:', error.message)
    } else {
      console.log(`✅ Created/updated ${topics.length} topics`)
    }
  } catch (error) {
    console.error('❌ Unexpected error inserting topics:', error)
  }
}

// Main ingestion function
async function ingestGoldenDataset() {
  try {
    console.log('🌱 Starting golden dataset ingestion...')
    
    // Check if golden_dataset directory exists
    const goldenDatasetPath = resolve(process.cwd(), 'golden_dataset')
    if (!fs.existsSync(goldenDatasetPath)) {
      console.error('❌ golden_dataset directory not found')
      process.exit(1)
    }
    
    // Create sources first
    const sourceMap = await createSources()
    
    // Wait a moment to ensure sources are committed
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Verify sources were created
    const { data: verifySources, error: verifyError } = await supabase
      .from('sources')
      .select('id, name')
    
    if (verifyError) {
      console.error('❌ Error verifying sources:', verifyError.message)
    } else {
      console.log(`✅ Verified ${verifySources?.length || 0} sources in database:`)
      verifySources?.forEach(s => console.log(`   - ${s.id}: ${s.name}`))
    }
    
    // Process all CSV files - use the actual files that exist in golden_dataset
    const csvFiles = [
      'full_cna_articles.csv',
      'full_straits_times_articles.csv',
      'full_hansard_master.csv',
      'full_lawgaz_master.csv',
      'full_lianhezaobao_articles.csv'
    ]
    
    let allArticles: ArticleData[] = []
    
    for (const csvFile of csvFiles) {
      const filePath = resolve(goldenDatasetPath, csvFile)
      if (fs.existsSync(filePath)) {
        const articles = await processCSVFile(filePath)
        allArticles = allArticles.concat(articles)
      } else {
        console.warn(`⚠️  File not found: ${csvFile}`)
      }
    }
    
    if (allArticles.length === 0) {
      console.error('❌ No articles found in CSV files')
      process.exit(1)
    }
    
    // Process and insert documents
    const { documents, topicMetaById } = await processDocuments(allArticles, sourceMap)
    
    // Create topics
    await createTopics(documents, topicMetaById)
    
    console.log('🎉 Golden dataset ingestion completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Articles processed: ${allArticles.length}`)
    console.log(`   - Documents prepared: ${documents.length}`)
    console.log(`   - Sources: ${sourceMap.size}`)
    
  } catch (error) {
    console.error('❌ Error during ingestion:', error)
    process.exit(1)
  }
}

// Run the ingestion
ingestGoldenDataset()
