# Skill: Substack Posts

Use `postcli substack` CLI to interact with Substack posts.

## Commands

```bash
# List posts from all publications (human-readable)
postcli substack posts list

# List posts as JSON (for parsing)
postcli substack -j posts list

# List from a specific publication
postcli substack -j posts list -s <subdomain>

# Get full post by slug
postcli substack -j posts get <slug>

# Get post from another publication
postcli substack -j posts get <slug> -s <subdomain>
```

## JSON Output Fields (list)

- `id` - Post ID
- `title` - Post title
- `subtitle` - Post subtitle
- `slug` - URL slug (used to fetch full post)
- `publishedAt` - ISO date
- `canonicalUrl` - Full URL
- `wordcount` - Word count
- `reactionCount` - Number of reactions
- `commentCount` - Number of comments
- `restacks` - Number of restacks
- `authors` - Array of `{id, name, handle, avatarUrl}`
- `publicationSubdomain` - Which publication this post belongs to
- `truncatedBody` - Preview text

## JSON Output Fields (get)

All fields from list, plus:
- `htmlBody` - Full HTML content
- `description` - SEO description
- `tags` - Array of tag names
- `youtubeUrls` - Embedded YouTube video URLs
- `coverImage` - Cover image URL

## Usage Notes

- Always use `-j` flag when parsing output programmatically
- The `slug` from `list` is what you pass to `get`
- Without `-s` or `-p`, `list` fetches from ALL user publications merged by date
