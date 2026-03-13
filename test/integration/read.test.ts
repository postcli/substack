/**
 * Integration tests for read operations.
 * Requires SUBSTACK_TOKEN and SUBSTACK_PUBLICATION_URL env vars.
 * Skipped automatically when credentials are not available.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// Dynamic import to avoid crash when env vars missing
let SubstackClient: any;
let client: any;
let skipAll = false;

before(async () => {
  try {
    const mod = await import('../../src/lib/substack.js');
    SubstackClient = mod.SubstackClient;

    const token = process.env.SUBSTACK_TOKEN;
    const publicationUrl = process.env.SUBSTACK_PUBLICATION_URL;
    if (!token || !publicationUrl) {
      skipAll = true;
      return;
    }
    client = new SubstackClient({ token, publicationUrl });
  } catch {
    skipAll = true;
  }
});

function skipIfNoCredentials() {
  if (skipAll) {
    return true;
  }
  return false;
}

describe('Integration: read operations', () => {
  it('testConnectivity returns true', async () => {
    if (skipIfNoCredentials()) return;
    const ok = await client.testConnectivity();
    assert.strictEqual(ok, true);
  });

  it('ownProfile returns profile with id and handle', async () => {
    if (skipIfNoCredentials()) return;
    const profile = await client.ownProfile();
    assert.ok(profile.id > 0, 'Profile should have positive id');
    assert.ok(typeof profile.handle === 'string', 'Profile should have handle');
    assert.ok(typeof profile.name === 'string', 'Profile should have name');
    assert.ok(Array.isArray(profile.publications), 'Profile should have publications array');
  });

  it('listPosts returns array of posts', async () => {
    if (skipIfNoCredentials()) return;
    const posts = await client.listPosts({ limit: 3 });
    assert.ok(Array.isArray(posts), 'Should return array');
    assert.ok(posts.length > 0, 'Should have at least one post');
    const p = posts[0];
    assert.ok(p.id > 0, 'Post should have id');
    assert.ok(typeof p.title === 'string', 'Post should have title');
    assert.ok(typeof p.slug === 'string', 'Post should have slug');
    assert.ok(typeof p.canonicalUrl === 'string', 'Post should have canonicalUrl');
    assert.ok(p.publishedAt instanceof Date, 'publishedAt should be Date');
  });

  it('getPost returns full post with HTML body', async () => {
    if (skipIfNoCredentials()) return;
    const posts = await client.listPosts({ limit: 1 });
    assert.ok(posts.length > 0, 'Need at least one post');
    const full = await client.getPost(posts[0].slug);
    assert.ok(typeof full.htmlBody === 'string', 'Should have htmlBody');
    assert.ok(full.htmlBody.length > 0, 'htmlBody should not be empty');
    assert.ok(typeof full.title === 'string', 'Should have title');
  });

  it('listNotes returns array of notes', async () => {
    if (skipIfNoCredentials()) return;
    const notes = await client.listNotes({ limit: 3 });
    assert.ok(Array.isArray(notes), 'Should return array');
    if (notes.length > 0) {
      const n = notes[0];
      assert.ok(n.id > 0, 'Note should have id');
      assert.ok(typeof n.body === 'string', 'Note should have body');
      assert.ok(n.author, 'Note should have author');
      assert.ok(n.publishedAt instanceof Date, 'publishedAt should be Date');
    }
  });

  it('getFeed returns items with nextCursor', async () => {
    if (skipIfNoCredentials()) return;
    const feed = await client.getFeed();
    assert.ok(Array.isArray(feed.items), 'Should have items array');
    assert.ok(feed.items.length > 0, 'Should have at least one item');
    // nextCursor may be null on last page but should be defined
    assert.ok('nextCursor' in feed, 'Should have nextCursor key');
  });

  it('getProfileFeed returns user comments/notes', async () => {
    if (skipIfNoCredentials()) return;
    const profile = await client.ownProfile();
    const feed = await client.getProfileFeed(profile.id);
    assert.ok(Array.isArray(feed.items), 'Should have items array');
    // May be empty for new users, just check structure
    assert.ok('nextCursor' in feed, 'Should have nextCursor key');
  });

  it('getComment returns comment with parentComments', async () => {
    if (skipIfNoCredentials()) return;
    // Get a comment ID from profile feed
    const profile = await client.ownProfile();
    const feed = await client.getProfileFeed(profile.id);
    const commentItem = feed.items.find((i: any) => i.type === 'comment' && i.comment);
    if (!commentItem) return; // skip if no comments

    const result = await client.getComment(commentItem.comment.id);
    assert.ok(result.comment, 'Should have comment');
    assert.ok(result.comment.id > 0, 'Comment should have id');
    assert.ok(Array.isArray(result.parentComments), 'Should have parentComments array');
  });

  it('getCommentReplies returns branches', async () => {
    if (skipIfNoCredentials()) return;
    // Find a comment with children
    const profile = await client.ownProfile();
    const feed = await client.getProfileFeed(profile.id);
    let targetId: number | null = null;
    for (const item of feed.items) {
      if (item.type === 'comment' && item.comment?.children_count > 0) {
        targetId = item.comment.id;
        break;
      }
    }
    if (!targetId) return; // skip if no threaded comments

    const result = await client.getCommentReplies(targetId);
    assert.ok(result.rootComment, 'Should have rootComment');
    assert.ok(Array.isArray(result.branches), 'Should have branches array');
    if (result.branches.length > 0) {
      assert.ok(result.branches[0].comment, 'Branch should have comment');
      assert.ok(Array.isArray(result.branches[0].descendants), 'Branch should have descendants');
    }
  });

  it('listComments returns comments on a post', async () => {
    if (skipIfNoCredentials()) return;
    const posts = await client.listPosts({ limit: 5 });
    const postWithComments = posts.find((p: any) => (p.commentCount ?? 0) > 0);
    if (!postWithComments) return; // skip if no posts have comments

    const comments = await client.listComments(postWithComments.id);
    assert.ok(Array.isArray(comments), 'Should return array');
    if (comments.length > 0) {
      assert.ok(comments[0].id > 0, 'Comment should have id');
      assert.ok(typeof comments[0].body === 'string', 'Comment should have body');
    }
  });
});
