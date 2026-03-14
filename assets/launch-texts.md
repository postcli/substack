# Launch Texts

## Hacker News (Show HN)

**Title:** Show HN: PostCLI Substack – CLI, TUI and MCP Server for Substack

**Body:**
I built a CLI tool that lets you manage your Substack entirely from the terminal. Read posts, publish notes, automate engagement, browse your feed with a full TUI (6 tabs, keyboard-driven, mouse scroll).

The interesting part: it ships as an MCP Server with 16 tools, so Claude can read your Substack, publish notes, reply to comments, and manage automations on your behalf.

Built with TypeScript, Ink (React for terminals), SQLite for the automation engine, and the MCP SDK.

- npm install -g @postcli/substack
- GitHub: https://github.com/postcli/substack
- NPM: https://www.npmjs.com/package/@postcli/substack

What it does:
- CLI: postcli-substack notes publish "your note here"
- TUI: postcli-substack tui (full interactive terminal UI)
- MCP: plug into Claude Desktop or Claude Code for AI-powered Substack management
- Automations: auto-like back, auto-restack, watch specific authors

Auth uses your existing browser cookies (Chrome extraction built-in), no API keys needed.

Stack: TypeScript, Commander.js, Ink/React, better-sqlite3, @modelcontextprotocol/sdk

---

## Reddit r/commandline

**Title:** I built a full TUI + CLI for Substack with mouse scroll, vim keys, and 16 MCP tools for AI agents

**Body:**
Got tired of switching to the browser every time I wanted to check notes or publish something on Substack. Built postcli-substack: a CLI, interactive TUI, and MCP server all in one package.

The TUI has 6 tabs (Notes, Feed, Posts, Comments, Automations, Profile), supports j/k navigation, mouse wheel scrolling, and vim-style keybindings. The automation engine runs on SQLite and can auto-like-back, auto-restack, or watch specific authors.

The MCP server part is what makes it wild for AI users. Claude can browse your feed, publish notes, reply to comments, all through natural language.

`npm install -g @postcli/substack`

https://github.com/postcli/substack

---

## Reddit r/node

**Title:** @postcli/substack - Substack CLI + MCP Server built with Ink, Commander, and better-sqlite3

**Body:**
Just published @postcli/substack on NPM. It's a complete Substack client for the terminal: CLI commands, a React-based TUI (Ink), and an MCP server for AI agent integration.

Some technical highlights:
- Ink 6 with custom hooks for scrolling, list navigation, mouse wheel (SGR extended mode)
- better-sqlite3 for the automation engine (CRUD + deduplication with processed entity tracking)
- MCP SDK with 16 tools and Zod schemas
- Chrome cookie extraction with AES-128-CBC decryption for auth
- ProseMirror document generation for the Substack API
- 89 tests, CI on Node 18/20/22

`npm install -g @postcli/substack`

https://github.com/postcli/substack

---

## X/Twitter

**Post 1 (main launch):**
Just shipped @postcli/substack. Manage your entire Substack from the terminal.

CLI. TUI with 6 tabs. MCP Server with 16 tools for Claude.

Auto-like-back. Auto-restack. Watch authors. All from your keyboard.

npm install -g @postcli/substack

github.com/postcli/substack

[attach demo.gif]

**Post 2 (MCP angle):**
Built an MCP server for Substack. 16 tools. Claude can now read your feed, publish notes, reply to comments, manage automations.

"Hey Claude, like back everyone who liked my last note"

That's a real command that works.

github.com/postcli/substack

**Post 3 (thread - technical):**
Why I built a Substack CLI:

1/ The web UI is slow. The API is undocumented. I reverse-engineered everything from browser requests.

2/ Auth uses your existing Chrome cookies. No API key needed. AES-128-CBC decryption extracts them automatically.

3/ The TUI is built with React (Ink). Custom hooks for vim navigation, mouse wheel via SGR extended mode, scrollable content with visual scrollbar.

4/ The automation engine uses SQLite. Deduplicates with entity tracking so it never processes the same note twice.

5/ The MCP server turns Claude into a Substack power user. 16 tools, Zod schemas, stdio transport.

Open source. 89 tests. Ships today.

npm install -g @postcli/substack

---

## Dev.to

**Title:** I built an MCP Server that lets Claude manage your Substack

**Body:**

The Substack web UI is fine for casual use, but if you're a power user who publishes daily, manages engagement, and wants to automate interactions, you need something faster.

I built `@postcli/substack`, a tool that gives you three interfaces to Substack:

**1. CLI** - Direct commands from your terminal
```bash
postcli-substack notes publish "Shipping fast from the terminal"
postcli-substack posts list --limit 5
postcli-substack feed --tab for-you
```

**2. TUI** - Full interactive terminal UI with 6 tabs
```bash
postcli-substack tui
```
Navigate with j/k or arrow keys, scroll with mouse wheel, open posts in browser with 'o'. It's keyboard-driven and fast.

**3. MCP Server** - 16 tools for AI agents
```json
{
  "mcpServers": {
    "substack": {
      "command": "postcli-substack",
      "args": ["mcp"]
    }
  }
}
```

Tell Claude "like back everyone who liked my last note" and it just works.

### The automation engine

The part I'm most proud of is the automation engine. It uses SQLite to track processed entities (no duplicate actions) and supports triggers like:

- Someone likes your note → auto-like their latest note back
- New note from specific authors → auto-like or restack
- New post from specific publications → auto-restack

### Auth without API keys

Substack doesn't have a public API. Auth works by extracting your existing Chrome session cookies (AES-128-CBC decryption) or manual cookie entry.

```bash
postcli-substack auth login
```

### Install

```bash
npm install -g @postcli/substack
```

89 tests. CI on Node 18/20/22. Open source (AGPL-3.0).

GitHub: https://github.com/postcli/substack
NPM: https://www.npmjs.com/package/@postcli/substack

---

## Product Hunt

**Tagline:** Manage your Substack from the terminal. CLI, TUI, and MCP Server for AI agents.

**Description:**
PostCLI Substack brings your entire Substack workflow to the terminal. Three interfaces in one package:

CLI for quick commands (publish notes, list posts, manage engagement).
TUI for a full interactive experience with 6 tabs, vim keybindings, and mouse support.
MCP Server with 16 tools that lets Claude read your feed, publish notes, and automate engagement.

The automation engine auto-likes-back, auto-restacks, and watches specific authors. All powered by SQLite with entity deduplication.

No API key needed. Uses your existing browser session.

**First Comment:**
Hey PH! I built this because the Substack web UI felt slow for daily publishing. The MCP integration is where it gets interesting: you can tell Claude "publish a note about X" or "like back everyone who interacted with my last post" and it handles everything through 16 purpose-built tools. Would love feedback on the automation presets.
