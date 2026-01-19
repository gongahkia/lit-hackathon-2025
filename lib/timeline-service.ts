import { getSupabaseAdmin, isStandaloneMode } from './supabase'
import { FileStorage } from '../src/lib/file-storage'

export interface TimelineEvent {
  id: string
  type: 'creation' | 'amendment' | 'dissolution'
  date: string
  document_id?: string
  document_title: string
  summary: string
  speakers: string[]
  url?: string
  topic: string
  topic_name: string
  isAiGenerated?: boolean
}

interface DocumentData {
  id: string
  title: string
  summary: string
  speaker: string
  role?: string
  published_at: string
  date: string
  url?: string
  topics: string[]
  source_type: string
  content?: string
}

/**
 * Generate a timeline of policy development for a specific document
 * Based on related Hansard documents sharing the same topics
 * Falls back to mock data in standalone mode
 */
export class TimelineService {
  /**
   * Generate timeline events for a document
   */
  static async generateDocumentTimeline(documentId: string): Promise<TimelineEvent[]> {
    // Use mock timeline in standalone mode
    if (isStandaloneMode) {
      return this.generateMockTimeline(documentId)
    }

    try {
      const supabase = getSupabaseAdmin()

      if (!supabase) {
        return this.generateMockTimeline(documentId)
      }

      // Get the current document
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('id, topics, published_at')
        .eq('id', documentId)
        .single()

      if (docError || !currentDoc) {
        console.error('Error fetching current document:', docError)
        return this.generateMockTimeline(documentId)
      }

      // Get document's topics
      const documentTopics = (currentDoc.topics || []) as string[]
      if (documentTopics.length === 0) {
        return this.generateMockTimeline(documentId)
      }

      // Get topic names
      const { data: topicsData } = await supabase
        .from('topics')
        .select('id, name')
        .in('id', documentTopics)

      const topicMap = new Map<string, string>()
      if (topicsData) {
        topicsData.forEach(t => topicMap.set(t.id, t.name))
      }

      // Find all related documents sharing the same topics
      // Filter by parliamentary source type (Hansard documents)
      const { data: relatedDocs, error: relatedError } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          summary,
          speaker,
          role,
          published_at,
          date,
          url,
          topics,
          source_type,
          content
        `)
        .eq('source_type', 'parliamentary')
        .neq('id', documentId)
        .order('published_at', { ascending: true })

      if (relatedError) {
        console.error('Error fetching related documents:', relatedError)
        return this.generateMockTimeline(documentId)
      }

      // Filter documents that share at least one topic with the current document
      const relevantDocs = (relatedDocs || []).filter((doc: DocumentData) => {
        const docTopics = (doc.topics || []) as string[]
        return docTopics.some(topicId => documentTopics.includes(topicId))
      })

      // If we have few or no relevant documents, generate mock timeline
      if (relevantDocs.length === 0) {
        return this.generateMockTimeline(documentId)
      }

      // Group documents by topic and classify events
      const events: TimelineEvent[] = []
      const topicFirstSeen = new Map<string, string>() // topicId -> first document date

      for (const doc of relevantDocs) {
        const docTopics = (doc.topics || []) as string[]
        const docDate = doc.published_at || doc.date

        for (const topicId of docTopics) {
          if (!documentTopics.includes(topicId)) continue

          const firstSeenDate = topicFirstSeen.get(topicId)
          const isFirst = !firstSeenDate
          const isDissolution = this.detectDissolution(doc.content || doc.summary || '')

          let eventType: 'creation' | 'amendment' | 'dissolution'
          if (isDissolution) {
            eventType = 'dissolution'
          } else if (isFirst) {
            eventType = 'creation'
            topicFirstSeen.set(topicId, docDate)
          } else {
            eventType = 'amendment'
          }

          const speakers = doc.speaker ? [doc.speaker] : []
          if (doc.role) {
            speakers.push(doc.role)
          }

          events.push({
            id: `${doc.id}-${topicId}`,
            type: eventType,
            date: docDate,
            document_id: doc.id,
            document_title: doc.title,
            summary: doc.summary || doc.title,
            speakers,
            url: doc.url || undefined,
            topic: topicId,
            topic_name: topicMap.get(topicId) || topicId
          })
        }
      }

      return this.padAndSortTimelineEvents(events)
    } catch (error: any) {
      console.error('Error generating timeline:', error)
      return this.generateMockTimeline(documentId)
    }
  }

  /**
   * Generate mock timeline from storage.json data
   */
  private static generateMockTimeline(documentId: string): TimelineEvent[] {
    try {
      const documents = FileStorage.getDocuments()
      const topics = FileStorage.getTopics()

      // Find the current document
      const currentDoc = documents.find((d: any) => d.id === documentId)
      if (!currentDoc) {
        return this.padAndSortTimelineEvents(this.getDefaultTimeline())
      }

      // Get document's topics
      const documentTopics = (currentDoc.topics || []) as string[]

      // Create topic name map
      const topicMap = new Map<string, string>()
      topics.forEach((t: any) => topicMap.set(t.id, t.name))

      // Find related parliamentary documents
      const relatedDocs = documents.filter((doc: any) => {
        if (doc.id === documentId) return false
        if (doc.source_type !== 'parliamentary') return false
        const docTopics = (doc.topics || []) as string[]
        return docTopics.some((topicId: string) => documentTopics.includes(topicId))
      })

      if (relatedDocs.length === 0) {
        return this.padAndSortTimelineEvents(this.getDefaultTimeline())
      }

      // Generate timeline events
      const events: TimelineEvent[] = []
      const topicFirstSeen = new Map<string, string>()

      for (const doc of relatedDocs) {
        const docTopics = (doc.topics || []) as string[]
        const docDate = doc.published_at || doc.date

        for (const topicId of docTopics) {
          if (!documentTopics.includes(topicId)) continue

          const firstSeenDate = topicFirstSeen.get(topicId)
          const isFirst = !firstSeenDate
          const isDissolution = this.detectDissolution(doc.content || doc.summary || '')

          let eventType: 'creation' | 'amendment' | 'dissolution'
          if (isDissolution) {
            eventType = 'dissolution'
          } else if (isFirst) {
            eventType = 'creation'
            topicFirstSeen.set(topicId, docDate)
          } else {
            eventType = 'amendment'
          }

          const speakers = doc.speaker ? [doc.speaker] : []
          if (doc.role) {
            speakers.push(doc.role)
          }

          events.push({
            id: `${doc.id}-${topicId}`,
            type: eventType,
            date: docDate,
            document_id: doc.id,
            document_title: doc.title,
            summary: doc.summary || doc.title,
            speakers,
            url: doc.url || undefined,
            topic: topicId,
            topic_name: topicMap.get(topicId) || topicId
          })
        }
      }

      const finalEvents = this.padAndSortTimelineEvents(events)
      return finalEvents.length > 0 ? finalEvents : this.padAndSortTimelineEvents(this.getDefaultTimeline())
    } catch (error) {
      console.error('Error generating mock timeline:', error)
      return this.padAndSortTimelineEvents(this.getDefaultTimeline())
    }
  }

  /**
   * Get a default timeline when no related documents are found
   */
  private static getDefaultTimeline(): TimelineEvent[] {
    return [
      {
        id: 'default-1',
        type: 'creation',
        date: '2020-01-15',
        document_title: 'Initial Policy Framework Establishment',
        summary: 'The foundational framework for this policy area was first introduced in Parliament.',
        speakers: ['Minister'],
        topic: 'general',
        topic_name: 'General Policy',
        isAiGenerated: true
      },
      {
        id: 'default-2',
        type: 'amendment',
        date: '2022-06-20',
        document_title: 'Policy Enhancement and Updates',
        summary: 'Key amendments were made to strengthen the policy framework and address emerging needs.',
        speakers: ['Minister'],
        topic: 'general',
        topic_name: 'General Policy',
        isAiGenerated: true
      },
      {
        id: 'default-3',
        type: 'amendment',
        date: '2024-03-10',
        document_title: 'Recent Policy Refinements',
        summary: 'Further refinements were introduced to ensure the policy remains effective and relevant.',
        speakers: ['Minister'],
        topic: 'general',
        topic_name: 'General Policy',
        isAiGenerated: true
      },
      {
        id: 'default-4',
        type: 'amendment',
        date: '2025-01-01',
        document_title: 'Scheduled Future Policy Review',
        summary: 'A future review is scheduled to assess the ongoing impact and relevance of the policy.',
        speakers: ['Select Committee'],
        topic: 'general',
        topic_name: 'General Policy',
        isAiGenerated: true
      }
    ]
  }

  /**
   * Ensures timeline has at least 4 events and sorts them chronologically.
   */
  private static padAndSortTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
    // 1. Pad events if needed
    if (events.length > 0 && events.length < 4) {
      const needed = 4 - events.length
      const existingDates = new Set(events.map(e => new Date(e.date).getTime()))

      // Sort to find the actual first event
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      const firstEvent = events[0]
      const topic = firstEvent.topic
      const topic_name = firstEvent.topic_name
      const firstDate = new Date(firstEvent.date)

      const generatedEvents: TimelineEvent[] = []

      for (let i = 0; i < needed; i++) {
        const newDate = new Date(firstDate)
        newDate.setMonth(newDate.getMonth() - (i + 1) * 6)

        while (existingDates.has(newDate.getTime())) {
          newDate.setDate(newDate.getDate() - 1)
        }
        existingDates.add(newDate.getTime())

        generatedEvents.push({
          id: `ai-generated-${i}`,
          type: 'amendment',
          date: newDate.toISOString().split('T')[0],
          document_title: `Early Review of ${topic_name}`,
          summary: `Preliminary discussions and early-stage reviews concerning the policy area of ${topic_name}.`,
          speakers: ['Internal Committee'],
          topic: topic,
          topic_name: topic_name,
          isAiGenerated: true
        })
      }
      events.push(...generatedEvents)
    }

    // 2. Sort all events (original + generated)
    events.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) {
        return dateA - dateB
      }
      // Dates are equal, prioritize 'creation'
      if (a.type === 'creation' && b.type !== 'creation') return -1
      if (b.type === 'creation' && a.type !== 'creation') return 1

      // Then 'dissolution' last
      if (a.type === 'dissolution' && b.type !== 'dissolution') return 1
      if (b.type === 'dissolution' && a.type !== 'dissolution') return -1

      return 0
    })

    return events
  }

  /**
   * Detect if a document indicates policy dissolution
   */
  private static detectDissolution(text: string): boolean {
    const dissolutionKeywords = [
      'repeal',
      'cease',
      'expire',
      'terminate',
      'discontinue',
      'abolish',
      'revoke',
      'cancel',
      'end',
      'dissolve'
    ]

    const lowerText = text.toLowerCase()
    return dissolutionKeywords.some(keyword => lowerText.includes(keyword))
  }
}

