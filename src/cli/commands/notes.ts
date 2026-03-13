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
