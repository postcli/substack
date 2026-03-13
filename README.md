<div align="center">

<img src="logo.png" alt="postcli substack" width="100" />

# @postcli/substack

**Your entire Substack, from the terminal.**

Read posts. Publish notes. Automate engagement. Power AI agents.

[![npm](https://img.shields.io/npm/v/@postcli/substack?style=flat-square&color=ea580c)](https://www.npmjs.com/package/@postcli/substack)
[![license](https://img.shields.io/github/license/postcli/substack?style=flat-square)](LICENSE)
[![node](https://img.shields.io/node/v/@postcli/substack?style=flat-square)](package.json)
[![CI](https://img.shields.io/github/actions/workflow/status/postcli/substack/ci.yml?style=flat-square&label=CI)](https://github.com/postcli/substack/actions)
[![MCP](https://img.shields.io/badge/MCP-compatible-7c3aed?style=flat-square)](https://modelcontextprotocol.io)

</div>

<br/>

<div align="center">

```
  ██████████
  ██  ████ ██     postcli-substack
  ██  ████ ██     CLI  ·  TUI  ·  MCP Server
  ██████████
  ██  ██           > postcli-substack notes publish "Hello from the terminal"
  ██  ██           Published note #227159971
  ██  ██
```

</div>

<br/>

## Why PostCLI?

Substack has no public API. PostCLI fills that gap with a fast, local-first toolkit that puts your Substack workflow in the terminal, in a TUI, or behind an AI agent.

<table>
<tr>
<td width="25%" align="center"><strong>CLI</strong><br/>Full command suite for posts, notes, comments, profiles, and engagement</td>
<td width="25%" align="center"><strong>TUI</strong><br/>Interactive terminal UI with tabs, sub-views, keyboard navigation, and mouse scroll</td>
<td width="25%" align="center"><strong>MCP Server</strong><br/>16 tools for Claude, GPT, and any MCP-compatible AI agent</td>
<td width="25%" align="center"><strong>Automations</strong><br/>Like-back, auto-reply, auto-restack with SQLite-backed dedup engine</td>
</tr>
</table>

## Quick Start

```bash
# 1. Install
npm install -g @postcli/substack

# 2. Authenticate (auto-grabs cookies from Chrome)
postcli-substack auth login

# 3. Go
postcli-substack posts list
postcli-substack notes publish "My first note from the terminal"
postcli-substack tui
```

Requires **Node.js 18+**. Works on macOS and Linux.

## CLI

```bash
# Read
postcli-substack posts list                        # your posts
postcli-substack posts get --slug my-post          # full post in markdown
postcli-substack notes list                        # recent notes
postcli-substack comments list 12345               # comments on a post
postcli-substack feed list --tab for-you           # reader feed
postcli-substack profile me                        # your profile

# Write
postcli-substack notes publish "Hello world"       # publish a note
postcli-substack notes reply 12345 "Great point"   # reply to a note
postcli-substack comments add 12345 "Nice post!"   # comment on a post

# Engage
postcli-substack posts react 12345                 # heart a post
postcli-substack notes react 67890                 # heart a note
postcli-substack posts restack 12345               # restack a post
postcli-substack notes restack 67890               # restack a note

# Automate
postcli-substack auto presets                      # see available presets
postcli-substack auto create                       # create an automation
postcli-substack auto run 1                        # run now
```

All commands support `--json` for piping and scripting.

[Full CLI reference &rarr;](docs/cli.md)

## Interactive TUI

```bash
postcli-substack tui
```

Six tabs: **Posts** | **Notes** | **Comments** | **Feed** | **Automations** | **Profile**

Navigate with arrow keys, mouse scroll, and single-key actions. Posts and Notes have **mine/following/general** sub-tabs. Comments support full thread view with parent and child context.

[TUI guide &rarr;](docs/tui.md)

## MCP Server

Connect your Substack to Claude, GPT, or any AI agent via the [Model Context Protocol](https://modelcontextprotocol.io).

```bash
postcli-substack --mcp
```

**Claude Code** &mdash; add to `.claude/settings.json`:

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

**Claude Desktop** &mdash; add to `claude_desktop_config.json`:

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

16 tools available: read posts/notes/comments/feed, publish notes, reply, comment, react, restack, manage profiles.

[Full MCP reference &rarr;](docs/mcp.md)

## Automations

Local, SQLite-backed automation engine with deduplication. No cloud required.

```bash
# Built-in presets
postcli-substack auto presets

# Example: like back everyone who likes your notes
postcli-substack auto create
# > Preset: Like back who likes me
# > Created automation #1

# Run once or continuously
postcli-substack auto run 1
```

**Triggers**: someone likes my note, someone replies, new note from handle, new post from subdomain, cron interval

**Actions**: like back, reply with text, restack, follow, log

[Automations guide &rarr;](docs/automations.md)

## Programmatic API

Use the client directly in your own Node.js projects:

```typescript
import { SubstackClient } from '@postcli/substack/client';

const client = new SubstackClient({
  token: process.env.SUBSTACK_TOKEN,
  publicationUrl: 'https://yourpub.substack.com',
});

const posts = await client.listPosts({ limit: 5 });
await client.publishNote('Published via API');
await client.reactToComment(12345);
```

[API reference &rarr;](docs/api.md)

## Roadmap

- [x] Read posts, notes, comments, feed
- [x] Publish notes, reply, comment on posts
- [x] React (heart) and restack
- [x] Interactive TUI with 6 tabs
- [x] MCP Server for AI agents (16 tools)
- [x] Automation engine with presets
- [x] Thread view (parent + child context)
- [x] Profile feed (your activity)
- [ ] Publish full posts (draft + publish)
- [ ] Analytics dashboard (views, subscribers, revenue)
- [ ] Multi-account support
- [ ] Scheduled automations (background daemon)
- [ ] Webhook/notification integrations
- [ ] Windows support

## Authentication

PostCLI auto-grabs session cookies from Chrome. You must be logged into Substack in your browser.

```bash
postcli-substack auth login
```

Fallback options: email OTP or manual cookie paste from DevTools.

Credentials stored at `~/.config/postcli/.env` with `0600` permissions.

[Auth setup guide &rarr;](docs/auth.md)

## Contributing

Contributions welcome. Please open an issue first to discuss what you'd like to change.

```bash
git clone https://github.com/postcli/substack.git
cd substack
npm install
npm run build
npm test
```

## Disclaimer

This is an unofficial tool, not affiliated with or endorsed by Substack. It uses undocumented APIs that may change without notice. Use at your own risk.

## License

[AGPL-3.0](LICENSE)
