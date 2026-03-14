const SUBSTACK_BASE = 'https://substack.com';
const API_PREFIX = '/api/v1';

export interface HttpClientConfig {
  token: string;
  publicationUrl: string;
  maxRequestsPerSecond?: number;
}

export class HttpClient {
  private cookies: string;
  private subdomain: string;
  private headers: Record<string, string>;
  private minInterval: number;
  private lastRequest = 0;

  constructor(config: HttpClientConfig) {
    // Decode base64 token to get session cookies
    let decoded: { substack_sid?: string; connect_sid?: string };
    try {
      decoded = JSON.parse(Buffer.from(config.token, 'base64').toString());
    } catch {
      throw new Error('Invalid SUBSTACK_TOKEN: not a valid base64-encoded JSON. Run: postcli-substack auth login');
    }
    if (!decoded.substack_sid) {
      throw new Error('Invalid SUBSTACK_TOKEN: missing substack_sid. Run: postcli-substack auth login');
    }
    this.cookies = `substack.sid=${decoded.substack_sid}; connect.sid=${decoded.connect_sid ?? decoded.substack_sid}`;

    // Extract subdomain from publication URL
    this.subdomain = extractSubdomain(config.publicationUrl);

    this.headers = {
      Cookie: this.cookies,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Origin: SUBSTACK_BASE,
      Referer: `${SUBSTACK_BASE}/`,
    };

    this.minInterval = 1000 / (config.maxRequestsPerSecond ?? 25);
  }

  getSubdomain(): string {
    return this.subdomain;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequest;
    if (elapsed < this.minInterval) {
      await new Promise((r) => setTimeout(r, this.minInterval - elapsed));
    }
    this.lastRequest = Date.now();
  }

  /** Call a publication-specific endpoint: https://{subdomain}.substack.com/api/v1/... */
  async pubGet<T = any>(path: string, params?: Record<string, any>, subdomain?: string): Promise<T> {
    const sub = subdomain ?? this.subdomain;
    const url = buildUrl(`https://${sub}.substack.com${API_PREFIX}${path}`, params);
    return this.doGet(url);
  }

  /** Call a global endpoint: https://substack.com/api/v1/... */
  async globalGet<T = any>(path: string, params?: Record<string, any>): Promise<T> {
    const url = buildUrl(`${SUBSTACK_BASE}${API_PREFIX}${path}`, params);
    return this.doGet(url);
  }

  /** POST to a publication-specific endpoint */
  async pubPost<T = any>(path: string, data?: any, subdomain?: string): Promise<T> {
    const sub = subdomain ?? this.subdomain;
    const url = `https://${sub}.substack.com${API_PREFIX}${path}`;
    return this.doPost(url, data);
  }

  /** POST to a global endpoint */
  async globalPost<T = any>(path: string, data?: any): Promise<T> {
    const url = `${SUBSTACK_BASE}${API_PREFIX}${path}`;
    return this.doPost(url, data);
  }

  private async doGet<T>(url: string): Promise<T> {
    await this.throttle();
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} GET ${url}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }

  private async doPost<T>(url: string, data?: any): Promise<T> {
    await this.throttle();
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} POST ${url}: ${text.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  }
}

export function buildUrl(base: string, params?: Record<string, any>): string {
  if (!params) return base;
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export function extractSubdomain(publicationUrl: string): string {
  // https://substack.com/@ahlert → ahlert
  const handleMatch = publicationUrl.match(/@(\w+)/);
  if (handleMatch) return handleMatch[1];

  // https://ahlert.substack.com → ahlert
  const subdomainMatch = publicationUrl.match(/https?:\/\/(\w+)\.substack\.com/);
  if (subdomainMatch) return subdomainMatch[1];

  throw new Error(
    `Cannot extract subdomain from "${publicationUrl}". Expected format: https://substack.com/@handle or https://handle.substack.com`
  );
}
