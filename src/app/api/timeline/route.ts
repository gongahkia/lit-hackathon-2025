import { NextRequest, NextResponse } from 'next/server';
import { FileStorage } from '../../../lib/file-storage';

const FLASK_API_BASE = process.env.FLASK_API_BASE || '';
const isStandaloneMode = !FLASK_API_BASE || FLASK_API_BASE === 'http://localhost:5000';

// Generate mock timeline from storage.json documents
function generateMockTimeline() {
  try {
    const documents = FileStorage.getDocuments();
    const topics = FileStorage.getTopics();

    // Create topic map
    const topicMap = new Map<string, string>();
    topics.forEach((t: any) => topicMap.set(t.id, t.name));

    // Group documents by topic and generate timeline events
    const timeline: any[] = [];
    const topicFirstSeen = new Map<string, boolean>();

    // Sort documents by date
    const sortedDocs = [...documents].sort((a: any, b: any) => {
      const dateA = new Date(a.published_at || a.date || '2020-01-01').getTime();
      const dateB = new Date(b.published_at || b.date || '2020-01-01').getTime();
      return dateA - dateB;
    });

    for (const doc of sortedDocs) {
      if (doc.source_type !== 'parliamentary' && doc.source_type !== 'ministerial') {
        continue;
      }

      const docTopics = doc.topics || [];
      const docDate = doc.published_at || doc.date || '';

      for (const topicId of docTopics) {
        const isFirst = !topicFirstSeen.get(topicId);

        if (isFirst) {
          topicFirstSeen.set(topicId, true);
        }

        timeline.push({
          id: `${doc.id}-${topicId}`,
          type: isFirst ? 'creation' : 'amendment',
          date: docDate,
          document_id: doc.id,
          document_title: doc.title,
          summary: doc.summary || doc.title,
          speakers: [doc.speaker, doc.role].filter(Boolean),
          url: doc.url || '',
          topic: topicId,
          topic_name: topicMap.get(topicId) || topicId
        });
      }
    }

    return timeline;
  } catch (error) {
    console.error('Error generating mock timeline:', error);
    return getDefaultTimeline();
  }
}

// Default timeline if nothing found
function getDefaultTimeline() {
  return [
    {
      id: 'default-1',
      type: 'creation',
      date: '2020-01-15',
      document_title: 'Initial Policy Framework',
      summary: 'Foundation of Singapore policy framework established.',
      speakers: ['Minister'],
      topic: 'general',
      topic_name: 'General Policy'
    },
    {
      id: 'default-2',
      type: 'amendment',
      date: '2022-06-20',
      document_title: 'Policy Updates 2022',
      summary: 'Key amendments to strengthen policy effectiveness.',
      speakers: ['Minister'],
      topic: 'general',
      topic_name: 'General Policy'
    },
    {
      id: 'default-3',
      type: 'amendment',
      date: '2024-03-10',
      document_title: 'Recent Enhancements',
      summary: 'Continued refinements to address emerging needs.',
      speakers: ['Minister'],
      topic: 'general',
      topic_name: 'General Policy'
    }
  ];
}

/**
 * Timeline API Route
 * Returns policy timeline with creation, amendments, and dissolution events
 * Uses mock data in standalone mode
 */
export async function GET(request: NextRequest) {
  // In standalone mode, return mock timeline
  if (isStandaloneMode) {
    const timeline = generateMockTimeline();
    return NextResponse.json(
      {
        success: true,
        timeline: timeline.length > 0 ? timeline : getDefaultTimeline()
      },
      { status: 200 }
    );
  }

  try {
    const flaskUrl = new URL('/api/timeline', FLASK_API_BASE);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const flaskRes = await fetch(flaskUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!flaskRes.ok) {
      // Fallback to mock timeline
      const timeline = generateMockTimeline();
      return NextResponse.json({ success: true, timeline }, { status: 200 });
    }

    const contentType = flaskRes.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await flaskRes.json()
      : { timeline: [] };

    const timeline = Array.isArray(result.timeline)
      ? result.timeline
      : (Array.isArray(result) ? result : []);

    return NextResponse.json(
      {
        success: true,
        timeline
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Timeline proxy error:', error);

    // Fallback to mock timeline on any error
    const timeline = generateMockTimeline();
    return NextResponse.json(
      {
        success: true,
        timeline: timeline.length > 0 ? timeline : getDefaultTimeline()
      },
      { status: 200 }
    );
  }
}

