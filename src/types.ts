export interface PostSummary {
  id: number;
  title: string;
  subtitle: string;
  publishedAt: Date;
}

export interface PostDetail {
  id: number;
  title: string;
  subtitle: string;
  slug: string;
  url: string;
  publishedAt: Date;
  markdown: string;
  htmlBody: string;
  reactions?: Record<string, number>;
  restacks?: number;
  tags?: string[];
  coverImage?: string;
}

export interface NoteSummary {
  id: number;
  body: string;
  likesCount: number;
  author: {
    id: number;
    name: string;
    handle: string;
  };
  publishedAt: Date;
}

export interface ProfileInfo {
  id: number;
  name: string;
  handle: string;
  url: string;
  bio?: string;
  avatarUrl: string;
}

export interface CommentInfo {
  id: number;
  body: string;
  isAdmin: boolean;
}
