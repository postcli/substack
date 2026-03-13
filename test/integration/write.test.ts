/**
 * Integration tests for write operations.
 * These create real content on Substack. Use with a test account.
 * Requires SUBSTACK_TOKEN, SUBSTACK_PUBLICATION_URL, and RUN_WRITE_TESTS=1 env vars.
 * Skipped by default to avoid accidental writes.
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

let client: any;
let skipAll = false;

before(async () => {
  try {
    const { SubstackClient } = await import('../../src/lib/substack.js');

    const token = process.env.SUBSTACK_TOKEN;
    const publicationUrl = process.env.SUBSTACK_PUBLICATION_URL;
    const runWriteTests = process.env.RUN_WRITE_TESTS;

    if (!token || !publicationUrl || runWriteTests !== '1') {
      skipAll = true;
      return;
    }
    client = new SubstackClient({ token, publicationUrl });
  } catch {
    skipAll = true;
  }
});

function skip() { return skipAll; }

describe('Integration: write operations', () => {
  let publishedNoteId: number;

  it('publishNote creates a note and returns id', async () => {
    if (skip()) return;
    const result = await client.publishNote(`PostCLI test note ${Date.now()}`);
    assert.ok(result.id > 0, 'Should return positive id');
    publishedNoteId = result.id;
  });

  it('replyToNote creates a reply and returns id', async () => {
    if (skip() || !publishedNoteId) return;
    const result = await client.replyToNote(publishedNoteId, `Reply test ${Date.now()}`);
    assert.ok(result.id > 0, 'Should return positive id');
  });

  it('reactToComment does not throw', async () => {
    if (skip() || !publishedNoteId) return;
    await assert.doesNotReject(
      () => client.reactToComment(publishedNoteId),
      'reactToComment should not throw'
    );
  });

  it('restackNote does not throw', async () => {
    if (skip() || !publishedNoteId) return;
    await assert.doesNotReject(
      () => client.restackNote(publishedNoteId),
      'restackNote should not throw'
    );
  });
});
