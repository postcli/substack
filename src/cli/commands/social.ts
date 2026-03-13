import { Command } from 'commander';
import chalk from 'chalk';
import { getClient } from '../../client.js';
import { formatDate } from '../formatters.js';

export const socialCommand = new Command('feed').description('Reader feed');

socialCommand
  .command('list')
  .description('Show your reader feed')
  .option('-t, --tab <tab>', 'Feed tab: for-you, subscribed, or category slug')
  .action(async function (this: Command, opts) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const feed = await client.getFeed({ tab: opts.tab });

      if (json) {
        console.log(JSON.stringify({
          items: feed.items.map((i) => ({
            entityKey: i.entity_key,
            type: i.type,
            contextType: i.context?.type,
            timestamp: i.context?.timestamp,
            authorName: i.context?.users?.[0]?.name,
            authorHandle: i.context?.users?.[0]?.handle,
            body: i.comment?.body,
            postTitle: i.post?.title,
            postSlug: i.post?.slug,
          })),
          nextCursor: feed.nextCursor,
        }, null, 2));
        return;
      }

      if (feed.items.length === 0) {
        console.log(chalk.dim('Feed is empty.'));
        return;
      }
      for (const item of feed.items) {
        const author = item.context?.users?.[0];
        const ts = item.context?.timestamp ? new Date(item.context.timestamp) : null;
        const type = `${item.type}${item.context?.type ? ':' + item.context.type : ''}`;
        let line = `${chalk.dim(type)} `;
        if (author) line += `${chalk.cyan(`@${author.handle}`)} `;
        if (ts) line += chalk.gray(formatDate(ts));
        console.log(line);
        if (item.comment?.body) {
          const body = item.comment.body.length > 200 ? item.comment.body.slice(0, 200) + '...' : item.comment.body;
          console.log(`  ${body}`);
        }
        if (item.post?.title) {
          console.log(`  ${chalk.bold(item.post.title)}`);
        }
        console.log(chalk.dim('─'.repeat(40)));
      }
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
