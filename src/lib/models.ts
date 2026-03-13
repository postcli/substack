import type {
  SubstackByline,
  SubstackArchivePost,
  SubstackFullPost,
  SubstackComment,
  SubstackFeedItem,
  NoteAuthor,
  ProfileData,
} from './types.js';

// ── Comment ──────────────────────────────────────────────────

export class Comment {
  readonly id: number;
  readonly body: string;
  readonly authorName: string;
  readonly authorId: number;
  readonly date: Date;
  readonly reactions?: Record<string, number>;
  readonly childrenCount: number;

  constructor(raw: SubstackComment) {
    this.id = raw.id;
    this.body = raw.body;
    this.authorName = raw.name;
    this.authorId = raw.user_id;
    this.date = new Date(raw.date);
    this.reactions = raw.reactions;
    this.childrenCount = raw.children?.length ?? 0;
  }
}

// ── Note (from reader/feed) ─────────────────────────────────

export class Note {
  readonly id: number;
  readonly body: string;
  readonly author: NoteAuthor;
  readonly publishedAt: Date;
  readonly reactions?: Record<string, number>;
  readonly childrenCount: number;
  readonly entityKey: string;

  constructor(feedItem: SubstackFeedItem) {
    const c = feedItem.comment!;
    this.id = c.id;
    this.body = c.body;
    this.publishedAt = new Date(c.date || feedItem.context?.timestamp || '');
    this.reactions = c.reactions;
    this.childrenCount = c.children_count ?? 0;
    this.entityKey = feedItem.entity_key;

    const user = feedItem.context?.users?.[0];
    this.author = {
      id: user?.id ?? c.user_id ?? 0,
      name: user?.name ?? c.name ?? '',
      handle: user?.handle ?? c.handle ?? '',
      avatarUrl: user?.photo_url ?? '',
    };
  }
}

// ── Post ─────────────────────────────────────────────────────

export class PreviewPost {
  readonly id: number;
  readonly title: string;
  readonly subtitle: string;
  readonly slug: string;
  readonly truncatedBody: string;
  readonly publishedAt: Date;
  readonly canonicalUrl: string;
  readonly coverImage?: string;
  readonly wordcount?: number;
  readonly reactionCount?: number;
  readonly commentCount?: number;
  readonly restacks?: number;
  readonly authors: NoteAuthor[];
  publicationSubdomain?: string;

  constructor(raw: SubstackArchivePost) {
    this.id = raw.id;
    this.title = raw.title;
    this.subtitle = raw.subtitle || '';
    this.slug = raw.slug;
    this.truncatedBody = raw.truncated_body_text || '';
    this.publishedAt = new Date(raw.post_date);
    this.canonicalUrl = raw.canonical_url;
    this.coverImage = raw.cover_image ?? undefined;
    this.wordcount = raw.wordcount;
    this.reactionCount = raw.reaction_count;
    this.commentCount = raw.comment_count;
    this.restacks = raw.restacks;
    this.authors = (raw.publishedBylines ?? []).map(bylineToAuthor);
  }
}

export class FullPost extends PreviewPost {
  readonly htmlBody: string;
  readonly postTags: string[];
  readonly description?: string;

  constructor(raw: SubstackFullPost) {
    super(raw);
    this.htmlBody = raw.body_html || '';
    this.postTags = (raw.postTags ?? []).map((t) => t.name);
    this.description = raw.description ?? undefined;
  }

  /** Extract YouTube video URLs embedded in the post HTML */
  get youtubeUrls(): string[] {
    const matches =
      this.htmlBody.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/gi) || [];
    return matches.map((m) => {
      const id = m.replace('youtube-nocookie.com/embed/', '');
      return `https://www.youtube.com/watch?v=${id}`;
    });
  }
}

// ── Profile ──────────────────────────────────────────────────

export class Profile {
  readonly id: number;
  readonly handle: string;
  readonly name: string;
  readonly avatarUrl: string;
  readonly bio?: string;
  readonly publications: { id: number; name: string; subdomain: string; role: string }[];

  constructor(byline: SubstackByline) {
    this.id = byline.id;
    this.handle = byline.handle;
    this.name = byline.name;
    this.avatarUrl = byline.photo_url;
    this.bio = byline.bio ?? undefined;
    this.publications = (byline.publicationUsers ?? []).map((pu) => ({
      id: pu.publication.id,
      name: pu.publication.name,
      subdomain: pu.publication.subdomain,
      role: pu.role,
    }));
  }

  toData(): ProfileData {
    return {
      id: this.id,
      handle: this.handle,
      name: this.name,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      publications: this.publications,
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────

function bylineToAuthor(b: SubstackByline): NoteAuthor {
  return { id: b.id, name: b.name, handle: b.handle, avatarUrl: b.photo_url };
}
