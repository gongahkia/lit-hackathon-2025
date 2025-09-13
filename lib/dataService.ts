import { DatabaseService } from './database'
import { INITIAL_SOURCES, INITIAL_DOCUMENTS, INITIAL_TOPICS } from './mockData'

// Fallback to mock data if database fails
export const DataService = {
  async getSources() {
    try {
      return await DatabaseService.getSources()
    } catch (error) {
      console.warn('Database unavailable, using mock data:', error)
      return INITIAL_SOURCES
    }
  },

  async getDocuments() {
    try {
      return await DatabaseService.getDocuments()
    } catch (error) {
      console.warn('Database unavailable, using mock data:', error)
      return INITIAL_DOCUMENTS
    }
  },

  async getTopics() {
    try {
      return await DatabaseService.getTopics()
    } catch (error) {
      console.warn('Database unavailable, using mock data:', error)
      return INITIAL_TOPICS
    }
  },

  async searchDocuments(query: string) {
    try {
      return await DatabaseService.searchDocuments(query)
    } catch (error) {
      console.warn('Database unavailable, using mock search:', error)
      // Fallback to client-side search
      return INITIAL_DOCUMENTS.filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.speaker.toLowerCase().includes(query.toLowerCase())
      )
    }
  }
}
