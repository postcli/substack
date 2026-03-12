import { Command } from 'commander';
import chalk from 'chalk';
import { getClient } from '../../client.js';
import { formatProfile } from '../formatters.js';

export const profileCommand = new Command('profile').description('Profile operations');

profileCommand
  .command('me')
  .description('Show own profile')
  .action(async () => {
    try {
      const client = getClient();
      const profile = await client.ownProfile();
      console.log(formatProfile(profile));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

profileCommand
  .command('get <slug>')
  .description('Get profile by slug')
  .action(async (slug) => {
    try {
      const client = getClient();
      const profile = await client.profileForSlug(slug);
      console.log(formatProfile(profile));
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
