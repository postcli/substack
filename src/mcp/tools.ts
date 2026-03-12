import { z } from 'zod';
import { getClient, collectAsync } from '../client.js';

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
    description: 'Get your own Substack profile',
    schema: z.object({}),
    handler: async () => {
      const client = getClient();
      const p = await client.ownProfile();
      return json({ id: p.id, name: p.name, handle: p.handle, url: p.url, bio: p.bio });
    },
  },
  {
    name: 'get_profile',
    description: 'Get a Substack profile by slug',
    schema: z.object({ slug: z.string().describe('Profile slug/handle') }),
    handler: async ({ slug }) => {
      const client = getClient();
      const p = await client.profileForSlug(slug);
      return json({ id: p.id, name: p.name, handle: p.handle, url: p.url, bio: p.bio });
    },
  },
  {
    name: 'list_posts',
    description: 'List posts from a Substack publication',
    schema: z.object({
      slug: z.string().optional().describe('Profile slug (defaults to own profile)'),
      limit: z.number().optional().default(10).describe('Max posts to return'),
    }),
    handler: async ({ slug, limit }) => {
      const client = getClient();
      const profile = slug ? await client.profileForSlug(slug) : await client.ownProfile();
      const posts = await collectAsync(profile.posts({ limit }), limit);
      return json(posts.map((p) => ({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        publishedAt: p.publishedAt,
      })));
    },
  },
  {
    name: 'get_post',
    description: 'Get a full post by ID with markdown content',
    schema: z.object({ id: z.number().describe('Post ID') }),
    handler: async ({ id }) => {
      const client = getClient();
      const p = await client.postForId(id);
      return json({
        id: p.id,
        title: p.title,
        subtitle: p.subtitle,
        slug: p.slug,
        url: p.url,
        publishedAt: p.publishedAt,
        markdown: p.markdown,
        reactions: p.reactions,
        restacks: p.restacks,
        tags: p.postTags,
      });
    },
  },
  {
    name: 'list_notes',
    description: 'List notes from a Substack profile',
    schema: z.object({
      slug: z.string().optional().describe('Profile slug (defaults to own profile)'),
      limit: z.number().optional().default(10).describe('Max notes to return'),
    }),
    handler: async ({ slug, limit }) => {
      const client = getClient();
      const profile = slug ? await client.profileForSlug(slug) : await client.ownProfile();
      const notes = await collectAsync(profile.notes({ limit }), limit);
      return json(notes.map((n) => ({
        id: n.id,
        body: n.body,
        likesCount: n.likesCount,
        author: n.author,
        publishedAt: n.publishedAt,
      })));
    },
  },
  {
    name: 'get_note',
    description: 'Get a specific note by ID',
    schema: z.object({ id: z.number().describe('Note ID') }),
    handler: async ({ id }) => {
      const client = getClient();
      const n = await client.noteForId(id);
      return json({
        id: n.id,
        body: n.body,
        likesCount: n.likesCount,
        author: n.author,
        publishedAt: n.publishedAt,
      });
    },
  },
  {
    name: 'publish_note',
    description: 'Publish a new note on Substack',
    schema: z.object({
      content: z.string().describe('Note content (supports markdown)'),
      attachment: z.string().optional().describe('Optional URL to attach'),
    }),
    handler: async ({ content, attachment }) => {
      const client = getClient();
      const profile = await client.ownProfile();
      const result = await profile.publishNote(content, { attachment });
      return json({ success: true, id: result.id });
    },
  },
  {
    name: 'list_comments',
    description: 'List comments on a post',
    schema: z.object({
      post_id: z.number().describe('Post ID'),
      limit: z.number().optional().default(20).describe('Max comments to return'),
    }),
    handler: async ({ post_id, limit }) => {
      const client = getClient();
      const post = await client.postForId(post_id);
      const comments = await collectAsync(post.comments({ limit }), limit);
      return json(comments.map((c) => ({
        id: c.id,
        body: c.body,
        isAdmin: c.isAdmin,
      })));
    },
  },
  {
    name: 'comment_on_post',
    description: 'Add a comment to a post',
    schema: z.object({
      post_id: z.number().describe('Post ID'),
      text: z.string().describe('Comment text'),
    }),
    handler: async ({ post_id, text }) => {
      const client = getClient();
      const post = await client.postForId(post_id);
      const comment = await post.addComment({ body: text });
      return json({ success: true, id: comment.id });
    },
  },
  {
    name: 'like_post',
    description: 'Like a post',
    schema: z.object({ id: z.number().describe('Post ID') }),
    handler: async ({ id }) => {
      const client = getClient();
      const post = await client.postForId(id);
      await post.like();
      return json({ success: true, postId: id });
    },
  },
  {
    name: 'list_following',
    description: 'List profiles you follow',
    schema: z.object({
      limit: z.number().optional().default(20).describe('Max profiles to return'),
    }),
    handler: async ({ limit }) => {
      const client = getClient();
      const profile = await client.ownProfile();
      const following = await collectAsync(profile.following({ limit }), limit);
      return json(following.map((p) => ({
        id: p.id,
        name: p.name,
        handle: p.handle,
        url: p.url,
      })));
    },
  },
];
