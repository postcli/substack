import { describe, it, expect } from 'node:test';
import assert from 'node:assert';
import { parsePositiveInt, getConfigDir, getEnvPath } from '../src/client.js';
import { homedir } from 'os';
import { join } from 'path';

describe('parsePositiveInt', () => {
  it('parses valid positive integers', () => {
    assert.strictEqual(parsePositiveInt('1', 'test'), 1);
    assert.strictEqual(parsePositiveInt('10', 'test'), 10);
    assert.strictEqual(parsePositiveInt('999', 'test'), 999);
  });

  it('rejects non-numeric strings', () => {
    assert.throws(() => parsePositiveInt('abc', 'ID'), /Invalid ID: "abc"/);
    assert.throws(() => parsePositiveInt('', 'ID'), /Invalid ID: ""/);
    // parseInt('12.5') = 12, which is valid — this is expected behavior
  });

  it('rejects zero and negative numbers', () => {
    assert.throws(() => parsePositiveInt('0', 'limit'), /Invalid limit: "0"/);
    assert.throws(() => parsePositiveInt('-5', 'limit'), /Invalid limit: "-5"/);
  });
});

describe('config paths', () => {
  it('returns config dir under home', () => {
    const dir = getConfigDir();
    assert.strictEqual(dir, join(homedir(), '.config', 'postcli'));
  });

  it('returns .env path under config dir', () => {
    const envPath = getEnvPath();
    assert.strictEqual(envPath, join(homedir(), '.config', 'postcli', '.env'));
  });
});
