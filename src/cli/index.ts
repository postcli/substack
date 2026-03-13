#!/usr/bin/env node
import { Command } from 'commander';
import { authCommand } from './commands/auth.js';
import { postsCommand } from './commands/posts.js';
import { notesCommand } from './commands/notes.js';
import { commentsCommand } from './commands/comments.js';
import { profileCommand } from './commands/profile.js';
import { socialCommand } from './commands/social.js';
import { autoCommand } from './commands/auto.js';

// Handle --mcp before commander parses (MCP server stays alive, no subcommand needed)
if (process.argv.includes('--mcp')) {
  import('../mcp/index.js').then(({ startMcpServer }) => startMcpServer()).catch((err) => {
    console.error('MCP server failed:', err);
    process.exit(1);
  });
} else {
  const program = new Command()
    .name('postcli-substack')
    .description('Substack CLI and MCP Server')
    .version(process.env.npm_package_version || '0.1.0')
    .option('-j, --json', 'Output as JSON (for scripts and AI agents)')
    .enablePositionalOptions()
    .passThroughOptions();

  program.addCommand(authCommand);
  program.addCommand(postsCommand);
  program.addCommand(notesCommand);
  program.addCommand(commentsCommand);
  program.addCommand(profileCommand);
  program.addCommand(socialCommand);
  program.addCommand(autoCommand);

  program
    .command('tui')
    .description('Interactive terminal UI')
    .action(async () => {
      const { getClient } = await import('../client.js');
      const { startTui } = await import('./tui/index.js');
      startTui(getClient());
    });

  program.parse();
}
