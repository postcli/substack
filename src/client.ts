import { SubstackClient } from 'substack-api';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const projectRoot = resolve(dirname(__filename), '..');
dotenv.config({ path: resolve(projectRoot, '.env') });

let _client: SubstackClient | null = null;

export function getClient(): SubstackClient {
  if (_client) return _client;

  const token = process.env.SUBSTACK_TOKEN;
  const publicationUrl = process.env.SUBSTACK_PUBLICATION_URL;

  if (!token || !publicationUrl) {
    throw new Error(
      'Missing SUBSTACK_TOKEN or SUBSTACK_PUBLICATION_URL. Run: wrtr auth login'
    );
  }

  _client = new SubstackClient({ token, publicationUrl });
  return _client;
}

export function createClient(token: string, publicationUrl: string): SubstackClient {
  return new SubstackClient({ token, publicationUrl });
}

export async function collectAsync<T>(iter: AsyncIterable<T>, limit?: number): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iter) {
    items.push(item);
    if (limit && items.length >= limit) break;
  }
  return items;
}
