import { getSupabaseAdmin } from './supabase'
import { LLMRouter } from './llm/router'

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
 */
export class TimelineService {
  /**
   * Generate timeline events for a document
   */
  static async generateDocumentTimeline(documentId: string): Promise<TimelineEvent[]> {
    try {
      const supabase = getSupabaseAdmin()

      // Get the current document
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('id, topics, published_at')
        .eq('id', documentId)
        .single()

      if (docError || !currentDoc) {
        console.error('Error fetching current document:', docError)
        return []
      }

      // Get document's topics
      const documentTopics = (currentDoc.topics || []) as string[]
      if (documentTopics.length === 0) {
        return []
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
        return []
      }

      // Filter documents that share at least one topic with the current document
      const relevantDocs = (relatedDocs || []).filter((doc: DocumentData) => {
        const docTopics = (doc.topics || []) as string[]
        return docTopics.some(topicId => documentTopics.includes(topicId))
      })

      // If we have few or no relevant documents, use AI to generate timeline
      if (relevantDocs.length < 3) {
        return await this.generateAITimeline(currentDoc, documentTopics, topicMap)
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

      // Sort by date ascending
      events.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateA - dateB
      })

      return events
    } catch (error: any) {
      console.error('Error generating timeline:', error)
      return []
    }
  }

  /**
   * Generate timeline using AI when database has insufficient data
   */
  private static async generateAITimeline(
    currentDoc: any,
    documentTopics: string[],
    topicMap: Map<string, string>
  ): Promise<TimelineEvent[]> {
    try {
      const supabase = getSupabaseAdmin()

      // Get current document details
      const { data: docDetails } = await supabase
        .from('documents')
        .select('id, title, summary, content, published_at, date, speaker, role, topics')
        .eq('id', currentDoc.id)
        .single()

      if (!docDetails) {
        return []
      }

      // Build context for AI
      const topicNames = documentTopics.map(id => topicMap.get(id) || id).join(', ')
      const documentContext = {
        title: docDetails.title,
        summary: docDetails.summary || '',
        content: (docDetails.content || '').substring(0, 2000), // Limit content length
        date: docDetails.published_at || docDetails.date,
        speaker: docDetails.speaker || '',
        role: docDetails.role || '',
        topics: topicNames
      }

      // Create prompt for AI to generate timeline
      const prompt = `You are analyzing a Singapore parliamentary document about policy development. Based on the following document information, generate a timeline of related policy development events in JSON format.

Document Information:
- Title: ${documentContext.title}
- Summary: ${documentContext.summary}
- Date: ${documentContext.date}
- Speaker: ${documentContext.speaker}${documentContext.role ? ` (${documentContext.role})` : ''}
- Topics: ${documentContext.topics}
- Content excerpt: ${documentContext.content}

Generate a timeline of related policy development events that would typically occur for this type of document. Include:
1. Policy creation events (when the policy was first introduced)
2. Amendment events (when the policy was modified)
3. Dissolution events (if applicable, when the policy was repealed or ended)

Return ONLY a valid JSON array of timeline events in this exact format:
[
  {
    "type": "creation" | "amendment" | "dissolution",
    "date": "YYYY-MM-DD",
    "document_title": "Title of the related document",
    "summary": "Brief summary of the event",
    "speakers": ["Speaker name"],
    "topic": "topic_id",
    "topic_name": "Topic Name"
  }
]

Generate 3-5 realistic timeline events based on typical Singapore parliamentary policy development patterns. Use realistic dates relative to the document date.`

      // Use LLM to generate timeline
      const llmRouter = new LLMRouter()
      const documents: any[] = [] // Empty context for pure generation
      
      const response = await llmRouter.route(prompt, documents, {
        provider: 'auto',
        temperature: 0.4,
        maxTokens: 2000
      })

      // Parse JSON from response
      let aiEvents: any[] = []
      try {
        // Extract JSON from response content
        const jsonMatch = response.content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          aiEvents = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.error('Error parsing AI timeline JSON:', parseError)
        return []
      }

      // Transform AI events to TimelineEvent format
      return aiEvents.map((event, idx) => ({
        id: `ai-${currentDoc.id}-${idx}`,
        type: event.type || 'amendment',
        date: event.date || documentContext.date,
        document_title: event.document_title || 'Related Policy Development',
        summary: event.summary || '',
        speakers: Array.isArray(event.speakers) ? event.speakers : [event.speakers || ''],
        topic: event.topic || documentTopics[0] || '',
        topic_name: event.topic_name || topicMap.get(documentTopics[0]) || '',
        isAiGenerated: true
      }))
    } catch (error: any) {
      console.error('Error generating AI timeline:', error)
      return []
    }
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

