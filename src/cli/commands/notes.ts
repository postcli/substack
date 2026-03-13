import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, parsePositiveInt } from '../../client.js';
import { formatNote, separator } from '../formatters.js';

export const notesCommand = new Command('notes').description('Manage notes');

notesCommand
  .command('list')
  .description('List notes from your feed')
  .option('-l, --limit <n>', 'Number of notes', '10')
  .action(async function (this: Command, opts) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const limit = parsePositiveInt(opts.limit, 'limit');
      const notes = await client.listNotes({ limit });

      if (json) {
        console.log(JSON.stringify(notes.map((n) => ({
          id: n.id,
          body: n.body,
          author: n.author,
          publishedAt: n.publishedAt,
          reactions: n.reactions,
          childrenCount: n.childrenCount,
        })), null, 2));
        return;
      }

      if (notes.length === 0) {
        console.log(chalk.dim('No notes found.'));
        return;
      }
      for (const note of notes) {
        console.log(formatNote(note));
        console.log(separator());
      }
      console.log(chalk.dim(`${notes.length} note(s)`));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('publish <text>')
  .description('Publish a new note')
  .action(async function (this: Command, text) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const result = await client.publishNote(text);

      if (json) {
        console.log(JSON.stringify(result));
        return;
      }

      console.log(chalk.green(`Note published (id: ${result.id})`));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('reply <note-id> <text>')
  .description('Reply to a note')
  .action(async function (this: Command, noteId, text) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(noteId, 'note ID');
      const result = await client.replyToNote(id, text);

      if (json) {
        console.log(JSON.stringify(result));
        return;
      }

      console.log(chalk.green(`Reply posted (id: ${result.id})`));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('react <note-id>')
  .description('React to a note (heart)')
  .action(async function (this: Command, noteId) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(noteId, 'note ID');
      await client.reactToComment(id);

      if (json) {
        console.log(JSON.stringify({ ok: true }));
        return;
      }

      console.log(chalk.green('Reacted!'));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('restack <note-id>')
  .description('Restack a note')
  .action(async function (this: Command, noteId) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(noteId, 'note ID');
      await client.restackNote(id);

      if (json) {
        console.log(JSON.stringify({ ok: true }));
        return;
      }

      console.log(chalk.green('Restacked!'));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
