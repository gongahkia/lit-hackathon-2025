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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Interface for CSV article data
interface ArticleData {
  headline: string
  url: string
  date?: string
  raw_text?: string
}

// Interface for processed document data
interface ProcessedDocument {
  id: string
  title: string
  source_id: string
  content: string
  speaker?: string
  date?: string
  type: string
  summary?: string
  tags: string[]
}

// Interface for source data
interface SourceData {
  id: string
  name: string
  url: string
  type: string
  last_updated: string
  status: string
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
  
  return 'Unknown Speaker'
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
async function processCSVFile(filePath: string): Promise<ArticleData[]> {
  return new Promise((resolve, reject) => {
    const articles: ArticleData[] = []
    
    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        articles.push({
          headline: row.headline || '',
          url: row.url || '',
          date: row.date || undefined,
          raw_text: row.raw_text || undefined
        })
      })
      .on('end', () => {
        console.log(`📄 Processed ${articles.length} articles from ${filePath}`)
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
      status: "active"
    },
    {
      id: "cna",
      name: "Channel News Asia",
      url: "https://www.channelnewsasia.com",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active"
    }, 
    { 
      id: "straitstimes",
      name: "The Straits Times",
      url: "https://www.straitstimes.com",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active"
    }, 
    { 
      id: "hansard",
      name: "Hansard",
      url: "https://hansard.parliament.sg",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active"
    }, 
    {
      id: "lawgazette",
      name: "Singapore Law Gazette",
      url: "https://www.lawgazette.gov.sg",
      type: "news",
      last_updated: "2024-01-15T10:00:00.000Z",
      status: "active"
    }
  ]
  
  console.log('📊 Creating sources...')
  
  for (const source of sources) {
    const { error } = await supabase
      .from('sources')
      .upsert(source, { onConflict: 'id' })
    
    if (error) {
      console.warn(`⚠️  Warning: Could not insert source ${source.name}:`, error.message)
    } else {
      console.log(`✅ Source created: ${source.name}`)
      sourceMap.set(source.name.toLowerCase(), source.id)
    }
  }
  
  return sourceMap
}

// Process and insert documents
async function processDocuments(articles: ArticleData[], sourceMap: Map<string, string>): Promise<void> {
  console.log('📄 Processing documents...')
  
  const documents: ProcessedDocument[] = []
  
  for (const article of articles) {
    // Determine source
    let sourceId = 'cna-news' // default
    if (article.url.includes('straitstimes.com')) {
      sourceId = 'straits-times'
    } else if (article.url.includes('parliament.gov.sg')) {
      sourceId = 'parliament-gov'
    }
    
    // Generate document ID
    const docId = generateId('doc', article.headline + article.url)
    
    // Extract speaker
    const speaker = extractSpeaker(article.headline, article.raw_text)
    
    // Generate summary
    const summary = generateSummary(article.raw_text || article.headline)
    
    // Extract tags
    const tags = extractTags(article.headline, article.raw_text)
    
    // Determine document type
    const type = getDocumentType(article.headline, article.raw_text)
    
    // Parse date
    const date = parseDate(article.date)
    
    documents.push({
      id: docId,
      title: article.headline,
      source_id: sourceId,
      content: article.raw_text || article.headline,
      speaker: speaker,
      date: date,
      type: type,
      summary: summary,
      tags: tags
    })
  }
  
  // Clear existing documents first to avoid conflicts
  console.log('🗑️  Clearing existing documents...')
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .neq('id', '') // Delete all documents
  
  if (deleteError) {
    console.warn('⚠️  Warning: Could not clear existing documents:', deleteError.message)
  } else {
    console.log('✅ Cleared existing documents')
  }
  
  // Insert documents in smaller batches
  const batchSize = 10
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('documents')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
        errorCount += batch.length
      } else {
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} documents)`)
        successCount += batch.length
      }
    } catch (error) {
      console.error(`❌ Unexpected error in batch ${Math.floor(i / batchSize) + 1}:`, error)
      errorCount += batch.length
    }
  }
  
  console.log(`📊 Documents processed: ${successCount} successful, ${errorCount} errors`)
  
  console.log(`📊 Total documents processed: ${documents.length}`)
}

// Create topics based on document tags
async function createTopics(documents: ProcessedDocument[]): Promise<void> {
  console.log('📋 Creating topics...')
  
  // Count documents per topic
  const topicCounts = new Map<string, number>()
  
  for (const doc of documents) {
    for (const tag of doc.tags) {
      topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1)
    }
  }
  
  // Create topic entries
  const topics = Array.from(topicCounts.entries()).map(([name, count]) => ({
    id: `topic-${name.replace(/\s+/g, '-')}`,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: `Documents related to ${name}`,
    document_count: count,
    last_updated: new Date().toISOString()
  }))
  
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
    
    // Process all CSV files
    const csvFiles = [
      'cna_parliament_articles.csv',
      'straits_times_parliament_articles.csv',
      'full_cna_articles.csv',
      'full_straits_times_articles.csv'
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
    await processDocuments(allArticles, sourceMap)
    
    // Create topics
    const documents: ProcessedDocument[] = allArticles.map(article => {
      const sourceId = article.url.includes('straitstimes.com') ? 'straits-times' : 
                      article.url.includes('parliament.gov.sg') ? 'parliament-gov' : 'cna-news'
      
      return {
        id: generateId('doc', article.headline + article.url),
        title: article.headline,
        source_id: sourceId,
        content: article.raw_text || article.headline,
        speaker: extractSpeaker(article.headline, article.raw_text),
        date: parseDate(article.date),
        type: getDocumentType(article.headline, article.raw_text),
        summary: generateSummary(article.raw_text || article.headline),
        tags: extractTags(article.headline, article.raw_text)
      }
    })
    
    await createTopics(documents)
    
    console.log('🎉 Golden dataset ingestion completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Articles processed: ${allArticles.length}`)
    console.log(`   - Documents created: ${documents.length}`)
    console.log(`   - Sources: ${sourceMap.size}`)
    
  } catch (error) {
    console.error('❌ Error during ingestion:', error)
    process.exit(1)
  }
}

// Run the ingestion
ingestGoldenDataset()
