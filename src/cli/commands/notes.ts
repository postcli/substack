import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, collectAsync } from '../../client.js';
import { formatNote, separator } from '../formatters.js';

export const notesCommand = new Command('notes').description('Manage notes');

notesCommand
  .command('list')
  .description('List notes')
  .option('-l, --limit <n>', 'Number of notes', '10')
  .option('-s, --slug <slug>', 'Profile slug (defaults to own profile)')
  .action(async (opts) => {
    try {
      const client = getClient();
      const limit = parseInt(opts.limit);
      let profile;
      if (opts.slug) {
        profile = await client.profileForSlug(opts.slug);
      } else {
        profile = await client.ownProfile();
      }
      const notes = await collectAsync(profile.notes({ limit }), limit);
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
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('get <id>')
  .description('Get note by ID')
  .action(async (id) => {
    try {
      const client = getClient();
      const note = await client.noteForId(parseInt(id));
      console.log(`${chalk.cyan(`@${note.author.handle}`)} ${chalk.gray(note.publishedAt.toLocaleDateString())}`);
      console.log(note.body);
      console.log(`\n${chalk.red('♥')} ${note.likesCount}`);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

notesCommand
  .command('publish <text>')
  .description('Publish a new note')
  .option('--link <url>', 'Attach a link URL')
  .action(async (text, opts) => {
    try {
      const client = getClient();
      const profile = await client.ownProfile();
      const attachment = opts.link || undefined;
      const result = await profile.publishNote(text, { attachment });
      console.log(chalk.green(`Note published! ID: ${result.id}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
