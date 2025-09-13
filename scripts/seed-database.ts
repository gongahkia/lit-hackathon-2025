import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

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

// Mock data (inline to avoid import issues)
const INITIAL_SOURCES = [
  {
    id: "parliament-gov",
    name: "Parliament of Singapore",
    url: "https://www.parliament.gov.sg",
    type: "official",
    lastUpdated: "2024-01-15T10:00:00.000Z",
    status: "active"
  },
  {
    id: "moh-gov",
    name: "Ministry of Health",
    url: "https://www.moh.gov.sg",
    type: "ministry",
    lastUpdated: "2024-01-15T10:00:00.000Z",
    status: "active"
  },
  {
    id: "mti-gov",
    name: "Ministry of Trade and Industry",
    url: "https://www.mti.gov.sg",
    type: "ministry",
    lastUpdated: "2024-01-15T10:00:00.000Z",
    status: "active"
  }
]

const INITIAL_DOCUMENTS = [
  {
    id: "doc-1",
    title: "Parliamentary Statement on Healthcare Policy",
    source: "parliament-gov",
    date: "2024-01-15",
    type: "statement",
    content: "This parliamentary statement addresses the recent healthcare policy changes and their implications for Singapore's healthcare system. The statement covers funding allocations, service improvements, and patient care enhancements.",
    summary: "Key points about healthcare policy changes",
    speaker: "Minister of Health",
    tags: ["healthcare", "policy", "parliament"]
  },
  {
    id: "doc-2",
    title: "Ministerial Release on Economic Development",
    source: "mti-gov",
    date: "2024-01-20",
    type: "release",
    content: "This ministerial release outlines new economic development initiatives aimed at strengthening Singapore's position as a global business hub. The initiatives focus on digital transformation, sustainable growth, and innovation.",
    summary: "Economic development initiatives",
    speaker: "Minister of Trade and Industry",
    tags: ["economy", "development", "ministry"]
  },
  {
    id: "doc-3",
    title: "Education Reform Policy Update",
    source: "parliament-gov",
    date: "2024-01-25",
    type: "statement",
    content: "The education reform policy update introduces new measures to enhance learning outcomes and prepare students for the future economy. Key areas include curriculum updates, teacher training, and technology integration.",
    summary: "Education system improvements and reforms",
    speaker: "Minister of Education",
    tags: ["education", "reform", "policy"]
  }
]

const INITIAL_TOPICS = [
  {
    id: "topic-1",
    name: "Healthcare Policy",
    description: "Healthcare and medical policy discussions",
    documentCount: 15,
    lastUpdated: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic-2",
    name: "Economic Development",
    description: "Economic growth and development initiatives",
    documentCount: 23,
    lastUpdated: "2024-01-15T10:00:00.000Z"
  },
  {
    id: "topic-3",
    name: "Education Reform",
    description: "Educational system improvements and reforms",
    documentCount: 8,
    lastUpdated: "2024-01-15T10:00:00.000Z"
  }
]

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Insert sources
    console.log('📊 Inserting sources...')
    const { error: sourcesError } = await supabase
      .from('sources')
      .insert(INITIAL_SOURCES.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        type: source.type,
        last_updated: source.lastUpdated,
        status: source.status
      })))

    if (sourcesError) throw sourcesError
    console.log('✅ Sources inserted successfully')

    // Insert topics
    console.log('📋 Inserting topics...')
    const { error: topicsError } = await supabase
      .from('topics')
      .insert(INITIAL_TOPICS.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        document_count: topic.documentCount,
        last_updated: topic.lastUpdated
      })))

    if (topicsError) throw topicsError
    console.log('✅ Topics inserted successfully')

    // Insert documents
    console.log('📄 Inserting documents...')
    const { error: documentsError } = await supabase
      .from('documents')
      .insert(INITIAL_DOCUMENTS.map(doc => ({
        id: doc.id,
        title: doc.title,
        source_id: doc.source,
        date: doc.date,
        type: doc.type,
        content: doc.content,
        summary: doc.summary,
        speaker: doc.speaker,
        tags: doc.tags
      })))

    if (documentsError) throw documentsError
    console.log('✅ Documents inserted successfully')

    console.log('🎉 Database seeded successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Sources: ${INITIAL_SOURCES.length}`)
    console.log(`   - Topics: ${INITIAL_TOPICS.length}`)
    console.log(`   - Documents: ${INITIAL_DOCUMENTS.length}`)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
