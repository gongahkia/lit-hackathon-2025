const fs = require('fs');
const path = require('path');

const storagePath = path.join(__dirname, '../data/storage.json');
const storage = JSON.parse(fs.readFileSync(storagePath, 'utf8'));

const baseDocs = storage.documents;
const topics = ['topic-1', 'topic-2', 'topic-3'];
const sources = ['parliament-gov', 'cna', 'straitstimes'];
const sourceNames = { 'parliament-gov': 'Parliament of Singapore', 'cna': 'Channel News Asia', 'straitstimes': 'The Straits Times' };
const types = ['statement', 'debate', 'news', 'press_release'];

for (let i = 4; i <= 200; i++) {
  const topicId = topics[Math.floor(Math.random() * topics.length)];
  const sourceId = sources[Math.floor(Math.random() * sources.length)];
  const docType = types[Math.floor(Math.random() * types.length)];
  
  const doc = {
    id: `doc-${i}`,
    title: `Generated Document Title ${i} - ${topicId}`,
    source_id: sourceId,
    source_name: sourceNames[sourceId],
    date: "2024-01-01",
    published_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    type: docType,
    content: `This is the content for document ${i}. It discusses important matters regarding ${topicId} and is sourced from ${sourceNames[sourceId]}. The quick brown fox jumps over the lazy dog.`,
    summary: `Summary for document ${i}`,
    speaker: "Generic Speaker",
    role: "MP",
    tags: ["generated", topicId],
    topics: [topicId],
    source_type: sourceId === 'parliament-gov' ? 'parliamentary' : 'news',
    verified: Math.random() > 0.1,
    confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(2)),
    contradictions: [],
    url: `https://example.com/doc-${i}`,
    language: "en"
  };
  
  baseDocs.push(doc);
}

storage.documents = baseDocs;
fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2));
console.log('Generated ' + baseDocs.length + ' documents.');
