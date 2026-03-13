import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, collectAsync, parsePositiveInt } from '../../client.js';

export const socialCommand = new Command('social').description('Social actions');

socialCommand
  .command('like <post-id>')
  .description('Like a post')
  .action(async (postId) => {
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      const post = await client.postForId(id);
      await post.like();
      console.log(chalk.green(`Liked post #${id}`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

socialCommand
  .command('following')
  .description('List profiles you follow')
  .option('-l, --limit <n>', 'Number of profiles', '20')
  .action(async (opts) => {
    try {
      const client = getClient();
      const profile = await client.ownProfile();
      const limit = parsePositiveInt(opts.limit, 'limit');
      const following = await collectAsync(profile.following({ limit }), limit);
      if (following.length === 0) {
        console.log(chalk.dim('Not following anyone.'));
        return;
      }
      for (const p of following) {
        console.log(`${chalk.bold(p.name)} ${chalk.cyan(`@${p.handle}`)} ${chalk.dim(p.url)}`);
      }
      console.log(chalk.dim(`\n${following.length} profile(s)`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
