# @postcli/substack

Substack CLI and MCP Server. Read posts, publish notes, manage your Substack from the terminal.

> **Disclaimer:** This is an unofficial tool, not affiliated with or endorsed by Substack. It uses undocumented APIs that may change without notice. Use at your own risk.

## Install

```bash
npm install -g @postcli/substack
```

Or clone and link locally:

```bash
git clone https://github.com/postcli/substack.git
cd substack
npm install
npm link
```

## Authentication

```bash
# Auto-grab cookies from Chrome (if logged into Substack)
postcli-substack auth login

# Or manually paste cookies
postcli-substack auth setup

# Test connection
postcli-substack auth test
```

## CLI Usage

```bash
# Posts
postcli-substack posts list
postcli-substack posts list --slug someone
postcli-substack posts get 12345

# Notes
postcli-substack notes list
postcli-substack notes get 12345
postcli-substack notes publish "Hello world"
postcli-substack notes publish --link https://example.com "Check this out"

# Comments
postcli-substack comments list 12345
postcli-substack comments add 12345 "Great post!"

# Profile
postcli-substack profile me
postcli-substack profile get someone

# Social
postcli-substack social like 12345
postcli-substack social following
```

## MCP Server

Works with Claude Code, Claude Desktop, or any MCP client.

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "substack": {
      "command": "npx",
      "args": ["@postcli/substack", "--mcp"]
    }
  }
}
```

### Testing with Inspector

```bash
npm run dev:mcp
```

### Available Tools

| Tool | Description |
|------|-------------|
| `test_connection` | Test authentication |
| `get_own_profile` | Your profile |
| `get_profile` | Profile by slug |
| `list_posts` | List posts |
| `get_post` | Full post by ID |
| `list_notes` | List notes |
| `get_note` | Note by ID |
| `publish_note` | Publish a note |
| `list_comments` | Comments on a post |
| `comment_on_post` | Comment on a post |
| `like_post` | Like a post |
| `list_following` | List followed profiles |

## License

AGPL-3.0
