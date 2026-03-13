import chalk from 'chalk';
import TurndownService from 'turndown';

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatPost(post: {
  id: number;
  title: string;
  slug: string;
  subtitle?: string;
  truncatedBody?: string;
  publishedAt: Date;
  wordcount?: number;
  reactionCount?: number;
  commentCount?: number;
  authors?: { name: string; handle: string }[];
  publicationSubdomain?: string;
}): string {
  const sub = post.subtitle ? ` - ${post.subtitle}` : '';
  const pubLabel = post.publicationSubdomain ? ` ${chalk.magenta(`[${post.publicationSubdomain}]`)}` : '';
  let out = `${chalk.dim(`#${post.id}`)} ${chalk.bold(post.title)}${chalk.dim(sub)}\n  ${chalk.gray(formatDate(post.publishedAt))} ${chalk.dim(`slug:${post.slug}`)}${pubLabel}`;
  if (post.authors?.length) {
    out += `\n  ${chalk.cyan(post.authors.map((a) => `@${a.handle}`).join(', '))}`;
  }
  const stats: string[] = [];
  if (post.wordcount) stats.push(`${post.wordcount} words`);
  if (post.reactionCount) stats.push(`${post.reactionCount} reactions`);
  if (post.commentCount) stats.push(`${post.commentCount} comments`);
  if (stats.length) out += `\n  ${chalk.gray(stats.join(' | '))}`;
  if (post.truncatedBody) {
    const preview =
      post.truncatedBody.length > 200
        ? post.truncatedBody.slice(0, 200) + '...'
        : post.truncatedBody;
    out += `\n  ${chalk.dim(preview)}`;
  }
  return out;
}

export function formatNote(note: {
  id: number;
  body: string;
  author: { name: string; handle: string };
  publishedAt: Date;
  reactions?: Record<string, number>;
  childrenCount?: number;
}): string {
  const preview = note.body.length > 200 ? note.body.slice(0, 200) + '...' : note.body;
  const stats: string[] = [];
  if (note.reactions) {
    const total = Object.values(note.reactions).reduce((a, b) => a + b, 0);
    if (total) stats.push(`${total} reactions`);
  }
  if (note.childrenCount) stats.push(`${note.childrenCount} replies`);
  const statsLine = stats.length ? `\n  ${chalk.gray(stats.join(' | '))}` : '';
  return `${chalk.dim(`#${note.id}`)} ${chalk.cyan(`@${note.author.handle}`)} ${chalk.gray(formatDate(note.publishedAt))}\n  ${preview}${statsLine}`;
}

export function formatProfile(profile: {
  name: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  publications?: { name: string; subdomain: string; role: string }[];
}): string {
  const lines = [
    `${chalk.bold(profile.name)} ${chalk.cyan(`@${profile.handle}`)}`,
  ];
  if (profile.avatarUrl) lines.push(chalk.gray(`Avatar: ${profile.avatarUrl}`));
  if (profile.bio) lines.push(profile.bio);
  if (profile.publications?.length) {
    lines.push(chalk.dim('\nPublications:'));
    for (const pub of profile.publications) {
      lines.push(`  ${chalk.bold(pub.name)} ${chalk.dim(`(${pub.subdomain}.substack.com)`)} ${chalk.gray(pub.role)}`);
    }
  }
  return lines.join('\n');
}

export function formatComment(comment: {
  id: number;
  body: string;
  authorName: string;
  date: Date;
  reactions?: Record<string, number>;
  childrenCount?: number;
}): string {
  let out = `${chalk.dim(`#${comment.id}`)} ${chalk.cyan(comment.authorName)} ${chalk.gray(formatDate(comment.date))}\n  ${comment.body}`;
  const stats: string[] = [];
  if (comment.reactions) {
    const total = Object.values(comment.reactions).reduce((a, b) => a + b, 0);
    if (total) stats.push(`${total} reactions`);
  }
  if (comment.childrenCount) stats.push(`${comment.childrenCount} replies`);
  if (stats.length) out += `\n  ${chalk.gray(stats.join(' | '))}`;
  return out;
}

export function separator(): string {
  return chalk.dim('─'.repeat(40));
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

// Remove subscription widgets and embeds
turndown.remove(['form', 'input', 'iframe', 'script', 'style', 'noscript']);
turndown.addRule('subscription-widget', {
  filter: (node) => {
    const cls = node.getAttribute?.('class') || '';
    const component = node.getAttribute?.('data-component-name') || '';
    return cls.includes('subscription-widget') || component.includes('Subscribe');
  },
  replacement: () => '',
});

/** Convert HTML to Markdown for terminal display */
export function htmlToText(html: string): string {
  return turndown.turndown(html).replace(/\n{3,}/g, '\n\n').trim();
}
