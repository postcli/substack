import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, collectAsync, parsePositiveInt } from '../../client.js';
import { formatComment, separator } from '../formatters.js';

export const commentsCommand = new Command('comments').description('Manage comments');

commentsCommand
  .command('list <post-id>')
  .description('List comments for a post')
  .option('-l, --limit <n>', 'Number of comments', '20')
  .action(async (postId, opts) => {
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      const limit = parsePositiveInt(opts.limit, 'limit');
      const post = await client.postForId(id);
      const comments = await collectAsync(post.comments({ limit }), limit);
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
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

commentsCommand
  .command('add <post-id> <text>')
  .description('Add a comment to a post')
  .action(async (postId, text) => {
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      const post = await client.postForId(id);
      const comment = await post.addComment({ body: text });
      console.log(chalk.green(`Comment added! ID: ${comment.id}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
