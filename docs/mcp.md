# MCP Server Reference

`@postcli/substack` exposes a [Model Context Protocol](https://modelcontextprotocol.io) server with 16 tools for AI agents to interact with Substack.

## Setup

### Claude Code

Add to your project's `.claude/settings.json` or `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "substack": {
      "command": "npx",
      "args": ["postcli-substack", "--mcp"]
    }
  }
}
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "substack": {
      "command": "npx",
      "args": ["postcli-substack", "--mcp"]
    }
  }
}
```

If installed globally or from a local path:

```json
{
  "mcpServers": {
    "substack": {
      "command": "postcli-substack",
      "args": ["--mcp"]
    }
  }
}
```

### Running Directly

```bash
# Via npm script
npm run mcp

# Via npx
npx postcli-substack --mcp

# With MCP Inspector (development)
npm run dev:mcp
```

### Prerequisites

Authentication must be configured before starting the server. Run `postcli-substack auth login` first. The server reads credentials from `~/.config/postcli/.env`.

---

## Tools

### test_connection

Test Substack authentication.

**Parameters:** none

**Response:**

```
Connection successful
```

---

### get_own_profile

Get your own Substack profile with publications list.

**Parameters:** none

**Response:**

```json
{
  "id": 12345,
  "name": "John Doe",
  "handle": "johndoe",
  "bio": "Writer and developer",
  "photoUrl": "https://...",
  "publications": [
    { "id": 111, "name": "My Newsletter", "subdomain": "johndoe", "role": "admin" }
  ]
}
```

---

### get_profile

Get a Substack profile by subdomain.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subdomain` | string | yes | Publication subdomain (e.g. `nicolascole77`) |

**Response:**

```json
{
  "id": 67890,
  "name": "Nicolas Cole",
  "handle": "nicolascole77",
  "bio": "...",
  "photoUrl": "https://...",
  "publications": [...]
}
```

---

### list_posts

List posts. By default fetches from all your publications merged by date. Use `subdomain` to target a specific publication.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subdomain` | string | no | Specific publication subdomain (omit to fetch from all your publications) |
| `limit` | number | no | Max posts to return (default: 10) |
| `offset` | number | no | Offset for pagination (default: 0) |

**Response:**

```json
[
  {
    "id": 12345,
    "title": "My First Post",
    "subtitle": "A quick intro",
    "slug": "my-first-post",
    "truncatedBody": "This is the beginning of...",
    "publishedAt": "2025-01-15T10:00:00.000Z",
    "canonicalUrl": "https://johndoe.substack.com/p/my-first-post",
    "coverImage": "https://...",
    "wordcount": 1200,
    "reactionCount": 42,
    "commentCount": 7,
    "restacks": 3,
    "authors": [{ "name": "John Doe", "handle": "johndoe" }]
  }
]
```

---

### get_post

Get a full post by slug with HTML content, authors, and YouTube embeds.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | yes | Post slug (from URL) |
| `subdomain` | string | no | Publication subdomain (defaults to own) |

**Response:**

```json
{
  "id": 12345,
  "title": "My First Post",
  "subtitle": "A quick intro",
  "slug": "my-first-post",
  "canonicalUrl": "https://johndoe.substack.com/p/my-first-post",
  "coverImage": "https://...",
  "publishedAt": "2025-01-15T10:00:00.000Z",
  "htmlBody": "<p>Full HTML content...</p>",
  "description": "A quick intro to my newsletter",
  "wordcount": 1200,
  "reactionCount": 42,
  "commentCount": 7,
  "restacks": 3,
  "tags": ["writing", "tech"],
  "youtubeUrls": [],
  "authors": [{ "name": "John Doe", "handle": "johndoe" }]
}
```

---

### get_post_by_id

Get a full post by its numeric ID. Searches all your publications if no subdomain is given.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | yes | Post numeric ID |
| `subdomain` | string | no | Publication subdomain (defaults to searching all your publications) |

**Response:** Same structure as `get_post`.

---

### list_notes

List notes from your Substack reader feed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | no | Max notes to return (default: 10) |

**Response:**

```json
[
  {
    "id": 98765,
    "body": "Just shipped a new feature!",
    "author": { "name": "Jane Smith", "handle": "janesmith" },
    "publishedAt": "2025-03-10T14:30:00.000Z",
    "reactions": { "❤": 15 },
    "childrenCount": 3
  }
]
```

---

### list_comments

List comments on a post.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post_id` | number | yes | Post ID |
| `subdomain` | string | no | Publication subdomain (defaults to own) |
| `limit` | number | no | Max comments to return (default: 20) |

**Response:**

```json
[
  {
    "id": 54321,
    "body": "Great article!",
    "authorName": "Reader One",
    "authorId": 11111,
    "date": "2025-03-11T08:00:00.000Z",
    "reactions": 5,
    "childrenCount": 1
  }
]
```

---

### get_feed

Get your Substack reader feed (notes, posts, restacks).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tab` | string | no | Feed tab: `for-you`, `subscribed`, or a category slug |

**Response:**

```json
{
  "items": [
    {
      "entityKey": "comment-98765",
      "type": "comment",
      "contextType": "note",
      "timestamp": "2025-03-10T14:30:00.000Z",
      "authorName": "Jane Smith",
      "authorHandle": "janesmith",
      "body": "Just shipped a new feature!",
      "postTitle": null
    }
  ],
  "nextCursor": "abc123"
}
```

---

### publish_note

Publish a new note on Substack. Supports basic markdown (`**bold**`).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | yes | Note content text |

**Response:**

```json
{ "ok": true, "id": 98766 }
```

---

### reply_to_note

Reply to a note or comment.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `note_id` | number | yes | ID of the note to reply to |
| `text` | string | yes | Reply text |

**Response:**

```json
{ "ok": true, "id": 98767 }
```

---

### comment_on_post

Comment on a post.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post_id` | number | yes | Post ID |
| `text` | string | yes | Comment text |
| `subdomain` | string | no | Publication subdomain (defaults to own) |

**Response:**

```json
{ "ok": true, "id": 54322 }
```

---

### react_to_post

React to a post (heart/like).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post_id` | number | yes | Post ID |
| `subdomain` | string | no | Publication subdomain (defaults to own) |

**Response:**

```json
{ "ok": true }
```

---

### react_to_comment

React to a comment or note (heart/like).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `comment_id` | number | yes | Comment or note ID |

**Response:**

```json
{ "ok": true }
```

---

### restack_post

Restack (share) a post to your feed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `post_id` | number | yes | Post ID |

**Response:**

```json
{ "ok": true }
```

---

### restack_note

Restack (share) a note to your feed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `note_id` | number | yes | Note/comment ID |

**Response:**

```json
{ "ok": true }
```
