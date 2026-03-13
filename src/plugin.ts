import { Command } from 'commander';
import { authCommand } from './cli/commands/auth.js';
import { postsCommand } from './cli/commands/posts.js';
import { notesCommand } from './cli/commands/notes.js';
import { commentsCommand } from './cli/commands/comments.js';
import { profileCommand } from './cli/commands/profile.js';
import { socialCommand } from './cli/commands/social.js';
import { autoCommand } from './cli/commands/auto.js';
import { startMcpServer } from './mcp/index.js';

export function registerCommands(program: Command): void {
  const substack = new Command('substack')
    .description('Substack - posts, notes, comments, profile')
    .option('-j, --json', 'Output as JSON (for scripts and AI agents)')
    .enablePositionalOptions()
    .passThroughOptions();

  substack.addCommand(authCommand);
  substack.addCommand(postsCommand);
  substack.addCommand(notesCommand);
  substack.addCommand(commentsCommand);
  substack.addCommand(profileCommand);
  substack.addCommand(socialCommand);
  substack.addCommand(autoCommand);

  substack
    .command('tui')
    .description('Interactive terminal UI')
    .action(async () => {
      const { getClient } = await import('./client.js');
      const { startTui } = await import('./cli/tui/index.js');
      startTui(getClient());
    });

  program.addCommand(substack);
}

export { startMcpServer };
