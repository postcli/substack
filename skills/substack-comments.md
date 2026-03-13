# Skill: Substack Comments

Use `postcli substack` CLI to read comments on Substack posts.

## Commands

```bash
# List comments on a post
postcli substack -j comments list <post-id>

# From another publication
postcli substack -j comments list <post-id> -s <subdomain>

# Limit results
postcli substack -j comments list <post-id> -l 50
```

## JSON Output Fields

- `id` - Comment ID
- `body` - Comment text
- `authorName` - Author display name
- `authorId` - Author user ID
- `date` - ISO date
- `reactions` - Object with reaction type counts
- `childrenCount` - Number of replies

## Usage Notes

- `post-id` is the numeric ID from `posts list`
- Use `-s` to read comments on posts from other publications
