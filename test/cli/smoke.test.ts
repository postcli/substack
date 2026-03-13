import { describe, it } from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = resolve(__dirname, '..', '..', 'dist', 'cli', 'index.js');

function run(...args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    execFile('node', [CLI, ...args], { timeout: 10000 }, (err, stdout, stderr) => {
      resolve({ stdout, stderr, code: err?.code === 'ERR_CHILD_PROCESS_STDIO_FINAL_ERROR' ? 0 : (err as any)?.code ?? 0 });
    });
  });
}

describe('CLI smoke tests', () => {
  it('shows help with --help', async () => {
    const { stdout } = await run('--help');
    assert.ok(stdout.includes('Substack CLI'), 'Should show description');
    assert.ok(stdout.includes('posts'), 'Should list posts command');
    assert.ok(stdout.includes('notes'), 'Should list notes command');
    assert.ok(stdout.includes('auth'), 'Should list auth command');
  });

  it('shows version with --version', async () => {
    const { stdout } = await run('--version');
    assert.match(stdout.trim(), /^\d+\.\d+\.\d+/, 'Should print semver');
  });

  const subcommands = ['posts', 'notes', 'comments', 'profile', 'feed', 'auto'];

  for (const cmd of subcommands) {
    it(`${cmd} --help does not crash`, async () => {
      const { stdout } = await run(cmd, '--help');
      assert.ok(stdout.length > 0, `${cmd} --help should produce output`);
    });
  }

  it('posts list --help shows options', async () => {
    const { stdout } = await run('posts', 'list', '--help');
    assert.ok(stdout.includes('--limit'), 'Should show --limit option');
  });

  it('notes list --help shows options', async () => {
    const { stdout } = await run('notes', 'list', '--help');
    assert.ok(stdout.includes('--limit'), 'Should show --limit option');
  });

  it('auth --help shows subcommands', async () => {
    const { stdout } = await run('auth', '--help');
    assert.ok(stdout.includes('login'), 'Should show login');
    assert.ok(stdout.includes('test'), 'Should show test');
  });

  it('auto --help shows subcommands', async () => {
    const { stdout } = await run('auto', '--help');
    assert.ok(stdout.includes('list'), 'Should show list');
    assert.ok(stdout.includes('presets'), 'Should show presets');
  });

  it('unknown command shows help or error', async () => {
    const { stdout, stderr } = await run('nonexistent');
    const output = stdout + stderr;
    assert.ok(output.length > 0, 'Should produce some output for unknown command');
  });
});
