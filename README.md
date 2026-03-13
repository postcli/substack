<div align="center">

<img src="logo.png" alt="postcli substack" width="80" />

# @postcli/substack

Substack plugin for [PostCLI](https://github.com/postcli/cli). Read posts, publish notes, manage your Substack from the terminal.

[![npm](https://img.shields.io/npm/v/@postcli/substack)](https://www.npmjs.com/package/@postcli/substack)
[![license](https://img.shields.io/github/license/postcli/substack)](LICENSE)
[![node](https://img.shields.io/node/v/@postcli/substack)](package.json)

</div>

> **Disclaimer:** This is an unofficial tool, not affiliated with or endorsed by Substack. It uses undocumented APIs that may change without notice. Use at your own risk.

## Install

```bash
npm install -g @postcli/substack
```

This automatically installs `@postcli/cli`, making the `postcli` command available globally.

Requires Node.js 18+.

## Authentication

The fastest way is auto-grabbing cookies from Chrome (you must be logged into Substack):

```bash
postcli substack auth login
```

If Chrome grab fails, it falls back to email OTP (a 6-digit code sent to your email).

Other options:

```bash
# Manually paste cookies from DevTools > Application > Cookies
postcli substack auth setup

# Verify credentials work
postcli substack auth test
```

Credentials are stored at `~/.config/postcli/.env` with restricted permissions.

## CLI Usage

```bash
# Posts
postcli substack posts list                    # your posts (default: 10)
postcli substack posts list --limit 20         # more posts
postcli substack posts list --slug someone     # another author's posts
postcli substack posts get 12345               # full post content (markdown)

# Notes
postcli substack notes list                    # your notes
postcli substack notes get 12345               # specific note
postcli substack notes publish "Hello world"   # publish a note
postcli substack notes publish --link https://example.com "Check this out"

# Comments
postcli substack comments list 12345           # comments on post #12345
postcli substack comments add 12345 "Nice!"   # comment on a post

# Profile
postcli substack profile me                    # your profile
postcli substack profile get someone           # another profile

# Social
postcli substack social like 12345             # like a post
postcli substack social following              # who you follow
```

## MCP Server

Start as an MCP server for AI agents (Claude Code, Claude Desktop, or any MCP client):

```bash
postcli --mcp substack
```

### Claude Code

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "substack": {
      "command": "postcli",
      "args": ["--mcp", "substack"]
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
      "command": "postcli",
      "args": ["--mcp", "substack"]
    }
  }
}
```

### Testing with Inspector

```bash
cd /path/to/postcli/substack
npm run dev:mcp
```

### Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `test_connection` | Test authentication | - |
| `get_own_profile` | Your profile | - |
| `get_profile` | Profile by slug | `slug` |
| `list_posts` | List posts | `slug?`, `limit?` |
| `get_post` | Full post by ID | `id` |
| `list_notes` | List notes | `slug?`, `limit?` |
| `get_note` | Note by ID | `id` |
| `publish_note` | Publish a note | `content`, `attachment?` |
| `list_comments` | Comments on a post | `post_id`, `limit?` |
| `comment_on_post` | Comment on a post | `post_id`, `text` |
| `like_post` | Like a post | `id` |
| `list_following` | List followed profiles | `limit?` |

## Standalone Usage

The package also ships a standalone binary if you prefer not to use the `postcli` orchestrator:

```bash
postcli-substack auth login
postcli-substack posts list
```

## License

[AGPL-3.0](LICENSE)
