import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, parsePositiveInt } from '../../client.js';
import { formatComment, separator } from '../formatters.js';

export const commentsCommand = new Command('comments').description('Manage comments');

commentsCommand
  .command('list <post-id>')
  .description('List comments for a post')
  .option('-l, --limit <n>', 'Number of comments', '20')
  .option('-s, --subdomain <sub>', 'Publication subdomain (defaults to own)')
  .action(async function (this: Command, postId, opts) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      const limit = parsePositiveInt(opts.limit, 'limit');
      const comments = await client.listComments(id, { subdomain: opts.subdomain, limit });

      if (json) {
        console.log(JSON.stringify(comments.map((c) => ({
          id: c.id,
          body: c.body,
          authorName: c.authorName,
          authorId: c.authorId,
          date: c.date,
          reactions: c.reactions,
          childrenCount: c.childrenCount,
        })), null, 2));
        return;
      }

      if (comments.length === 0) {
        console.log(chalk.dim('No comments found.'));
        return;
      }
      for (const comment of comments) {
        console.log(formatComment(comment));
        console.log(separator());
      }
      console.log(chalk.dim(`${comments.length} comment(s)`));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

commentsCommand
  .command('add <post-id> <text>')
  .description('Comment on a post')
  .option('-s, --subdomain <sub>', 'Publication subdomain (defaults to own)')
  .action(async function (this: Command, postId, text, opts) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      const result = await client.commentOnPost(id, text, opts.subdomain);

      if (json) {
        console.log(JSON.stringify(result));
        return;
      }

      console.log(chalk.green(`Comment posted (id: ${result.id})`));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

commentsCommand
  .command('react <comment-id>')
  .description('React to a comment (heart)')
  .action(async function (this: Command, commentId) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(commentId, 'comment ID');
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
