import { z } from 'zod';
import { getClient } from '../client.js';

export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  handler: (args: any) => Promise<string>;
}

function json(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export const tools: ToolDef[] = [
  {
    name: 'test_connection',
    description: 'Test Substack authentication',
    schema: z.object({}),
    handler: async () => {
      const client = getClient();
      const ok = await client.testConnectivity();
      return ok ? 'Connection successful' : 'Connection failed';
    },
  },
  {
    name: 'get_own_profile',
    description: 'Get your own Substack profile with publications list',
    schema: z.object({}),
    handler: async () => {
      const client = getClient();
      const p = await client.ownProfile();
      return json(p.toData());
    },
  },
  {
    name: 'get_profile',
    description: 'Get a Substack profile by subdomain (e.g. "nicolascole77")',
    schema: z.object({ subdomain: z.string().describe('Publication subdomain') }),
    handler: async ({ subdomain }) => {
      const client = getClient();
      const p = await client.profileForSubdomain(subdomain);
      return json(p.toData());
    },
  },
  {
    name: 'list_posts',
    description: 'List posts. By default fetches from all your publications merged by date. Use subdomain to fetch from a specific publication.',
    schema: z.object({
      subdomain: z.string().optional().describe('Specific publication subdomain (omit to fetch from all your publications)'),
      limit: z.number().optional().default(10).describe('Max posts to return'),
      offset: z.number().optional().default(0).describe('Offset for pagination'),
    }),
    handler: async ({ subdomain, limit, offset }) => {
      const client = getClient();
      let posts;
      if (subdomain) {
        posts = await client.listPosts({ subdomain, limit, offset });
      } else {
        const profile = await client.ownProfile();
        const subs = profile.publications.map((p) => p.subdomain);
        const results = await Promise.all(
          subs.map((sub) => client.listPosts({ subdomain: sub, limit, offset }))
        );
        posts = results.flat().sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, limit);
      }
      return json(
        posts.map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          slug: p.slug,
          truncatedBody: p.truncatedBody,
          publishedAt: p.publishedAt,
          canonicalUrl: p.canonicalUrl,
          coverImage: p.coverImage,
          wordcount: p.wordcount,
          reactionCount: p.reactionCount,
          commentCount: p.commentCount,
          restacks: p.restacks,
          authors: p.authors,
        }))
      );
    },
  },
  {
    name: 'get_post',
    description: 'Get a full post by slug with HTML content, authors, and YouTube embeds',
    schema: z.object({
      slug: z.string().describe('Post slug (from URL)'),
      subdomain: z.string().optional().describe('Publication subdomain (defaults to own)'),
    }),
    handler: async ({ slug, subdomain }) => {
      const client = getClient();
      const p = await client.getPost(slug, subdomain);
      return json({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        slug: p.slug,
        canonicalUrl: p.canonicalUrl,
        coverImage: p.coverImage,
        publishedAt: p.publishedAt,
        htmlBody: p.htmlBody,
        description: p.description,
        wordcount: p.wordcount,
        reactionCount: p.reactionCount,
        commentCount: p.commentCount,
        restacks: p.restacks,
        tags: p.postTags,
        youtubeUrls: p.youtubeUrls,
        authors: p.authors,
      });
    },
  },
  {
    name: 'list_notes',
    description: 'List notes from your Substack reader feed',
    schema: z.object({
      limit: z.number().optional().default(10).describe('Max notes to return'),
    }),
    handler: async ({ limit }) => {
      const client = getClient();
      const notes = await client.listNotes({ limit });
      return json(
        notes.map((n) => ({
          id: n.id,
          body: n.body,
          author: n.author,
          publishedAt: n.publishedAt,
          reactions: n.reactions,
          childrenCount: n.childrenCount,
        }))
      );
    },
  },
  {
    name: 'list_comments',
    description: 'List comments on a post',
    schema: z.object({
      post_id: z.number().describe('Post ID'),
      subdomain: z.string().optional().describe('Publication subdomain (defaults to own)'),
      limit: z.number().optional().default(20).describe('Max comments to return'),
    }),
    handler: async ({ post_id, subdomain, limit }) => {
      const client = getClient();
      const comments = await client.listComments(post_id, { subdomain, limit });
      return json(
        comments.map((c) => ({
          id: c.id,
          body: c.body,
          authorName: c.authorName,
          authorId: c.authorId,
          date: c.date,
          reactions: c.reactions,
          childrenCount: c.childrenCount,
        }))
      );
    },
  },
  {
    name: 'get_post_by_id',
    description: 'Get a full post by its numeric ID (searches all your publications)',
    schema: z.object({
      id: z.number().describe('Post numeric ID'),
      subdomain: z.string().optional().describe('Publication subdomain (defaults to searching all your publications)'),
    }),
    handler: async ({ id, subdomain }) => {
      const client = getClient();
      const p = await client.getPostById(id, subdomain);
      return json({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        slug: p.slug,
        canonicalUrl: p.canonicalUrl,
        coverImage: p.coverImage,
        publishedAt: p.publishedAt,
        htmlBody: p.htmlBody,
        description: p.description,
        wordcount: p.wordcount,
        reactionCount: p.reactionCount,
        commentCount: p.commentCount,
        restacks: p.restacks,
        tags: p.postTags,
        youtubeUrls: p.youtubeUrls,
        authors: p.authors,
      });
    },
  },
  {
    name: 'publish_note',
    description: 'Publish a new note on Substack. Supports basic markdown (**bold**).',
    schema: z.object({
      text: z.string().describe('Note content text'),
    }),
    handler: async ({ text }) => {
      const client = getClient();
      const result = await client.publishNote(text);
      return json({ ok: true, id: result.id });
    },
  },
  {
    name: 'reply_to_note',
    description: 'Reply to a note or comment',
    schema: z.object({
      note_id: z.number().describe('ID of the note to reply to'),
      text: z.string().describe('Reply text'),
    }),
    handler: async ({ note_id, text }) => {
      const client = getClient();
      const result = await client.replyToNote(note_id, text);
      return json({ ok: true, id: result.id });
    },
  },
  {
    name: 'comment_on_post',
    description: 'Comment on a post',
    schema: z.object({
      post_id: z.number().describe('Post ID'),
      text: z.string().describe('Comment text'),
      subdomain: z.string().optional().describe('Publication subdomain (defaults to own)'),
    }),
    handler: async ({ post_id, text, subdomain }) => {
      const client = getClient();
      const result = await client.commentOnPost(post_id, text, subdomain);
      return json({ ok: true, id: result.id });
    },
  },
  {
    name: 'react_to_post',
    description: 'React to a post (heart/like)',
    schema: z.object({
      post_id: z.number().describe('Post ID'),
      subdomain: z.string().optional().describe('Publication subdomain (defaults to own)'),
    }),
    handler: async ({ post_id, subdomain }) => {
      const client = getClient();
      await client.reactToPost(post_id, subdomain);
      return json({ ok: true });
    },
  },
  {
    name: 'react_to_comment',
    description: 'React to a comment or note (heart/like)',
    schema: z.object({
      comment_id: z.number().describe('Comment or note ID'),
    }),
    handler: async ({ comment_id }) => {
      const client = getClient();
      await client.reactToComment(comment_id);
      return json({ ok: true });
    },
  },
  {
    name: 'restack_post',
    description: 'Restack (share) a post to your feed',
    schema: z.object({
      post_id: z.number().describe('Post ID'),
    }),
    handler: async ({ post_id }) => {
      const client = getClient();
      await client.restackPost(post_id);
      return json({ ok: true });
    },
  },
  {
    name: 'restack_note',
    description: 'Restack (share) a note to your feed',
    schema: z.object({
      note_id: z.number().describe('Note/comment ID'),
    }),
    handler: async ({ note_id }) => {
      const client = getClient();
      await client.restackNote(note_id);
      return json({ ok: true });
    },
  },
  {
    name: 'get_feed',
    description: 'Get your Substack reader feed (notes, posts, etc.)',
    schema: z.object({
      tab: z
        .string()
        .optional()
        .describe('Feed tab: "for-you", "subscribed", or a category slug'),
    }),
    handler: async ({ tab }) => {
      const client = getClient();
      const feed = await client.getFeed({ tab });
      return json({
        items: feed.items.map((i) => ({
          entityKey: i.entity_key,
          type: i.type,
          contextType: i.context?.type,
          timestamp: i.context?.timestamp,
          authorName: i.context?.users?.[0]?.name,
          authorHandle: i.context?.users?.[0]?.handle,
          body: i.comment?.body?.slice(0, 200),
          postTitle: i.post?.title,
        })),
        nextCursor: feed.nextCursor,
      });
    },
  },
];
