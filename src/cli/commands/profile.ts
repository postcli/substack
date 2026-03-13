import { Command } from 'commander';
import chalk from 'chalk';
import { getClient } from '../../client.js';
import { formatProfile } from '../formatters.js';

export const profileCommand = new Command('profile').description('Profile operations');

profileCommand
  .command('me')
  .description('Show own profile')
  .action(async function (this: Command) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const profile = await client.ownProfile();

      if (json) {
        console.log(JSON.stringify(profile.toData(), null, 2));
        return;
      }

      console.log(formatProfile(profile));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

profileCommand
  .command('get <subdomain>')
  .description('Get profile by publication subdomain')
  .action(async function (this: Command, subdomain) {
    const json = this.optsWithGlobals().json;
    try {
      const client = getClient();
      const profile = await client.profileForSubdomain(subdomain);

      if (json) {
        console.log(JSON.stringify(profile.toData(), null, 2));
        return;
      }

      console.log(formatProfile(profile));
    } catch (err: any) {
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
