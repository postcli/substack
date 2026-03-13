import chalk from 'chalk';

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
  subtitle?: string;
  publishedAt: Date;
}): string {
  const sub = post.subtitle ? ` - ${post.subtitle}` : '';
  return `${chalk.dim(`#${post.id}`)} ${chalk.bold(post.title)}${chalk.dim(sub)}\n  ${chalk.gray(formatDate(post.publishedAt))}`;
}

export function formatNote(note: {
  id: number;
  body: string;
  likesCount: number;
  author: { name: string; handle: string };
  publishedAt: Date;
}): string {
  const preview = note.body.length > 200 ? note.body.slice(0, 200) + '...' : note.body;
  return `${chalk.dim(`#${note.id}`)} ${chalk.cyan(`@${note.author.handle}`)} ${chalk.gray(formatDate(note.publishedAt))}\n  ${preview}\n  Likes: ${note.likesCount}`;
}

export function formatProfile(profile: {
  name: string;
  handle: string;
  url: string;
  bio?: string;
}): string {
  const lines = [
    `${chalk.bold(profile.name)} ${chalk.cyan(`@${profile.handle}`)}`,
    chalk.dim(profile.url),
  ];
  if (profile.bio) lines.push(profile.bio);
  return lines.join('\n');
}

export function formatComment(comment: {
  id: number;
  body: string;
  isAdmin?: boolean;
}): string {
  const admin = comment.isAdmin ? chalk.yellow(' [admin]') : '';
  return `${chalk.dim(`#${comment.id}`)}${admin}\n  ${comment.body}`;
}

export function separator(): string {
  return chalk.dim('─'.repeat(40));
}
