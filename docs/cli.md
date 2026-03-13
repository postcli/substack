# CLI Reference

`postcli-substack` is the standalone binary for interacting with Substack from the terminal. All commands support the `--json` flag for machine-readable output.

```
postcli-substack [--json] <command> <subcommand> [options]
```

## Global Options

| Option | Description |
|--------|-------------|
| `-j, --json` | Output as JSON (for scripts and AI agents) |
| `-V, --version` | Print version |
| `-h, --help` | Show help |

---

## auth

Authentication management.

### auth login

Login via Chrome cookie grab (automatic) or email OTP (fallback).

```
postcli-substack auth login [options]
```

The CLI first checks Chrome's cookie database for an existing Substack session. If found and valid, it uses those cookies directly. If not found or expired, it falls back to email OTP login.

| Option | Description |
|--------|-------------|
| `-s, --subdomain <sub>` | Publication subdomain (for non-interactive/agent use) |

**Example:**

```bash
# Interactive login (auto-detects Chrome session)
postcli-substack auth login

# Non-interactive (for scripts)
postcli-substack auth login --subdomain myname
```

### auth setup

Configure credentials manually by pasting cookie values from browser DevTools.

```
postcli-substack auth setup
```

Prompts for `substack.sid`, `connect.sid`, and publication URL. No additional options.

**Example:**

```bash
postcli-substack auth setup
# substack.sid: s%3A...
# connect.sid: s%3A...
# Publication URL: https://myname.substack.com
```

### auth test

Verify that stored credentials are valid and working.

```
postcli-substack auth test
```

**Example:**

```bash
postcli-substack auth test
# Connected as John Doe (@johndoe)
```

### auth logout

Remove stored Substack credentials from all known .env locations.

```
postcli-substack auth logout
```

---

## posts

Manage posts.

### posts list

List posts from your publications or any publication by subdomain.

```
postcli-substack posts list [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-l, --limit <n>` | Number of posts to return | `10` |
| `-o, --offset <n>` | Offset for pagination | `0` |
| `-s, --subdomain <sub>` | Fetch from a specific publication | own publications |
| `-p, --profile <sub>` | Filter to one of your publications | all |

When no `--subdomain` or `--profile` is given, the CLI fetches posts from all your publications and merges them sorted by date.

**Example:**

```bash
# List your latest 10 posts
postcli-substack posts list

# List 20 posts from a specific publication
postcli-substack posts list --subdomain nicolascole77 --limit 20

# JSON output for scripting
postcli-substack --json posts list --limit 5
```

### posts get

Get the full content of a post by slug or numeric ID.

```
postcli-substack posts get [options]
```

| Option | Description |
|--------|-------------|
| `--slug <slug>` | Post slug (from the URL) |
| `--id <id>` | Post numeric ID |
| `-s, --subdomain <sub>` | Publication subdomain (defaults to own) |

One of `--slug` or `--id` is required.

**Example:**

```bash
# By slug
postcli-substack posts get --slug my-first-post

# By ID from another publication
postcli-substack posts get --id 12345 --subdomain nicolascole77

# JSON output includes full HTML body
postcli-substack --json posts get --slug my-first-post
```

### posts react

React to a post (heart/like).

```
postcli-substack posts react <post-id> [options]
```

| Argument | Description |
|----------|-------------|
| `post-id` | Numeric post ID |

| Option | Description |
|--------|-------------|
| `-s, --subdomain <sub>` | Publication subdomain (defaults to own) |

**Example:**

```bash
postcli-substack posts react 12345
# Reacted!
```

### posts restack

Restack (share) a post to your feed.

```
postcli-substack posts restack <post-id>
```

| Argument | Description |
|----------|-------------|
| `post-id` | Numeric post ID |

**Example:**

```bash
postcli-substack posts restack 12345
# Restacked!
```

---

## notes

Manage notes.

### notes list

List notes from your feed.

```
postcli-substack notes list [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-l, --limit <n>` | Number of notes | `10` |

**Example:**

```bash
postcli-substack notes list --limit 20
```

### notes publish

Publish a new note. Supports basic markdown (`**bold**`).

```
postcli-substack notes publish <text>
```

| Argument | Description |
|----------|-------------|
| `text` | Note content (supports `**bold**`) |

**Example:**

```bash
postcli-substack notes publish "Just shipped a new feature!"
# Note published (id: 98765)
```

### notes reply

Reply to a note.

```
postcli-substack notes reply <note-id> <text>
```

| Argument | Description |
|----------|-------------|
| `note-id` | Numeric note ID |
| `text` | Reply content |

**Example:**

```bash
postcli-substack notes reply 98765 "Great insight, thanks for sharing"
# Reply posted (id: 98766)
```

### notes react

React to a note (heart/like).

```
postcli-substack notes react <note-id>
```

| Argument | Description |
|----------|-------------|
| `note-id` | Numeric note ID |

**Example:**

```bash
postcli-substack notes react 98765
# Reacted!
```

### notes restack

Restack a note.

```
postcli-substack notes restack <note-id>
```

| Argument | Description |
|----------|-------------|
| `note-id` | Numeric note ID |

**Example:**

```bash
postcli-substack notes restack 98765
# Restacked!
```

---

## comments

Manage comments on posts.

### comments list

List comments for a post.

```
postcli-substack comments list <post-id> [options]
```

| Argument | Description |
|----------|-------------|
| `post-id` | Numeric post ID |

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --subdomain <sub>` | Publication subdomain | own |
| `-l, --limit <n>` | Number of comments | `20` |

**Example:**

```bash
postcli-substack comments list 12345 --limit 10

# JSON output
postcli-substack --json comments list 12345
```

### comments add

Comment on a post.

```
postcli-substack comments add <post-id> <text> [options]
```

| Argument | Description |
|----------|-------------|
| `post-id` | Numeric post ID |
| `text` | Comment text |

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --subdomain <sub>` | Publication subdomain | own |

**Example:**

```bash
postcli-substack comments add 12345 "This was really helpful"
# Comment posted (id: 54321)
```

### comments react

React to a comment (heart/like).

```
postcli-substack comments react <comment-id>
```

| Argument | Description |
|----------|-------------|
| `comment-id` | Numeric comment ID |

**Example:**

```bash
postcli-substack comments react 54321
# Reacted!
```

---

## profile

Profile operations.

### profile me

Show your own Substack profile.

```
postcli-substack profile me
```

**Example:**

```bash
postcli-substack profile me
# John Doe (@johndoe)
# Bio: Writer, developer, ...
# Publications:
#   johndoe.substack.com (admin)

postcli-substack --json profile me
```

### profile get

Get any profile by publication subdomain.

```
postcli-substack profile get <subdomain>
```

| Argument | Description |
|----------|-------------|
| `subdomain` | Publication subdomain (e.g. `nicolascole77`) |

**Example:**

```bash
postcli-substack profile get nicolascole77
```

---

## feed

Reader feed operations.

### feed list

Show your Substack reader feed (notes, posts, restacks).

```
postcli-substack feed list [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --tab <tab>` | Feed tab: `for-you`, `subscribed`, or a category slug | default feed |

**Example:**

```bash
# Default feed
postcli-substack feed list

# Only subscribed content
postcli-substack feed list --tab subscribed

# JSON output
postcli-substack --json feed list --tab for-you
```

---

## auto

Manage automations. See [automations.md](automations.md) for full details.

### auto list

List all automations.

```
postcli-substack auto list
```

### auto create

Create an automation from a preset.

```
postcli-substack auto create <name> [options]
```

| Argument | Description |
|----------|-------------|
| `name` | Automation name |

| Option | Description | Default |
|--------|-------------|---------|
| `--preset <n>` | Preset number (1-4) | `1` |

**Example:**

```bash
postcli-substack auto create "Like fans" --preset 1
# Created automation #1: Like fans
```

### auto toggle

Enable or disable an automation.

```
postcli-substack auto toggle <id>
```

| Argument | Description |
|----------|-------------|
| `id` | Automation numeric ID |

### auto run

Run an automation once (manually).

```
postcli-substack auto run <id>
```

| Argument | Description |
|----------|-------------|
| `id` | Automation numeric ID |

**Example:**

```bash
postcli-substack auto run 1
# Executed 3 action(s)
```

### auto remove

Delete an automation.

```
postcli-substack auto remove <id>
```

| Argument | Description |
|----------|-------------|
| `id` | Automation numeric ID |

### auto presets

Show available automation presets.

```
postcli-substack auto presets
```

**Example:**

```bash
postcli-substack auto presets
# 1. Like back who likes me
#    trigger: someone_likes_my_note | actions: like_back
# 2. Like + reply to likes
#    trigger: someone_likes_my_note | actions: like_back + reply
# 3. Auto-like notes from handles
#    trigger: new_note_from | actions: like_note
# 4. Auto-like + restack new posts
#    trigger: new_post_from | actions: like_note + restack
```

---

## tui

Launch the interactive terminal UI. See [tui.md](tui.md) for full details.

```
postcli-substack tui
```

---

## MCP Server Mode

Start the MCP server (for AI agent integrations). See [mcp.md](mcp.md) for full details.

```
postcli-substack --mcp
```
