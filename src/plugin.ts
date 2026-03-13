import { Command } from 'commander';
import { authCommand } from './cli/commands/auth.js';
import { postsCommand } from './cli/commands/posts.js';
import { notesCommand } from './cli/commands/notes.js';
import { commentsCommand } from './cli/commands/comments.js';
import { profileCommand } from './cli/commands/profile.js';
import { socialCommand } from './cli/commands/social.js';
import { startMcpServer } from './mcp/index.js';

export function registerCommands(program: Command): void {
  const substack = new Command('substack')
    .description('Substack - posts, notes, comments, profile');

  substack.addCommand(authCommand);
  substack.addCommand(postsCommand);
  substack.addCommand(notesCommand);
  substack.addCommand(commentsCommand);
  substack.addCommand(profileCommand);
  substack.addCommand(socialCommand);

  program.addCommand(substack);
}

export { startMcpServer };
