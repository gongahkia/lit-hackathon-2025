import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const STORAGE_PATH = path.join(process.cwd(), 'data', 'storage.json');

export class FileStorage {
  private static readData() {
    if (!fs.existsSync(STORAGE_PATH)) {
      return { 
        sources: [], 
        documents: [], 
        topics: [], 
        conversations: [], 
        templates: [], 
        folders: [],
        matters: [],
        evidenceItems: []
      };
    }
    const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
    try {
      const data = JSON.parse(raw);
      return {
        sources: data.sources || [],
        documents: data.documents || [],
        topics: data.topics || [],
        conversations: data.conversations || [],
        templates: data.templates || [],
        folders: data.folders || [],
        matters: data.matters || [],
        evidenceItems: data.evidenceItems || []
      };
    } catch (e) {
      console.error("Error parsing storage.json:", e);
      return { 
        sources: [], 
        documents: [], 
        topics: [], 
        conversations: [], 
        templates: [], 
        folders: [],
        matters: [],
        evidenceItems: []
      };
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

  // Matters
  static getMatters() {
    return this.readData().matters;
  }

  static createMatter(name: string, description?: string) {
    const data = this.readData();
    const newMatter = {
      id: randomUUID(),
      name,
      description: description || null,
      created_at: new Date().toISOString()
    };
    data.matters.push(newMatter);
    this.writeData(data);
    return newMatter;
  }

  // Evidence Items
  static getEvidenceItems(matterId: string) {
    const items = this.readData().evidenceItems;
    // Filter and sort by display_order then created_at (mimicking SQL)
    return items
      .filter((i: any) => i.matter_id === matterId)
      .sort((a: any, b: any) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }

  static createEvidenceItem(item: any) {
    const data = this.readData();
    const newItem = {
      id: randomUUID(),
      ...item,
      created_at: new Date().toISOString()
    };
    data.evidenceItems.push(newItem);
    this.writeData(data);
    return newItem;
  }

  static updateEvidenceItem(itemId: string, updates: any) {
    const data = this.readData();
    const index = data.evidenceItems.findIndex((i: any) => i.id === itemId);
    if (index === -1) return null;
    
    data.evidenceItems[index] = { ...data.evidenceItems[index], ...updates };
    this.writeData(data);
    return data.evidenceItems[index];
  }

  static deleteEvidenceItem(itemId: string) {
    const data = this.readData();
    const initialLength = data.evidenceItems.length;
    data.evidenceItems = data.evidenceItems.filter((i: any) => i.id !== itemId);
    if (data.evidenceItems.length !== initialLength) {
        this.writeData(data);
        return true;
    }
    return false;
  }
}
