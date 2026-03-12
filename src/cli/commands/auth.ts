import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient, getClient } from '../../client.js';
import { grabSubstackCookies } from '../chrome-cookies.js';
import readline from 'readline';

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(question, (answer) => { rl.close(); res(answer.trim()); }));
}

function getProjectRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  // src/cli/commands/auth.ts -> project root (3 levels up)
  return resolve(dirname(__filename), '..', '..', '..');
}

function saveCredentials(token: string, publicationUrl: string) {
  const envPath = resolve(getProjectRoot(), '.env');
  let envContent = '';
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(/^SUBSTACK_TOKEN=.*$/m, '').replace(/^SUBSTACK_PUBLICATION_URL=.*$/m, '').trim();
    if (envContent) envContent += '\n';
  }
  envContent += `SUBSTACK_TOKEN=${token}\nSUBSTACK_PUBLICATION_URL=${publicationUrl}\n`;
  writeFileSync(envPath, envContent);
}

function extractCookies(setCookieHeaders: string[]): { substackSid?: string; connectSid?: string } {
  let substackSid: string | undefined;
  let connectSid: string | undefined;
  for (const header of setCookieHeaders) {
    const match = header.match(/^([^=]+)=([^;]+)/);
    if (!match) continue;
    const [, name, value] = match;
    if (name === 'substack.sid') substackSid = value;
    if (name === 'connect.sid') connectSid = value;
  }
  return { substackSid, connectSid };
}

export const authCommand = new Command('auth').description('Authentication management');

authCommand
  .command('login')
  .description('Login via email code or Chrome cookies')
  .action(async () => {
    // Try to grab cookies from Chrome first
    console.log(chalk.dim('Checking Chrome for existing Substack session...'));
    const grabbed = grabSubstackCookies();
    if (grabbed) {
      const token = Buffer.from(JSON.stringify({
        substack_sid: grabbed.substackSid,
        connect_sid: grabbed.connectSid,
      })).toString('base64');

      console.log(chalk.dim('Fetching profile...'));
      try {
        const client = createClient(token, 'https://substack.com');
        const profile = await client.ownProfile();
        saveCredentials(token, profile.url);
        console.log(chalk.green(`\nLogged in as ${chalk.bold(profile.name)} (@${profile.handle})`));
        console.log(chalk.dim(`Publication: ${profile.url}`));
        console.log(chalk.green('Credentials saved to .env'));
        return;
      } catch {
        console.log(chalk.dim('Chrome session found but expired. Falling back to email login.\n'));
      }
    } else {
      console.log(chalk.dim('No Substack session found in Chrome. Using email login.\n'));
    }

    const email = await ask('Email: ');

    console.log(chalk.dim('\nRequesting login code...'));

    const loginRes = await fetch('https://substack.com/api/v1/email-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        redirect: '/',
        for_pub: '',
        can_create_user: false,
      }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.json().catch(() => ({}));
      const msg = (err as any).error || `HTTP ${loginRes.status}`;
      console.log(chalk.red(`Login request failed: ${msg}`));
      process.exit(1);
    }

    console.log(chalk.green('Code sent! Check your email.\n'));

    const code = await ask('Enter the 6-digit code: ');

    const otpRes = await fetch('https://substack.com/api/v1/email-otp-login/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        email,
        redirect: '/',
        for_pub: '',
        island_magic_signin: false,
      }),
      redirect: 'manual',
    });

    const setCookieHeaders = otpRes.headers.getSetCookie?.() ?? [];
    const { substackSid, connectSid } = extractCookies(setCookieHeaders);

    if (!substackSid || !connectSid) {
      if (!otpRes.ok) {
        const err = await otpRes.json().catch(() => ({}));
        const msg = (err as any).error || `HTTP ${otpRes.status}`;
        console.log(chalk.red(`Code verification failed: ${msg}`));
      } else {
        console.log(chalk.red('Login succeeded but cookies were not returned.'));
        console.log(chalk.dim('Try: wrtr auth setup (manual cookie paste)'));
      }
      process.exit(1);
    }

    const token = Buffer.from(JSON.stringify({
      substack_sid: substackSid,
      connect_sid: connectSid,
    })).toString('base64');

    // Derive publication URL from profile
    console.log(chalk.dim('\nFetching profile...'));
    const client = createClient(token, 'https://substack.com');
    const profile = await client.ownProfile();
    const publicationUrl = profile.url;

    saveCredentials(token, publicationUrl);
    console.log(chalk.green(`\nLogged in as ${chalk.bold(profile.name)} (@${profile.handle})`));
    console.log(chalk.dim(`Publication: ${publicationUrl}`));
    console.log(chalk.green('Credentials saved to .env'));
  });

authCommand
  .command('setup')
  .description('Configure credentials manually (paste cookies)')
  .action(async () => {
    console.log(chalk.bold('Manual Auth Setup\n'));
    console.log('Open Substack in your browser, DevTools > Application > Cookies');
    console.log('and copy both cookie values.\n');

    const substackSid = await ask('substack.sid: ');
    const connectSid = await ask('connect.sid: ');
    const publicationUrl = await ask('Publication URL (e.g. https://you.substack.com): ');

    const token = Buffer.from(JSON.stringify({
      substack_sid: substackSid,
      connect_sid: connectSid,
    })).toString('base64');

    saveCredentials(token, publicationUrl);
    console.log(chalk.green('\nCredentials saved to .env'));

    console.log('Testing connection...');
    try {
      const client = createClient(token, publicationUrl);
      const profile = await client.ownProfile();
      console.log(chalk.green(`Connected as ${chalk.bold(profile.name)} (@${profile.handle})`));
    } catch (err: any) {
      console.log(chalk.red(`Connection failed: ${err.message}`));
    }
  });

authCommand
  .command('test')
  .description('Test current connection')
  .action(async () => {
    try {
      const client = getClient();
      const ok = await client.testConnectivity();
      if (ok) {
        const profile = await client.ownProfile();
        console.log(chalk.green(`Connected as ${chalk.bold(profile.name)} (@${profile.handle})`));
      } else {
        console.log(chalk.red('Connection test failed.'));
        process.exit(1);
      }
    } catch (err: any) {
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });
