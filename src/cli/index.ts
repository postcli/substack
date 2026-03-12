#!/usr/bin/env node
import { Command } from 'commander';
import { authCommand } from './commands/auth.js';
import { postsCommand } from './commands/posts.js';
import { notesCommand } from './commands/notes.js';
import { commentsCommand } from './commands/comments.js';
import { profileCommand } from './commands/profile.js';
import { socialCommand } from './commands/social.js';

const program = new Command()
  .name('postcli-substack')
  .description('Substack CLI and MCP Server')
  .version('0.1.0');

program.addCommand(authCommand);
program.addCommand(postsCommand);
program.addCommand(notesCommand);
program.addCommand(commentsCommand);
program.addCommand(profileCommand);
program.addCommand(socialCommand);

program.parse();
