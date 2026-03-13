# TUI Reference

The interactive terminal UI provides a tabbed interface for browsing and interacting with Substack content.

```bash
postcli-substack tui
```

## Global Keys

| Key | Action |
|-----|--------|
| `1`-`6` | Switch to tab by number |
| `Tab` | Cycle to next tab |
| `q` | Quit (or go back from detail views) |
| Mouse scroll | Supported for scrolling lists |

## Tabs

The TUI has 6 tabs displayed in the header bar:

| # | Tab | Label |
|---|-----|-------|
| 1 | posts | Posts |
| 2 | notes | Notes |
| 3 | comments | Comments |
| 4 | feed | Feed |
| 5 | auto | Auto |
| 6 | profile | Me |

---

## 1. Posts

Browse posts with a columnar table view showing publication, date, likes, comments, word count, and title/subtitle.

### Sub-tabs

Switch between sub-tabs with left/right arrow keys.

| Sub-tab | Description |
|---------|-------------|
| `mine` | Posts from all your publications, sorted by date |
| `following` | Posts from your subscribed feed |
| `general` | Posts from the "for you" feed |

### Keys

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate post list |
| `Left/Right` | Switch sub-tab |
| `Enter` | Open post detail view |
| `o` | Open post URL in browser |
| `r` | Refresh list |

### Post Detail View

When you press `Enter` on a post, you enter a scrollable full-content reader.

| Key | Action |
|-----|--------|
| `Up/Down` | Scroll content |
| `d/u` | Page down / page up |
| `o` | Open in browser |
| `q` or `Esc` | Go back to list |

---

## 2. Notes

Browse notes in a columnar table view showing author, date, likes, reply count, and body text.

### Sub-tabs

Switch between sub-tabs with left/right arrow keys.

| Sub-tab | Description |
|---------|-------------|
| `mine` | Your own notes (fetched from your profile feed) |
| `following` | Notes from people you follow (default) |
| `general` | Notes from the "for you" feed |

### Keys

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate note list |
| `Left/Right` | Switch sub-tab |
| `l` | Like the selected note |
| `s` | Restack the selected note |
| `c` | Reply to the selected note (opens inline input) |
| `o` | Open note URL in browser |
| `r` | Refresh list |

### Reply Input

When you press `c`, an inline reply input appears at the bottom.

| Key | Action |
|-----|--------|
| Type | Enter reply text |
| `Enter` | Send reply |
| `Esc` | Cancel reply |
| `Backspace` | Delete character |

---

## 3. Comments

Browse your own comments and notes in a table view showing author, date, likes, replies, type, and body.

### Keys

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate comment list |
| `Enter` | Open thread view for the selected comment |
| `l` | Like the selected comment |
| `c` | Reply to the selected comment |
| `r` | Refresh list |

### Thread View

When you press `Enter`, you enter a scrollable thread showing the full comment chain: parent comments above, your comment highlighted, and replies below.

| Key | Action |
|-----|--------|
| `Up/Down` | Scroll through thread |
| `c` | Reply to the comment |
| `l` | Like the comment |
| `q` or `Esc` | Go back to comment list |

---

## 4. Feed

Browse your Substack reader feed showing all activity types (notes, posts, restacks, likes).

Each item shows author handle, context type, timestamp, and body/title preview.

### Keys

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate feed items |
| `l` | Like the selected item (if it has a comment/note) |
| `s` | Restack the selected item |
| `o` | Open in browser |
| `r` | Refresh feed |

---

## 5. Auto (Automations)

Manage your automation rules. See [automations.md](automations.md) for details on triggers and actions.

Each automation shows its enabled/disabled status, name, trigger, actions, run count, and last run time.

### Keys

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate automation list |
| `Enter` | Toggle automation on/off |
| `n` | Create new automation from presets |
| `d` | Delete the selected automation |
| `x` | Run the selected automation now |

### Preset Selection

When you press `n`, a preset picker appears.

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate presets |
| `Enter` | Create automation from selected preset |
| `q` or `Esc` | Cancel |

---

## 6. Profile

Displays your Substack profile: name, handle, bio, and publications list with subdomain and role.

This tab is read-only with no interactive actions beyond the global keys.

---

## UI Details

The TUI is built with [Ink](https://github.com/vadimdemedes/ink) (React for CLIs). It adapts to terminal size, renders scrollbars for long lists, and shows toast notifications for action results (likes, restacks, replies).

Status messages appear in the header bar next to the "PostCLI substack" title.
