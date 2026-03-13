import { HttpClient, type HttpClientConfig } from './http.js';
import { Profile, FullPost, PreviewPost, Comment, Note } from './models.js';
import type {
  SubstackArchivePost,
  SubstackFullPost,
  SubstackCommentsResponse,
  SubstackFeedResponse,
  SubstackFeedItem,
} from './types.js';

export interface SubstackClientConfig {
  token: string;
  publicationUrl: string;
  maxRequestsPerSecond?: number;
}

export class SubstackClient {
  private http: HttpClient;

  constructor(config: SubstackClientConfig) {
    this.http = new HttpClient({
      token: config.token,
      publicationUrl: config.publicationUrl,
      maxRequestsPerSecond: config.maxRequestsPerSecond,
    });
  }

  /** Test connectivity by fetching a single post from own publication */
  async testConnectivity(): Promise<boolean> {
    try {
      const posts = await this.http.pubGet<SubstackArchivePost[]>('/archive', { limit: 1 });
      return Array.isArray(posts) && posts.length > 0;
    } catch {
      return false;
    }
  }

  /** Get own profile from publishedBylines of own publication's first post */
  async ownProfile(): Promise<Profile> {
    const posts = await this.http.pubGet<SubstackArchivePost[]>('/archive', { limit: 1 });
    if (!posts.length) throw new Error('No posts found in your publication');
    const byline = posts[0].publishedBylines?.[0];
    if (!byline) throw new Error('No author byline found on your posts');
    return new Profile(byline);
  }

  /** Get a profile by subdomain (fetches their first post to extract bylines) */
  async profileForSubdomain(subdomain: string): Promise<Profile> {
    if (!subdomain?.trim()) throw new Error('Subdomain cannot be empty');
    const posts = await this.http.pubGet<SubstackArchivePost[]>(
      '/archive',
      { limit: 1 },
      subdomain
    );
    if (!posts.length) throw new Error(`No posts found for ${subdomain}`);
    const byline = posts[0].publishedBylines?.[0];
    if (!byline) throw new Error(`No author byline found for ${subdomain}`);
    return new Profile(byline);
  }

  /** List posts from a publication's archive */
  async listPosts(options?: {
    subdomain?: string;
    limit?: number;
    offset?: number;
  }): Promise<PreviewPost[]> {
    const { subdomain, limit = 10, offset = 0 } = options ?? {};
    const posts = await this.http.pubGet<SubstackArchivePost[]>(
      '/archive',
      { sort: 'new', limit, offset },
      subdomain
    );
    return posts.map((p) => new PreviewPost(p));
  }

  /** Get a full post by slug */
  async getPost(slug: string, subdomain?: string): Promise<FullPost> {
    const raw = await this.http.pubGet<SubstackFullPost>(
      `/posts/${encodeURIComponent(slug)}`,
      undefined,
      subdomain
    );
    return new FullPost(raw);
  }

  /** Get a post by ID (searches archive to find slug, then fetches full post) */
  async getPostById(id: number, subdomain?: string): Promise<FullPost> {
    const subdomains = subdomain ? [subdomain] : await this.getOwnSubdomains();
    for (const sub of subdomains) {
      let offset = 0;
      const pageSize = 50;
      for (let attempt = 0; attempt < 20; attempt++) {
        const posts = await this.http.pubGet<SubstackArchivePost[]>(
          '/archive',
          { sort: 'new', limit: pageSize, offset },
          sub
        );
        if (!posts.length) break;
        const found = posts.find((p) => p.id === id);
        if (found) return this.getPost(found.slug, sub);
        offset += pageSize;
      }
    }
    throw new Error(`Post with ID ${id} not found`);
  }

  /** Get all subdomains the authenticated user owns */
  private async getOwnSubdomains(): Promise<string[]> {
    const profile = await this.ownProfile();
    return profile.publications.map((p) => p.subdomain);
  }

  /** List comments on a post */
  async listComments(postId: number, options?: {
    subdomain?: string;
    limit?: number;
  }): Promise<Comment[]> {
    const { subdomain, limit } = options ?? {};
    const res = await this.http.pubGet<SubstackCommentsResponse>(
      `/post/${postId}/comments`,
      { all_comments: true, limit: limit ?? 50 },
      subdomain
    );
    return (res.comments ?? []).map((c) => new Comment(c));
  }

  /** Get the authenticated user's reader feed (notes, posts, etc.) */
  async getFeed(options?: {
    tab?: string;
    cursor?: string;
  }): Promise<{ items: SubstackFeedItem[]; nextCursor?: string }> {
    const params: Record<string, any> = {};
    if (options?.tab) params.tab = options.tab;
    if (options?.cursor) params.cursor = options.cursor;
    const res = await this.http.globalGet<SubstackFeedResponse>('/reader/feed', params);
    return { items: res.items ?? [], nextCursor: res.nextCursor };
  }

  /** Get notes from the reader feed */
  async listNotes(options?: { limit?: number }): Promise<Note[]> {
    const limit = options?.limit ?? 10;
    const notes: Note[] = [];
    let cursor: string | undefined;

    while (notes.length < limit) {
      const feed = await this.getFeed({ cursor });
      const noteItems = feed.items.filter(
        (i) => i.type === 'comment' && i.context?.typeBucket === 'notes' && i.comment
      );
      for (const item of noteItems) {
        notes.push(new Note(item));
        if (notes.length >= limit) break;
      }
      if (!feed.nextCursor) break;
      cursor = feed.nextCursor;
    }

    return notes;
  }

  /** Get the default subdomain for this client */
  getSubdomain(): string {
    return this.http.getSubdomain();
  }

  /**
   * Verify auth token is valid by testing reader/feed access.
   * Returns true if the token works.
   */
  static async verifyToken(token: string): Promise<boolean> {
    const headers = SubstackClient.makeAuthHeaders(token);
    const res = await fetch('https://substack.com/api/v1/reader/feed', { headers });
    return res.ok;
  }

  /**
   * Auto-discover user profile using userId from substack.lli JWT.
   * First tries /api/v1/user/{userId}-/public_profile/self.
   * If handle is null, probes subscription archives for a publication the session owns.
   */
  static async discoverProfile(token: string, lliToken?: string): Promise<{
    handle: string | null;
    name: string | null;
    id: number;
    publications: { subdomain: string; name: string }[];
    subscriptions: { subdomain: string; name: string }[];
  } | null> {
    const userId = SubstackClient.extractUserId(lliToken);
    if (!userId) return null;

    const headers = SubstackClient.makeAuthHeaders(token);
    const res = await fetch(
      `https://substack.com/api/v1/user/${userId}-/public_profile/self`,
      { headers }
    );
    if (!res.ok) return null;

    const data = await res.json() as any;
    const publications: { subdomain: string; name: string }[] = [];

    // Own publications (where user is admin/editor)
    for (const pu of data.publicationUsers ?? []) {
      if (pu.publication?.subdomain) {
        publications.push({ subdomain: pu.publication.subdomain, name: pu.publication.name });
      }
    }

    // Subscriptions
    const subscriptions: { subdomain: string; name: string }[] = [];
    for (const sub of data.subscriptions ?? []) {
      if (sub.publication?.subdomain) {
        subscriptions.push({ subdomain: sub.publication.subdomain, name: sub.publication.name });
      }
    }

    // If handle is set, we're done
    if (data.handle) {
      return { handle: data.handle, name: data.name, id: data.id, publications, subscriptions };
    }

    // Handle is null: probe own publications first, then subscriptions
    // Look for a publication where the archive author matches this userId
    const allToProbe = [...publications, ...subscriptions];
    for (const pub of allToProbe) {
      try {
        const archiveRes = await fetch(
          `https://${pub.subdomain}.substack.com/api/v1/archive?limit=1`,
          { headers }
        );
        if (!archiveRes.ok) continue;
        const posts = (await archiveRes.json()) as any[];
        for (const byline of posts[0]?.publishedBylines ?? []) {
          // Only match if this byline belongs to the authenticated user
          if (byline?.id === userId && byline?.handle) {
            return {
              handle: byline.handle,
              name: byline.name,
              id: byline.id,
              publications: (byline.publicationUsers ?? [])
                .filter((pu: any) => pu.publication?.subdomain)
                .map((pu: any) => ({ subdomain: pu.publication.subdomain, name: pu.publication.name })),
              subscriptions,
            };
          }
        }
      } catch {
        // skip, try next
      }
    }

    return { handle: null, name: null, id: userId, publications, subscriptions };
  }

  /** Extract userId from substack.lli JWT (base64 payload with userId field) */
  static extractUserId(lliToken?: string): number | null {
    if (!lliToken) return null;
    try {
      const parts = lliToken.split('.');
      if (parts.length < 2) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.userId ?? null;
    } catch {
      return null;
    }
  }

  private static makeAuthHeaders(token: string): Record<string, string> {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return {
      Cookie: `substack.sid=${decoded.substack_sid}; connect.sid=${decoded.connect_sid}`,
      Accept: 'application/json',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Referer: 'https://substack.com/',
    };
  }
}
