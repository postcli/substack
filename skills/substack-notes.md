# Skill: Substack Notes

Use `postcli substack` CLI to read Substack notes from your reader feed.

## Commands

```bash
# List notes (human-readable)
postcli substack notes list

# List notes as JSON
postcli substack -j notes list

# Limit results
postcli substack -j notes list -l 20
```

## JSON Output Fields

- `id` - Note ID
- `body` - Note text content
- `author` - `{id, name, handle, avatarUrl}`
- `publishedAt` - ISO date
- `reactions` - Object with reaction type counts
- `childrenCount` - Number of replies

## Usage Notes

- Notes come from the authenticated user's reader feed
- Currently read-only (publishing notes requires browser session)
