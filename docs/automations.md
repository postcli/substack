# Automations Reference

The automation engine runs locally, backed by SQLite. It monitors your Substack feed for events and executes actions in response.

## Storage

- Database: `~/.config/postcli/automations.db`
- Two tables: `automations` (rules) and `processed` (deduplication)

## Triggers

| Trigger | Description | Parameters |
|---------|-------------|------------|
| `someone_likes_my_note` | Fires when someone likes one of your notes | none |
| `someone_replies_to_me` | Fires when someone replies to your notes/comments | none |
| `new_note_from` | Fires when specific users publish a new note | `handles: string[]` |
| `new_post_from` | Fires when specific publications publish a new post | `subdomains: string[]` |
| `cron` | Fires on a time interval (for background polling) | `intervalMinutes: number` |

## Actions

| Action | Description | Parameters |
|--------|-------------|------------|
| `like_back` | Like the note/comment that triggered the event | none |
| `reply` | Reply with a text message | `text: string` |
| `restack` | Restack the note or post | none |
| `follow` | Follow the author (not yet implemented) | none |
| `like_note` | Like a specific note | `noteId?: number` (optional, uses context) |
| `log` | No-op placeholder for logging | none |

## Presets

Four built-in presets are available:

| # | Name | Trigger | Actions |
|---|------|---------|---------|
| 1 | Like back who likes me | `someone_likes_my_note` | `like_back` |
| 2 | Like + reply to likes | `someone_likes_my_note` | `like_back`, `reply("Thanks!")` |
| 3 | Auto-like notes from handles | `new_note_from(handles)` | `like_note` |
| 4 | Auto-like + restack new posts | `new_post_from(subdomains)` | `like_note`, `restack` |

## CLI Usage

```bash
# List all automations
postcli-substack auto list

# Show available presets
postcli-substack auto presets

# Create from preset 1
postcli-substack auto create "Like fans" --preset 1

# Create from preset 2
postcli-substack auto create "Thank likers" --preset 2

# Toggle on/off
postcli-substack auto toggle 1

# Run manually
postcli-substack auto run 1

# Delete
postcli-substack auto remove 1
```

## TUI Usage

In the TUI (`postcli-substack tui`), the Auto tab provides a visual interface:

| Key | Action |
|-----|--------|
| `Enter` | Toggle automation on/off |
| `n` | Create new from presets |
| `d` | Delete selected |
| `x` | Run now |

## How It Works

### Execution Flow

1. **Trigger evaluation** - The engine fetches your reader feed or publication archives depending on the trigger type.
2. **Deduplication** - Each entity (note ID, post ID) is checked against the `processed` table. Already-seen entities are skipped.
3. **Action execution** - For each new matching entity, all configured actions run sequentially.
4. **Mark processed** - The entity is recorded in the `processed` table with its automation ID to prevent duplicate processing.
5. **Stats update** - The automation's `run_count` and `last_run` timestamp are updated.

### Deduplication

The `processed` table stores `(entity_id, automation_id)` pairs with a unique constraint. This means:

- The same note/post is only processed once per automation.
- Different automations can independently process the same entity.
- Deduplication persists across runs (stored in SQLite).
- Deleting an automation also removes its processed entries.

### Trigger Details

**someone_likes_my_note**: Scans the reader feed for items where `type=comment` and `context.type=comment_like`. Each unique `comment.id` from the feed triggers the configured actions.

**someone_replies_to_me**: Scans the reader feed for items where `type=comment`, `context.type=note`, and the comment has children. Each unique comment ID triggers actions.

**new_note_from**: Scans the reader feed for items where `type=comment` and `context.typeBucket=notes`, filtering by author handle against the configured `handles[]` list.

**new_post_from**: For each configured subdomain, fetches the 5 most recent posts from their archive. Each unseen post triggers actions.

**cron**: When used with `startAll()`, creates an interval timer that calls `runOnce()` at the configured frequency. The cron trigger simply executes its actions without fetching any feed data.

### Background Polling

The `startAll()` method starts interval timers for all enabled cron-type automations. The `stopAll()` method clears all timers. The TUI does not currently auto-start background polling. Use `auto run <id>` for on-demand execution.

## Creating Custom Automations

Presets 3 and 4 ship with empty `handles[]` and `subdomains[]` arrays. After creating them, edit the SQLite database directly to customize:

```bash
sqlite3 ~/.config/postcli/automations.db

-- View current automations
SELECT id, name, trigger_json, actions_json FROM automations;

-- Update handles for a "new_note_from" automation
UPDATE automations
SET trigger_json = '{"type":"new_note_from","handles":["nicolascole77","lenny"]}'
WHERE id = 3;

-- Update subdomains for a "new_post_from" automation
UPDATE automations
SET trigger_json = '{"type":"new_post_from","subdomains":["platformer","stratechery"]}'
WHERE id = 4;

-- Create a fully custom automation
INSERT INTO automations (name, trigger_json, actions_json)
VALUES (
  'Restack and like posts from favorites',
  '{"type":"new_post_from","subdomains":["platformer","stratechery"]}',
  '[{"type":"like_note"},{"type":"restack"}]'
);
```

## Programmatic Usage

```typescript
import { SubstackClient } from '@postcli/substack/client';
import { AutomationEngine } from '@postcli/substack'; // from dist

const client = new SubstackClient({ token: '...', publicationUrl: '...' });
const engine = new AutomationEngine(client);

// Create
const auto = engine.create('My rule', { type: 'someone_likes_my_note' }, [{ type: 'like_back' }]);

// Run
const result = await engine.runOnce(auto.id);
console.log(`Executed ${result.executed} actions, ${result.errors.length} errors`);

// Cleanup
engine.close();
```
