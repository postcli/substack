import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractSubdomain, buildUrl } from '../src/lib/http.js';

describe('extractSubdomain', () => {
  it('extracts from https://foo.substack.com', () => {
    assert.strictEqual(extractSubdomain('https://foo.substack.com'), 'foo');
  });

  it('extracts from https://substack.com/@bar', () => {
    assert.strictEqual(extractSubdomain('https://substack.com/@bar'), 'bar');
  });

  it('throws on invalid input', () => {
    assert.throws(() => extractSubdomain('invalid'), /Cannot extract subdomain/);
  });
});

describe('buildUrl', () => {
  it('adds query params', () => {
    const url = buildUrl('https://example.com', { a: '1', b: '2' });
    const parsed = new URL(url);
    assert.strictEqual(parsed.searchParams.get('a'), '1');
    assert.strictEqual(parsed.searchParams.get('b'), '2');
  });

  it('returns base URL when params is undefined', () => {
    const url = buildUrl('https://example.com', undefined);
    assert.strictEqual(url, 'https://example.com');
  });

  it('skips null/undefined param values', () => {
    const url = buildUrl('https://example.com', { a: '1', b: null, c: undefined, d: '4' });
    const parsed = new URL(url);
    assert.strictEqual(parsed.searchParams.get('a'), '1');
    assert.strictEqual(parsed.searchParams.get('d'), '4');
    assert.strictEqual(parsed.searchParams.has('b'), false);
    assert.strictEqual(parsed.searchParams.has('c'), false);
  });
});
