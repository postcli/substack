import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, parsePositiveInt } from '../../client.js';
import { formatPost, formatDate, separator, htmlToText } from '../formatters.js';

export const postsCommand = new Command('posts').description('Manage posts');

postsCommand
  .command('list')
  .description('List posts (all your publications by default)')
  .option('-l, --limit <n>', 'Number of posts', '10')
  .option('-p, --profile <sub>', 'Filter to one of your publications')
  .option('-s, --subdomain <sub>', 'Fetch from any publication subdomain')
  .option('-o, --offset <n>', 'Offset for pagination', '0')
  .action(async function (this: Command, opts) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const limit = parsePositiveInt(opts.limit, 'limit');
      const offset = parseInt(opts.offset, 10) || 0;

      let posts;
      if (opts.subdomain) {
        posts = await client.listPosts({ subdomain: opts.subdomain, limit, offset });
      } else if (opts.profile) {
        posts = await client.listPosts({ subdomain: opts.profile, limit, offset });
      } else {
        const profile = await client.ownProfile();
        const subs = profile.publications.map((p) => p.subdomain);
        if (!json) console.log(chalk.dim(`Fetching from ${subs.length} publication(s): ${subs.join(', ')}\n`));
        const results = await Promise.all(
          subs.map(async (sub) => {
            const subPosts = await client.listPosts({ subdomain: sub, limit, offset });
            for (const p of subPosts) p.publicationSubdomain = sub;
            return subPosts;
          })
        );
        posts = results
          .flat()
          .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
          .slice(0, limit);
      }

      if (json) {
        console.log(JSON.stringify(posts.map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          slug: p.slug,
          publishedAt: p.publishedAt,
          canonicalUrl: p.canonicalUrl,
          coverImage: p.coverImage,
          wordcount: p.wordcount,
          reactionCount: p.reactionCount,
          commentCount: p.commentCount,
          restacks: p.restacks,
          authors: p.authors,
          publicationSubdomain: p.publicationSubdomain,
          truncatedBody: p.truncatedBody,
        })), null, 2));
        return;
      }

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
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

postsCommand
  .command('get')
  .description('Get full post by slug or ID')
  .option('--slug <slug>', 'Post slug (from URL)')
  .option('--id <id>', 'Post numeric ID')
  .option('-s, --subdomain <sub>', 'Publication subdomain (defaults to own)')
  .action(async function (this: Command, opts) {
    const json = this.optsWithGlobals().json;
    try {
      if (!opts.slug && !opts.id) {
        const msg = 'Provide --slug or --id';
        if (json) { console.log(JSON.stringify({ error: msg })); process.exit(1); }
        console.error(chalk.red(msg));
        process.exit(1);
      }
      const client = getClient();
      const post = opts.id
        ? await client.getPostById(Number(opts.id), opts.subdomain)
        : await client.getPost(opts.slug, opts.subdomain);

      if (json) {
        console.log(JSON.stringify({
          id: post.id,
          title: post.title,
          subtitle: post.subtitle,
          slug: post.slug,
          canonicalUrl: post.canonicalUrl,
          coverImage: post.coverImage,
          publishedAt: post.publishedAt,
          description: post.description,
          wordcount: post.wordcount,
          reactionCount: post.reactionCount,
          commentCount: post.commentCount,
          restacks: post.restacks,
          tags: post.postTags,
          youtubeUrls: post.youtubeUrls,
          authors: post.authors,
          htmlBody: post.htmlBody,
        }, null, 2));
        return;
      }

      console.log(chalk.bold(post.title));
      if (post.subtitle) console.log(chalk.dim(post.subtitle));
      if (post.authors.length) {
        console.log(chalk.cyan(`By: ${post.authors.map((a) => `${a.name} (@${a.handle})`).join(', ')}`));
      }
      console.log(chalk.gray(`Published: ${formatDate(post.publishedAt)}`));
      console.log(chalk.gray(`URL: ${post.canonicalUrl}`));
      if (post.coverImage) console.log(chalk.gray(`Cover: ${post.coverImage}`));
      if (post.postTags?.length) console.log(chalk.gray(`Tags: ${post.postTags.join(', ')}`));
      const stats: string[] = [];
      if (post.wordcount) stats.push(`${post.wordcount} words`);
      if (post.reactionCount) stats.push(`${post.reactionCount} reactions`);
      if (post.commentCount) stats.push(`${post.commentCount} comments`);
      if (post.restacks) stats.push(`${post.restacks} restacks`);
      if (stats.length) console.log(chalk.gray(stats.join(' | ')));
      if (post.youtubeUrls.length) console.log(chalk.gray(`Videos: ${post.youtubeUrls.join(', ')}`));
      console.log(separator());
      console.log(post.htmlBody ? htmlToText(post.htmlBody) : post.truncatedBody);
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

postsCommand
  .command('react <post-id>')
  .description('React to a post (heart)')
  .option('-s, --subdomain <sub>', 'Publication subdomain (defaults to own)')
  .action(async function (this: Command, postId, opts) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      await client.reactToPost(id, opts.subdomain);

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

postsCommand
  .command('restack <post-id>')
  .description('Restack a post')
  .action(async function (this: Command, postId) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const id = parsePositiveInt(postId, 'post ID');
      await client.restackPost(id);

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
