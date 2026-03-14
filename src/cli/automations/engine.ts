import Database from 'better-sqlite3';
import { resolve } from 'path';
import { getConfigDir } from '../../client.js';
import type { SubstackClient } from '../../lib/substack.js';

export interface Automation {
  id: number;
  name: string;
  trigger: AutoTrigger;
  actions: AutoAction[];
  enabled: boolean;
  lastRun: string | null;
  runCount: number;
}

export type AutoTrigger =
  | { type: 'someone_likes_my_note' }
  | { type: 'someone_replies_to_me' }
  | { type: 'new_note_from'; handles: string[] }
  | { type: 'new_post_from'; subdomains: string[] }
  | { type: 'cron'; intervalMinutes: number };

export type AutoAction =
  | { type: 'like_back' }
  | { type: 'reply'; text: string }
  | { type: 'restack' }
  | { type: 'follow' }
  | { type: 'like_note'; noteId?: number }
  | { type: 'log' };

interface AutomationRow {
  id: number;
  name: string;
  trigger_json: string;
  actions_json: string;
  enabled: number;
  last_run: string | null;
  run_count: number;
}

interface ProcessedRow {
  id: number;
  entity_id: number;
  automation_id: number;
  processed_at: string;
}

export class AutomationEngine {
  private db: Database.Database;
  private client: SubstackClient;
  private timers: Map<number, ReturnType<typeof setInterval>> = new Map();

  constructor(client: SubstackClient) {
    this.client = client;
    const dbPath = resolve(getConfigDir(), 'automations.db');
    this.db = new Database(dbPath);
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS automations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        trigger_json TEXT NOT NULL,
        actions_json TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        last_run TEXT,
        run_count INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS processed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_id INTEGER NOT NULL,
        automation_id INTEGER NOT NULL,
        processed_at TEXT DEFAULT (datetime('now')),
        UNIQUE(entity_id, automation_id)
      );
    `);
  }

  private rowToAutomation(row: AutomationRow): Automation {
    return {
      id: row.id,
      name: row.name,
      trigger: JSON.parse(row.trigger_json),
      actions: JSON.parse(row.actions_json),
      enabled: !!row.enabled,
      lastRun: row.last_run,
      runCount: row.run_count,
    };
  }

  list(): Automation[] {
    const rows = this.db.prepare('SELECT * FROM automations ORDER BY id').all() as AutomationRow[];
    return rows.map((r) => this.rowToAutomation(r));
  }

  get(id: number): Automation | null {
    const row = this.db.prepare('SELECT * FROM automations WHERE id = ?').get(id) as AutomationRow | undefined;
    return row ? this.rowToAutomation(row) : null;
  }

  create(name: string, trigger: AutoTrigger, actions: AutoAction[]): Automation {
    const stmt = this.db.prepare(
      'INSERT INTO automations (name, trigger_json, actions_json) VALUES (?, ?, ?)'
    );
    const result = stmt.run(name, JSON.stringify(trigger), JSON.stringify(actions));
    return this.get(result.lastInsertRowid as number)!;
  }

  toggle(id: number): boolean {
    const auto = this.get(id);
    if (!auto) return false;
    const newEnabled = auto.enabled ? 0 : 1;
    this.db.prepare('UPDATE automations SET enabled = ? WHERE id = ?').run(newEnabled, id);
    if (!newEnabled) this.stopTimer(id);
    return true;
  }

  remove(id: number): boolean {
    this.stopTimer(id);
    this.db.prepare('DELETE FROM processed WHERE automation_id = ?').run(id);
    const result = this.db.prepare('DELETE FROM automations WHERE id = ?').run(id);
    return result.changes > 0;
  }

  private isProcessed(entityId: number, automationId: number): boolean {
    const row = this.db.prepare(
      'SELECT 1 FROM processed WHERE entity_id = ? AND automation_id = ?'
    ).get(entityId, automationId);
    return !!row;
  }

  private markProcessed(entityId: number, automationId: number) {
    this.db.prepare(
      'INSERT OR IGNORE INTO processed (entity_id, automation_id) VALUES (?, ?)'
    ).run(entityId, automationId);
  }

  private updateRunStats(id: number) {
    this.db.prepare(
      "UPDATE automations SET last_run = datetime('now'), run_count = run_count + 1 WHERE id = ?"
    ).run(id);
  }

  /** Run a single automation once, return count of actions executed */
  async runOnce(id: number): Promise<{ executed: number; errors: string[] }> {
    const auto = this.get(id);
    if (!auto) return { executed: 0, errors: ['Automation not found'] };

    let executed = 0;
    const errors: string[] = [];

    try {
      switch (auto.trigger.type) {
        case 'someone_likes_my_note':
          executed += await this.handleLikesBack(auto, errors);
          break;
        case 'someone_replies_to_me':
          executed += await this.handleRepliesBack(auto, errors);
          break;
        case 'new_note_from':
          executed += await this.handleNewNoteFrom(auto, errors);
          break;
        case 'new_post_from':
          executed += await this.handleNewPostFrom(auto, errors);
          break;
        case 'cron':
          for (const action of auto.actions) {
            await this.executeAction(action, {});
            executed++;
          }
          break;
      }
    } catch (err: any) {
      errors.push(err.message);
    }

    if (executed > 0) this.updateRunStats(id);
    return { executed, errors };
  }

  private async handleLikesBack(auto: Automation, errors: string[]): Promise<number> {
    let executed = 0;
    const feed = await this.client.getFeed({});
    const likes = feed.items.filter(
      (i) => i.type === 'comment' && i.context?.type === 'comment_like'
    );

    for (const item of likes) {
      const noteId = item.comment?.id;
      if (!noteId || this.isProcessed(noteId, auto.id)) continue;

      for (const action of auto.actions) {
        try {
          await this.executeAction(action, { noteId, item });
          executed++;
        } catch (err: any) {
          errors.push(`${action.type}: ${err.message}`);
        }
      }
      this.markProcessed(noteId, auto.id);
    }
    return executed;
  }

  private async handleRepliesBack(auto: Automation, errors: string[]): Promise<number> {
    let executed = 0;
    // Fetch own profile feed to find notes that have new replies
    const profile = await this.client.ownProfile();
    const profileFeed = await this.client.getProfileFeed(profile.id);
    const myNotes = profileFeed.items.filter(
      (i) => i.type === 'comment' && i.context?.typeBucket === 'notes' && i.comment
    );

    for (const item of myNotes) {
      const noteId = item.comment?.id;
      if (!noteId || !(item.comment?.children_count ?? 0)) continue;

      // Check each reply (child) on this note
      try {
        const repliesData = await this.client.getCommentReplies(noteId);
        for (const branch of repliesData.branches) {
          const replyId = branch.comment?.id;
          if (!replyId || this.isProcessed(replyId, auto.id)) continue;
          // Skip own replies
          if (branch.comment?.user_id === profile.id) continue;

          for (const action of auto.actions) {
            try {
              await this.executeAction(action, { noteId: replyId, item });
              executed++;
            } catch (err: any) {
              errors.push(`${action.type}: ${err.message}`);
            }
          }
          this.markProcessed(replyId, auto.id);
        }
      } catch {
        // replies fetch may fail, skip
      }
    }
    return executed;
  }

  private async handleNewNoteFrom(auto: Automation, errors: string[]): Promise<number> {
    let executed = 0;
    const handles = (auto.trigger as any).handles ?? [];
    const feed = await this.client.getFeed({});
    const notes = feed.items.filter((i) => {
      if (i.type !== 'comment' || i.context?.typeBucket !== 'notes') return false;
      const handle = i.context?.users?.[0]?.handle ?? i.comment?.handle;
      return handle && handles.includes(handle);
    });

    for (const item of notes) {
      const noteId = item.comment?.id;
      if (!noteId || this.isProcessed(noteId, auto.id)) continue;

      for (const action of auto.actions) {
        try {
          await this.executeAction(action, { noteId, item });
          executed++;
        } catch (err: any) {
          errors.push(`${action.type}: ${err.message}`);
        }
      }
      this.markProcessed(noteId, auto.id);
    }
    return executed;
  }

  private async handleNewPostFrom(auto: Automation, errors: string[]): Promise<number> {
    let executed = 0;
    const subdomains = (auto.trigger as any).subdomains ?? [];

    for (const sub of subdomains) {
      try {
        const posts = await this.client.listPosts({ subdomain: sub, limit: 5 });
        for (const post of posts) {
          if (this.isProcessed(post.id, auto.id)) continue;

          for (const action of auto.actions) {
            try {
              await this.executeAction(action, { postId: post.id, subdomain: sub });
              executed++;
            } catch (err: any) {
              errors.push(`${action.type}: ${err.message}`);
            }
          }
          this.markProcessed(post.id, auto.id);
        }
      } catch (err: any) {
        errors.push(`fetch ${sub}: ${err.message}`);
      }
    }
    return executed;
  }

  private async executeAction(
    action: AutoAction,
    ctx: { noteId?: number; postId?: number; subdomain?: string; item?: any }
  ) {
    switch (action.type) {
      case 'like_back': {
        // Find the liker's user ID from the feed item context, then like their latest note
        const likerId = ctx.item?.context?.users?.[0]?.id;
        if (likerId) {
          try {
            const likerFeed = await this.client.getProfileFeed(likerId);
            const likerNote = likerFeed.items.find(
              (i: any) => i.type === 'comment' && i.context?.typeBucket === 'notes' && i.comment?.id
            );
            if (likerNote?.comment?.id) {
              await this.client.reactToComment(likerNote.comment.id);
            }
          } catch {
            // fallback: like the note that was liked (better than nothing)
            if (ctx.noteId) await this.client.reactToComment(ctx.noteId);
          }
        }
        break;
      }
      case 'like_note':
        if (ctx.noteId) await this.client.reactToComment(ctx.noteId);
        break;
      case 'reply':
        if (ctx.noteId) await this.client.replyToNote(ctx.noteId, action.text);
        break;
      case 'restack':
        if (ctx.noteId) await this.client.restackNote(ctx.noteId);
        else if (ctx.postId) await this.client.restackPost(ctx.postId);
        break;
      case 'follow':
        console.warn('[auto] "follow" action is not yet implemented, skipping');
        break;
      case 'log':
        // No-op for now
        break;
    }
  }

  /** Start background polling for all enabled cron-type automations */
  startAll() {
    for (const auto of this.list()) {
      if (auto.enabled && auto.trigger.type === 'cron') {
        this.startTimer(auto);
      }
    }
  }

  private startTimer(auto: Automation) {
    if (this.timers.has(auto.id)) return;
    const interval = ((auto.trigger as any).intervalMinutes ?? 30) * 60 * 1000;
    const timer = setInterval(() => {
      this.runOnce(auto.id).catch(() => {});
    }, interval);
    this.timers.set(auto.id, timer);
  }

  private stopTimer(id: number) {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  stopAll() {
    for (const [id] of this.timers) {
      this.stopTimer(id);
    }
  }

  close() {
    this.stopAll();
    this.db.close();
  }

  // ── Preset automations ───────────────────────────

  static PRESETS = [
    {
      name: 'Like back who likes me',
      trigger: { type: 'someone_likes_my_note' as const },
      actions: [{ type: 'like_back' as const }],
    },
    {
      name: 'Like + reply to likes',
      trigger: { type: 'someone_likes_my_note' as const },
      actions: [
        { type: 'like_back' as const },
        { type: 'reply' as const, text: 'Thanks!' },
      ],
    },
    {
      name: 'Auto-like notes from handles',
      trigger: { type: 'new_note_from' as const, handles: [] },
      actions: [{ type: 'like_note' as const }],
      requiresInput: 'handles' as const,
    },
    {
      name: 'Auto-like + restack new posts',
      trigger: { type: 'new_post_from' as const, subdomains: [] },
      actions: [
        { type: 'like_note' as const },
        { type: 'restack' as const },
      ],
      requiresInput: 'subdomains' as const,
    },
  ];
}
