import { supabase } from './supabase'

// Types matching your mock data
export interface Source {
  id: string
  name: string
  url: string
  type: string
  lastUpdated: string
  status: string
}

export interface Document {
  id: string
  title: string
  source: string
  date: string
  type: string
  content: string
  summary: string
  speaker: string
  tags: string[]
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
      .from('sources')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(source => ({
      id: source.id,
      name: source.name,
      url: source.url,
      type: source.type,
      lastUpdated: source.last_updated,
      status: source.status
    }))
  }

  // Documents
  static async getDocuments(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(doc => ({
      id: doc.id,
      title: doc.title,
      source: doc.source_id,
      date: doc.date,
      type: doc.type,
      content: doc.content,
      summary: doc.summary || '',
      speaker: doc.speaker || '',
      tags: doc.tags || []
    }))
  }

  // Topics
  static async getTopics(): Promise<Topic[]> {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(topic => ({
      id: topic.id,
      name: topic.name,
      description: topic.description,
      documentCount: topic.document_count,
      lastUpdated: topic.last_updated
    }))
  }

  // Search documents
  static async searchDocuments(query: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,speaker.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map(doc => ({
      id: doc.id,
      title: doc.title,
      source: doc.source_id,
      date: doc.date,
      type: doc.type,
      content: doc.content,
      summary: doc.summary || '',
      speaker: doc.speaker || '',
      tags: doc.tags || []
    }))
  }
}
