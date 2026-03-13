# Skill: Substack Feed

Use `postcli substack` CLI to read your Substack reader feed.

## Commands

```bash
# Default feed
postcli substack -j feed list

# Specific tab
postcli substack -j feed list -t for-you
postcli substack -j feed list -t subscribed
```

## JSON Output Fields

- `items` - Array of feed items:
  - `entityKey` - Unique item key
  - `type` - Item type (comment, post, userSuggestions, chat)
  - `contextType` - Context (note, comment_like, from_archives, chat_subscribed)
  - `timestamp` - ISO date
  - `authorName` - Author display name
  - `authorHandle` - Author handle
  - `body` - Comment/note body text
  - `postTitle` - Post title (if post item)
  - `postSlug` - Post slug (if post item)
- `nextCursor` - Pagination cursor for next page

## Available Tabs

- `for-you` - Personalized recommendations
- `subscribed` - From your subscriptions only
- Category slugs for specific topics
