import { DatabaseService } from './database'
import { INITIAL_SOURCES, INITIAL_DOCUMENTS, INITIAL_TOPICS } from '../src/lib/mockData'

// Temporarily use mock data until Supabase is configured
export const DataService = {
  async getSources() {
    // Temporarily return mock data
    console.log('Using mock data - configure Supabase to use real data')
    return INITIAL_SOURCES
    
    // Uncomment this when Supabase is configured:
    // try {
    //   return await DatabaseService.getSources()
    // } catch (error) {
    //   console.warn('Database unavailable, using mock data:', error)
    //   return INITIAL_SOURCES
    // }
  },

  async getDocuments() {
    // Temporarily return mock data
    console.log('Using mock data - configure Supabase to use real data')
    return INITIAL_DOCUMENTS
    
    // Uncomment this when Supabase is configured:
    // try {
    //   return await DatabaseService.getDocuments()
    // } catch (error) {
    //   console.warn('Database unavailable, using mock data:', error)
    //   return INITIAL_DOCUMENTS
    // }
  },

  async getTopics() {
    // Temporarily return mock data
    console.log('Using mock data - configure Supabase to use real data')
    return INITIAL_TOPICS
    
    // Uncomment this when Supabase is configured:
    // try {
    //   return await DatabaseService.getTopics()
    // } catch (error) {
    //   console.warn('Database unavailable, using mock data:', error)
    //   return INITIAL_TOPICS
    // }
  },

  async searchDocuments(query: string) {
    // Temporarily return mock search
    console.log('Using mock search - configure Supabase to use real search')
    return INITIAL_DOCUMENTS.filter(doc =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.content.toLowerCase().includes(query.toLowerCase()) ||
      doc.speaker.toLowerCase().includes(query.toLowerCase())
    )
    
    // Uncomment this when Supabase is configured:
    // try {
    //   return await DatabaseService.searchDocuments(query)
    // } catch (error) {
    //   console.warn('Database unavailable, using mock search:', error)
    //   return INITIAL_DOCUMENTS.filter(doc =>
    //     doc.title.toLowerCase().includes(query.toLowerCase()) ||
    //     doc.content.toLowerCase().includes(query.toLowerCase()) ||
    //     doc.speaker.toLowerCase().includes(query.toLowerCase())
    //   )
    // }
  }
}
