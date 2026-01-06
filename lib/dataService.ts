import { DatabaseService } from './database'
import { INITIAL_SOURCES, INITIAL_DOCUMENTS, INITIAL_TOPICS } from '../src/lib/mockData'

// Environment variable to control mock data fallback
// Set USE_MOCK_DATA_FALLBACK=true to allow fallback to mock data on database errors
// Set to false or unset to fail fast (recommended for production)
const USE_MOCK_DATA_FALLBACK = process.env.USE_MOCK_DATA_FALLBACK === 'true'

/**
 * DataService - Unified data access layer
 * 
 * P0.2 Implementation: Supabase-first with optional mock fallback
 * - Primary: Uses Supabase via DatabaseService
 * - Fallback: Only if USE_MOCK_DATA_FALLBACK=true (for development)
 * - Production: Fails fast to surface database issues
 */
export const DataService = {
  async getSources() {
    try {
      return await DatabaseService.getSources()
    } catch (error) {
      console.error('Database error in getSources:', error)
      
      if (USE_MOCK_DATA_FALLBACK) {
        console.warn('Database unavailable, using mock data fallback')
        return INITIAL_SOURCES
      }
      
      // Fail fast - don't silently fallback in production
      throw new Error(`Failed to fetch sources from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async getDocuments() {
    try {
      return await DatabaseService.getDocuments()
    } catch (error) {
      console.error('Database error in getDocuments:', error)
      
      if (USE_MOCK_DATA_FALLBACK) {
        console.warn('Database unavailable, using mock data fallback')
        return INITIAL_DOCUMENTS
      }
      
      // Fail fast - don't silently fallback in production
      throw new Error(`Failed to fetch documents from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async getTopics() {
    try {
      return await DatabaseService.getTopics()
    } catch (error) {
      console.error('Database error in getTopics:', error)
      
      if (USE_MOCK_DATA_FALLBACK) {
        console.warn('Database unavailable, using mock data fallback')
        return INITIAL_TOPICS
      }
      
      // Fail fast - don't silently fallback in production
      throw new Error(`Failed to fetch topics from database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async searchDocuments(query: string) {
    try {
      return await DatabaseService.searchDocuments(query)
    } catch (error) {
      console.error('Database error in searchDocuments:', error)
      
      if (USE_MOCK_DATA_FALLBACK) {
        console.warn('Database unavailable, using mock search fallback')
        return INITIAL_DOCUMENTS.filter(doc =>
          doc.title.toLowerCase().includes(query.toLowerCase()) ||
          doc.content.toLowerCase().includes(query.toLowerCase()) ||
          doc.speaker.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      // Fail fast - don't silently fallback in production
      throw new Error(`Failed to search documents in database: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
