import fs from 'fs';
import path from 'path';

export function getMockSearchResults() {
  const filePath = path.join(process.cwd(), 'data', 'mock_search_results.json');
  if (!fs.existsSync(filePath)) {
    return { success: true, results: [] };
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error parsing mock_search_results.json:', e);
    return { success: true, results: [] };
  }
}
