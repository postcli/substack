import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PreviewPost, FullPost, Note, Comment, Profile } from '../src/lib/models.js';

describe('PreviewPost', () => {
  const raw = {
    id: 42,
    title: 'My Post',
    slug: 'my-post',
    subtitle: 'A subtitle',
    post_date: '2024-06-15T12:00:00Z',
    audience: 'everyone',
    canonical_url: 'https://example.substack.com/p/my-post',
    publication_id: 1,
    type: 'newsletter',
    publishedBylines: [
      {
        id: 10,
        name: 'Alice',
        handle: 'alice',
        photo_url: 'https://img.example.com/alice.jpg',
      },
    ],
  };

  it('parses id, title, slug, canonical_url correctly', () => {
    const post = new PreviewPost(raw);
    assert.strictEqual(post.id, 42);
    assert.strictEqual(post.title, 'My Post');
    assert.strictEqual(post.slug, 'my-post');
    assert.strictEqual(post.canonicalUrl, 'https://example.substack.com/p/my-post');
  });

  it('publishedAt is a Date', () => {
    const post = new PreviewPost(raw);
    assert.ok(post.publishedAt instanceof Date);
    assert.strictEqual(post.publishedAt.toISOString(), '2024-06-15T12:00:00.000Z');
  });

  it('authors extracted from publishedBylines', () => {
    const post = new PreviewPost(raw);
    assert.strictEqual(post.authors.length, 1);
    assert.strictEqual(post.authors[0].name, 'Alice');
    assert.strictEqual(post.authors[0].handle, 'alice');
    assert.strictEqual(post.authors[0].id, 10);
  });
});

describe('FullPost', () => {
  const raw = {
    id: 43,
    title: 'Full Post',
    slug: 'full-post',
    post_date: '2024-07-01T10:00:00Z',
    audience: 'everyone',
    canonical_url: 'https://example.substack.com/p/full-post',
    publication_id: 1,
    type: 'newsletter',
    body_html: '<p>Hello</p><iframe src="https://www.youtube-nocookie.com/embed/abc123"></iframe><iframe src="https://www.youtube-nocookie.com/embed/def456"></iframe>',
    publishedBylines: [],
  };

  it('inherits PreviewPost fields', () => {
    const post = new FullPost(raw);
    assert.strictEqual(post.id, 43);
    assert.strictEqual(post.title, 'Full Post');
    assert.strictEqual(post.slug, 'full-post');
  });

  it('htmlBody from body_html', () => {
    const post = new FullPost(raw);
    assert.ok(post.htmlBody.includes('<p>Hello</p>'));
  });

  it('youtubeUrls extracts from embedded youtube-nocookie.com URLs', () => {
    const post = new FullPost(raw);
    const urls = post.youtubeUrls;
    assert.strictEqual(urls.length, 2);
    assert.strictEqual(urls[0], 'https://www.youtube.com/watch?v=abc123');
    assert.strictEqual(urls[1], 'https://www.youtube.com/watch?v=def456');
  });

  it('youtubeUrls returns empty array when no videos', () => {
    const noVideoRaw = { ...raw, body_html: '<p>No videos here</p>' };
    const post = new FullPost(noVideoRaw);
    assert.deepStrictEqual(post.youtubeUrls, []);
  });
});

describe('Note', () => {
  const feedItem = {
    entity_key: 'note-123',
    type: 'comment',
    context: {
      type: 'note',
      typeBucket: 'notes',
      timestamp: '2024-08-01T09:00:00Z',
      users: [
        {
          id: 20,
          name: 'Bob',
          handle: 'bob',
          photo_url: 'https://img.example.com/bob.jpg',
        },
      ],
    },
    comment: {
      id: 555,
      body: 'This is a note body',
      date: '2024-08-01T09:00:00Z',
      user_id: 20,
      name: 'Bob',
      handle: 'bob',
      reactions: { '\u2764': 3 },
      children_count: 2,
    },
  };

  it('extracts id, body from feedItem.comment', () => {
    const note = new Note(feedItem);
    assert.strictEqual(note.id, 555);
    assert.strictEqual(note.body, 'This is a note body');
  });

  it('author from context.users[0] with fallback to comment fields', () => {
    const note = new Note(feedItem);
    assert.strictEqual(note.author.id, 20);
    assert.strictEqual(note.author.name, 'Bob');
    assert.strictEqual(note.author.handle, 'bob');

    // Test fallback when context.users is empty
    const fallbackItem = {
      ...feedItem,
      context: { ...feedItem.context, users: [] },
    };
    const fallbackNote = new Note(fallbackItem);
    assert.strictEqual(fallbackNote.author.id, 20);
    assert.strictEqual(fallbackNote.author.name, 'Bob');
    assert.strictEqual(fallbackNote.author.handle, 'bob');
  });

  it('publishedAt is a Date', () => {
    const note = new Note(feedItem);
    assert.ok(note.publishedAt instanceof Date);
  });

  it('childrenCount from children_count', () => {
    const note = new Note(feedItem);
    assert.strictEqual(note.childrenCount, 2);
  });
});

describe('Comment', () => {
  const raw = {
    id: 100,
    body: 'Great post!',
    name: 'Charlie',
    user_id: 30,
    date: '2024-09-10T15:30:00Z',
    reactions: { '\u2764': 5, '\ud83d\ude02': 1 },
    children: [{ id: 101, body: 'reply', name: 'X', user_id: 31, date: '2024-09-10T16:00:00Z' }],
  };

  it('parses id, body, authorName, authorId, date', () => {
    const comment = new Comment(raw);
    assert.strictEqual(comment.id, 100);
    assert.strictEqual(comment.body, 'Great post!');
    assert.strictEqual(comment.authorName, 'Charlie');
    assert.strictEqual(comment.authorId, 30);
    assert.ok(comment.date instanceof Date);
  });

  it('reactions preserved', () => {
    const comment = new Comment(raw);
    assert.deepStrictEqual(comment.reactions, { '\u2764': 5, '\ud83d\ude02': 1 });
  });
});

describe('Profile', () => {
  const byline = {
    id: 50,
    handle: 'dave',
    name: 'Dave Smith',
    photo_url: 'https://img.example.com/dave.jpg',
    bio: 'A writer',
    publicationUsers: [
      {
        id: 1,
        user_id: 50,
        publication_id: 100,
        role: 'admin',
        public: true,
        is_primary: true,
        publication: {
          id: 100,
          name: 'Dave Blog',
          subdomain: 'daveblog',
          author_id: 50,
        },
      },
    ],
  };

  it('extracts id, handle, name, avatarUrl', () => {
    const profile = new Profile(byline);
    assert.strictEqual(profile.id, 50);
    assert.strictEqual(profile.handle, 'dave');
    assert.strictEqual(profile.name, 'Dave Smith');
    assert.strictEqual(profile.avatarUrl, 'https://img.example.com/dave.jpg');
  });

  it('publications array from publicationUsers', () => {
    const profile = new Profile(byline);
    assert.strictEqual(profile.publications.length, 1);
    assert.strictEqual(profile.publications[0].subdomain, 'daveblog');
    assert.strictEqual(profile.publications[0].name, 'Dave Blog');
    assert.strictEqual(profile.publications[0].role, 'admin');
  });
});
