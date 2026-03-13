# Programmatic API Reference

Use `SubstackClient` directly for programmatic access to Substack.

```typescript
import { SubstackClient } from '@postcli/substack/client';
```

## Constructor

```typescript
const client = new SubstackClient({
  token: string,            // Base64-encoded auth token
  publicationUrl: string,   // e.g. "https://myname.substack.com"
  maxRequestsPerSecond?: number,  // Rate limiting (optional)
});
```

---

## Methods

### testConnectivity

Test if authentication is valid by fetching a single post from your publication.

```typescript
testConnectivity(): Promise<boolean>
```

**Returns:** `true` if the token works, `false` otherwise.

```typescript
const ok = await client.testConnectivity();
```

---

### ownProfile

Get your own Substack profile. Extracts author byline from your publication's first post.

```typescript
ownProfile(): Promise<Profile>
```

**Returns:** `Profile` with fields: `id`, `name`, `handle`, `bio`, `photoUrl`, `publications[]`.

```typescript
const me = await client.ownProfile();
console.log(me.name, me.handle);
console.log(me.publications.map(p => p.subdomain));
```

---

### profileForSubdomain

Get a profile by publication subdomain.

```typescript
profileForSubdomain(subdomain: string): Promise<Profile>
```

```typescript
const profile = await client.profileForSubdomain('nicolascole77');
console.log(profile.name, profile.bio);
```

---

### listPosts

List posts from a publication's archive.

```typescript
listPosts(options?: {
  subdomain?: string,  // Defaults to own publication
  limit?: number,      // Default: 10
  offset?: number,     // Default: 0
}): Promise<PreviewPost[]>
```

**Returns:** Array of `PreviewPost` with fields: `id`, `title`, `subtitle`, `slug`, `publishedAt`, `canonicalUrl`, `coverImage`, `wordcount`, `reactionCount`, `commentCount`, `restacks`, `authors[]`, `truncatedBody`, `publicationSubdomain`.

```typescript
// Own posts
const myPosts = await client.listPosts({ limit: 20 });

// Another publication
const posts = await client.listPosts({ subdomain: 'platformer', limit: 5 });
```

---

### getPost

Get a full post by slug.

```typescript
getPost(slug: string, subdomain?: string): Promise<FullPost>
```

**Returns:** `FullPost` with all `PreviewPost` fields plus: `htmlBody`, `description`, `postTags[]`, `youtubeUrls[]`.

```typescript
const post = await client.getPost('my-first-post');
console.log(post.title, post.htmlBody);
```

---

### getPostById

Get a post by numeric ID. Searches the archive to find the slug, then fetches the full post.

```typescript
getPostById(id: number, subdomain?: string): Promise<FullPost>
```

If no `subdomain` is given, searches all your publications. Paginates through the archive in pages of 50 with up to 20 attempts per subdomain.

```typescript
const post = await client.getPostById(12345);
```

---

### listNotes

List notes from the reader feed. Filters feed items to only those with `typeBucket=notes`.

```typescript
listNotes(options?: {
  limit?: number,  // Default: 10
}): Promise<Note[]>
```

**Returns:** Array of `Note` with fields: `id`, `body`, `author` (`{ name, handle }`), `publishedAt`, `reactions`, `childrenCount`.

Automatically paginates through the feed until `limit` notes are collected or no more pages are available.

```typescript
const notes = await client.listNotes({ limit: 25 });
```

---

### listComments

List comments on a post.

```typescript
listComments(postId: number, options?: {
  subdomain?: string,  // Defaults to own
  limit?: number,      // Default: 50
}): Promise<Comment[]>
```

**Returns:** Array of `Comment` with fields: `id`, `body`, `authorName`, `authorId`, `date`, `reactions`, `childrenCount`.

```typescript
const comments = await client.listComments(12345, { limit: 10 });
```

---

### getFeed

Get the authenticated user's reader feed.

```typescript
getFeed(options?: {
  tab?: string,     // "for-you", "subscribed", or category slug
  cursor?: string,  // Pagination cursor
}): Promise<{ items: SubstackFeedItem[], nextCursor?: string }>
```

**Returns:** Feed items and an optional cursor for the next page.

```typescript
const feed = await client.getFeed({ tab: 'subscribed' });
for (const item of feed.items) {
  console.log(item.type, item.entity_key);
}

// Paginate
const page2 = await client.getFeed({ tab: 'subscribed', cursor: feed.nextCursor });
```

---

### getProfileFeed

Get a user's profile feed (their comments and notes).

```typescript
getProfileFeed(userId: number, options?: {
  cursor?: string,
}): Promise<{ items: SubstackFeedItem[], nextCursor?: string }>
```

```typescript
const profile = await client.ownProfile();
const myFeed = await client.getProfileFeed(profile.id);
```

---

### getComment

Get a single comment with its parent comments (ancestors in the thread).

```typescript
getComment(commentId: number): Promise<{
  comment: any,
  parentComments: any[],
}>
```

```typescript
const detail = await client.getComment(54321);
console.log(detail.parentComments.length, 'parents');
console.log(detail.comment.body);
```

---

### getCommentReplies

Get replies to a comment (children threads).

```typescript
getCommentReplies(commentId: number): Promise<{
  rootComment: any,
  branches: { comment: any, descendants: any[] }[],
}>
```

Each branch contains a direct reply and its nested descendants.

```typescript
const replies = await client.getCommentReplies(54321);
for (const branch of replies.branches) {
  console.log(branch.comment.body);
  console.log('  nested:', branch.descendants.length);
}
```

---

### publishNote

Publish a new note. Text is converted to ProseMirror format. Supports `**bold**` markdown.

```typescript
publishNote(text: string, options?: {
  replyMinimumRole?: string,  // Default: "everyone"
}): Promise<{ id: number }>
```

```typescript
const result = await client.publishNote('Just shipped **v2.0**!');
console.log('Published note:', result.id);
```

---

### replyToNote

Reply to a note or comment.

```typescript
replyToNote(parentId: number, text: string): Promise<{ id: number }>
```

```typescript
const reply = await client.replyToNote(98765, 'Thanks for sharing!');
console.log('Reply ID:', reply.id);
```

---

### commentOnPost

Comment on a post. Substack converts the plain text body to ProseMirror server-side.

```typescript
commentOnPost(postId: number, text: string, subdomain?: string): Promise<{ id: number }>
```

```typescript
const comment = await client.commentOnPost(12345, 'Great article!');
console.log('Comment ID:', comment.id);
```

---

### reactToPost

React to a post (heart).

```typescript
reactToPost(postId: number, subdomain?: string): Promise<void>
```

```typescript
await client.reactToPost(12345);
```

---

### reactToComment

React to a comment or note (heart).

```typescript
reactToComment(commentId: number): Promise<void>
```

```typescript
await client.reactToComment(54321);
```

---

### restackPost

Restack a post to your feed.

```typescript
restackPost(postId: number): Promise<void>
```

```typescript
await client.restackPost(12345);
```

---

### restackNote

Restack a note/comment to your feed.

```typescript
restackNote(commentId: number): Promise<void>
```

```typescript
await client.restackNote(98765);
```

---

### getSubdomain

Get the default subdomain for this client (extracted from the publication URL).

```typescript
getSubdomain(): string
```

```typescript
const sub = client.getSubdomain(); // "myname"
```

---

## Static Methods

### SubstackClient.verifyToken

Verify an auth token is valid by testing reader feed access.

```typescript
static verifyToken(token: string): Promise<boolean>
```

```typescript
const valid = await SubstackClient.verifyToken(myToken);
```

---

### SubstackClient.discoverProfile

Auto-discover user profile from a token and optional `substack.lli` JWT. Used during login to find the user's handle and publications without prompting.

```typescript
static discoverProfile(token: string, lliToken?: string): Promise<{
  handle: string | null,
  name: string | null,
  id: number,
  publications: { subdomain: string, name: string }[],
  subscriptions: { subdomain: string, name: string }[],
} | null>
```

---

### SubstackClient.extractUserId

Extract the `userId` from a `substack.lli` JWT token.

```typescript
static extractUserId(lliToken?: string): number | null
```
