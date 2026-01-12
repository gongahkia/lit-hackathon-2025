import fs from 'fs';
import path from 'path';

const STORAGE_PATH = path.join(process.cwd(), 'data', 'storage.json');

export class FileStorage {
  private static readData() {
    if (!fs.existsSync(STORAGE_PATH)) {
      return { sources: [], documents: [], topics: [], conversations: [], templates: [], folders: [] };
    }
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing storage.json:", e);
      return { sources: [], documents: [], topics: [], conversations: [], templates: [], folders: [] };
    }
  }

  private static writeData(data: any) {
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  }

  static getSources() {
    return this.readData().sources || [];
  }

  static getDocuments() {
    return this.readData().documents || [];
  }

  static getTopics() {
    return this.readData().topics || [];
  }

  static searchDocuments(query: string) {
    const docs = this.getDocuments();
    const q = query.toLowerCase();
    return docs.filter((d: any) => 
      d.title.toLowerCase().includes(q) || 
      d.content.toLowerCase().includes(q) ||
      (d.speaker && d.speaker.toLowerCase().includes(q))
    );
  }
}
