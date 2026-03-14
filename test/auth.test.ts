import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SubstackClient } from '../src/lib/substack.js';

describe('SubstackClient.extractUserId', () => {
  it('extracts userId from valid JWT-like token', () => {
    const payload = Buffer.from(JSON.stringify({ userId: 12345 })).toString('base64');
    const token = `header.${payload}.signature`;
    assert.strictEqual(SubstackClient.extractUserId(token), 12345);
  });

  it('returns null for undefined token', () => {
    assert.strictEqual(SubstackClient.extractUserId(undefined), null);
  });

  it('returns null for empty string', () => {
    assert.strictEqual(SubstackClient.extractUserId(''), null);
  });

  it('returns null for token without dots', () => {
    assert.strictEqual(SubstackClient.extractUserId('nodots'), null);
  });

  it('returns null for token with invalid base64 payload', () => {
    assert.strictEqual(SubstackClient.extractUserId('a.!!!invalid.b'), null);
  });

  it('returns null for token with valid base64 but no userId', () => {
    const payload = Buffer.from(JSON.stringify({ sub: 'abc' })).toString('base64');
    assert.strictEqual(SubstackClient.extractUserId(`a.${payload}.b`), null);
  });
});

describe('Token format validation', () => {
  it('valid base64-encoded JSON token is accepted by makeAuthHeaders concept', () => {
    const token = Buffer.from(JSON.stringify({
      substack_sid: 'sid_abc',
      connect_sid: 'csid_xyz',
    })).toString('base64');

    // We can't call makeAuthHeaders directly (private), but we can verify
    // that creating a client with this token doesn't throw
    assert.doesNotThrow(() => {
      new SubstackClient({
        token,
        publicationUrl: 'https://test.substack.com',
      });
    });
  });

  it('invalid base64 token throws on client creation', () => {
    assert.throws(
      () => new SubstackClient({
        token: '!!!not-base64!!!',
        publicationUrl: 'https://test.substack.com',
      }),
      /Invalid SUBSTACK_TOKEN/
    );
  });

  it('token missing substack_sid throws on client creation', () => {
    const token = Buffer.from(JSON.stringify({
      connect_sid: 'csid_xyz',
    })).toString('base64');

    assert.throws(
      () => new SubstackClient({
        token,
        publicationUrl: 'https://test.substack.com',
      }),
      /missing substack_sid/
    );
  });
});
