import { supabase } from './supabase'

// Types matching frontend requirements
export interface Source {
  id: string
  name: string
  url: string
  type: string
  lastUpdated: string
  status: string
  documentCount?: number
}

export interface Document {
  id: string
  title: string
  source: string
  source_name?: string
  source_url?: string
  source_category?: string
  date: string
  publishedAt: string
  type: string
  content: string
  summary: string
  speaker: string
  role?: string
  tags: string[]
  topics: string[]
  sourceType: string
  verified: boolean
  confidence: number
  contradictions: string[]
  url?: string
}

export interface Topic {
  id: string
  name: string
  description: string
  documentCount: number
  lastUpdated: string
}

// Database service functions
export class DatabaseService {
  // Sources
  static async getSources(): Promise<Source[]> {
    const { data, error } = await supabase
      .from('sources_frontend')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(source => ({
      id: source.id,
      name: source.name,
      url: source.url,
      type: source.type,
      lastUpdated: source.lastUpdated,
      status: source.status,
      documentCount: source.document_count
    }))
  }

  // Documents
  static async getDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents_frontend')
      .select('*')
      .order('published_at', { ascending: false })

    if (error) throw error

    return data.map(doc => ({
      id: doc.id,
      title: doc.title,
      source: doc.source_id,
      source_name: doc.source_name,
      source_url: doc.source_url,
      source_category: doc.source_category,
      date: doc.date,
      publishedAt: doc.published_at,
      type: doc.type,
      content: doc.content,
      summary: doc.summary || '',
      speaker: doc.speaker || '',
      role: doc.role,
      tags: doc.tags || [],
      topics: doc.topics || [],
      sourceType: doc.source_type,
      verified: doc.verified,
      confidence: doc.confidence,
      contradictions: doc.contradictions || [],
      url: doc.url
    }))
  }

  // Topics
  static async getTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics_frontend')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(topic => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      documentCount: topic.documentCount,
      lastUpdated: topic.lastUpdated
    }))
  }

  // Search documents
  static async searchDocuments(query: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents_frontend')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,speaker.ilike.%${query}%`)
      .order('published_at', { ascending: false })

    if (error) throw error

    return data.map(doc => ({
      id: doc.id,
      title: doc.title,
      source: doc.source_id,
      source_name: doc.source_name,
      source_url: doc.source_url,
      source_category: doc.source_category,
      date: doc.date,
      publishedAt: doc.published_at,
      type: doc.type,
      content: doc.content,
      summary: doc.summary || '',
      speaker: doc.speaker || '',
      role: doc.role,
      tags: doc.tags || [],
      topics: doc.topics || [],
      sourceType: doc.source_type,
      verified: doc.verified,
      confidence: doc.confidence,
      contradictions: doc.contradictions || [],
      url: doc.url
    }))
  }
}
