import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, collectAsync, parsePositiveInt } from '../../client.js';
import { formatPost, formatDate, separator } from '../formatters.js';

export const postsCommand = new Command('posts').description('Manage posts');

postsCommand
  .command('list')
  .description('List posts from a publication')
  .option('-l, --limit <n>', 'Number of posts', '10')
  .option('-s, --slug <slug>', 'Profile slug (defaults to own profile)')
  .action(async (opts) => {
    try {
      const client = getClient();
      const limit = parsePositiveInt(opts.limit, 'limit');
      let profile;
      if (opts.slug) {
        profile = await client.profileForSlug(opts.slug);
      } else {
        profile = await client.ownProfile();
      }
      const posts = await collectAsync(profile.posts({ limit }), limit);
      if (posts.length === 0) {
        console.log(chalk.dim('No posts found.'));
        return;
      }
      for (const post of posts) {
        console.log(formatPost(post));
        console.log(separator());
      }
      console.log(chalk.dim(`${posts.length} post(s)`));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

postsCommand
  .command('get <id>')
  .description('Get full post by ID')
  .action(async (id) => {
    try {
      const client = getClient();
      const postId = parsePositiveInt(id, 'post ID');
      const post = await client.postForId(postId);
      console.log(chalk.bold(post.title));
      if (post.subtitle) console.log(chalk.dim(post.subtitle));
      console.log(chalk.gray(`Published: ${formatDate(post.publishedAt)}`));
      if (post.createdAt && post.createdAt.getTime() !== post.publishedAt.getTime()) {
        console.log(chalk.gray(`Created: ${formatDate(post.createdAt)}`));
      }
      console.log(chalk.gray(`URL: ${post.url}`));
      if (post.coverImage) console.log(chalk.gray(`Cover: ${post.coverImage}`));
      if (post.postTags?.length) console.log(chalk.gray(`Tags: ${post.postTags.join(', ')}`));
      if (post.reactions) console.log(chalk.gray(`Reactions: ${JSON.stringify(post.reactions)}`));
      if (post.restacks) console.log(chalk.gray(`Restacks: ${post.restacks}`));
      console.log(separator());
      console.log(post.markdown || post.htmlBody || post.body);
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
