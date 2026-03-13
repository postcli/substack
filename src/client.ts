import { SubstackClient } from 'substack-api';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { homedir } from 'os';

export function getConfigDir(): string {
  return resolve(homedir(), '.config', 'postcli');
}

export function getEnvPath(): string {
  return resolve(getConfigDir(), '.env');
}

// Load from ~/.config/postcli/.env (primary) and also from cwd/.env (fallback for dev)
const configEnvPath = getEnvPath();
if (existsSync(configEnvPath)) {
  dotenv.config({ path: configEnvPath });
} else {
  const __filename = fileURLToPath(import.meta.url);
  const projectRoot = resolve(dirname(__filename), '..');
  dotenv.config({ path: resolve(projectRoot, '.env') });
}

let _client: SubstackClient | null = null;

export function getClient(): SubstackClient {
  if (_client) return _client;

  const token = process.env.SUBSTACK_TOKEN;
  const publicationUrl = process.env.SUBSTACK_PUBLICATION_URL;

  if (!token || !publicationUrl) {
    throw new Error(
      'Missing SUBSTACK_TOKEN or SUBSTACK_PUBLICATION_URL. Run: postcli-substack auth login'
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

export function parsePositiveInt(value: string, label: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) {
    throw new Error(`Invalid ${label}: "${value}" (must be a positive integer)`);
  }
  return n;
}
