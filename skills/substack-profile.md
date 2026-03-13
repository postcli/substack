# Skill: Substack Profile

Use `postcli substack` CLI to view Substack profiles.

## Commands

```bash
# Your own profile
postcli substack -j profile me

# Another user's profile by subdomain
postcli substack -j profile get <subdomain>
```

## JSON Output Fields

- `id` - User ID
- `handle` - Username handle
- `name` - Display name
- `avatarUrl` - Avatar image URL
- `bio` - User bio
- `publications` - Array of `{id, name, subdomain, role}`

## Usage Notes

- `subdomain` is the part before `.substack.com` (e.g. "nicolascole77")
- Publications list shows all publications the user is admin/editor of
