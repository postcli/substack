// Direct Substack API response types

export interface SubstackByline {
  id: number;
  name: string;
  handle: string;
  photo_url: string;
  bio?: string | null;
  profile_set_up_at?: string;
  publicationUsers?: {
    id: number;
    user_id: number;
    publication_id: number;
    role: string;
    public: boolean;
    is_primary: boolean;
    publication: SubstackPublication;
  }[];
  is_guest?: boolean;
  bestseller_tier?: number | null;
  status?: {
    bestsellerTier: number | null;
    subscriberTier: number | null;
    vip: boolean;
  };
}

export interface SubstackPublication {
  id: number;
  name: string;
  subdomain: string;
  custom_domain?: string | null;
  hero_text?: string;
  logo_url?: string;
  author_id: number;
  community_enabled?: boolean;
  language?: string | null;
  homepage_type?: string;
}

export interface SubstackArchivePost {
  id: number;
  title: string;
  slug: string;
  subtitle?: string | null;
  post_date: string;
  updated_at?: string;
  audience: string;
  canonical_url: string;
  publication_id: number;
  type: string;
  cover_image?: string | null;
  cover_image_is_square?: boolean;
  description?: string | null;
  body_html?: string | null;
  truncated_body_text?: string | null;
  wordcount?: number;
  postTags?: { id: string; name: string; slug: string }[];
  publishedBylines?: SubstackByline[];
  reaction_count?: number;
  comment_count?: number;
  child_comment_count?: number;
  restacks?: number;
  reactions?: Record<string, number>;
  is_saved?: boolean;
  is_viewed?: boolean;
  read_progress?: number;
}

export interface SubstackFullPost extends SubstackArchivePost {
  body_html: string;
  search_engine_title?: string | null;
  search_engine_description?: string | null;
  section_id?: number | null;
  write_comment_permissions?: string;
  show_guest_bios?: boolean;
}

export interface SubstackComment {
  id: number;
  body: string;
  body_json?: any;
  name: string;
  user_id: number;
  post_id?: number;
  date: string;
  edited_at?: string | null;
  ancestor_path?: string;
  type?: string;
  reactions?: Record<string, number>;
  children?: SubstackComment[];
}

export interface SubstackCommentsResponse {
  comments: SubstackComment[];
}

export interface SubstackFeedItem {
  entity_key: string;
  type: string; // 'comment', 'post', 'userSuggestions', 'chat'
  context?: {
    type: string; // 'note', 'comment_like', 'from_archives', 'chat_subscribed'
    typeBucket?: string;
    timestamp: string;
    users?: SubstackByline[];
  };
  comment?: {
    id: number;
    body: string;
    body_json?: any;
    date: string;
    handle?: string;
    name?: string;
    user_id?: number;
    reactions?: Record<string, number>;
    children_count?: number;
  };
  post?: SubstackArchivePost;
}

export interface SubstackFeedResponse {
  items: SubstackFeedItem[];
  nextCursor?: string;
  trackingParameters?: {
    followed_user_count?: number;
    subscribed_publication_count?: number;
    tab_id?: string;
  };
  tabs?: { id: string; name: string; type: string; slug?: string }[];
}

// Domain types (camelCase, used by CLI and MCP)

export interface NoteAuthor {
  id: number;
  name: string;
  handle: string;
  avatarUrl: string;
}

export interface ProfileData {
  id: number;
  handle: string;
  name: string;
  avatarUrl: string;
  bio?: string;
  publications?: {
    id: number;
    name: string;
    subdomain: string;
    role: string;
  }[];
}
