import { describe, it } from 'node:test';
import assert from 'node:assert';
import { textToProseMirror } from '../src/lib/substack.js';

describe('textToProseMirror', () => {
  it('simple text becomes single paragraph with text node', () => {
    const doc = textToProseMirror('Hello world');
    assert.strictEqual(doc.content.length, 1);
    assert.strictEqual(doc.content[0].type, 'paragraph');
    assert.strictEqual(doc.content[0].content.length, 1);
    assert.strictEqual(doc.content[0].content[0].type, 'text');
    assert.strictEqual(doc.content[0].content[0].text, 'Hello world');
  });

  it('two paragraphs separated by \\n\\n become two paragraph nodes', () => {
    const doc = textToProseMirror('First paragraph\n\nSecond paragraph');
    assert.strictEqual(doc.content.length, 2);
    assert.strictEqual(doc.content[0].type, 'paragraph');
    assert.strictEqual(doc.content[0].content[0].text, 'First paragraph');
    assert.strictEqual(doc.content[1].type, 'paragraph');
    assert.strictEqual(doc.content[1].content[0].text, 'Second paragraph');
  });

  it('**bold** text gets marks: [{type: "bold"}]', () => {
    const doc = textToProseMirror('**bold text**');
    const node = doc.content[0].content[0];
    assert.strictEqual(node.text, 'bold text');
    assert.deepStrictEqual(node.marks, [{ type: 'bold' }]);
  });

  it('mixed normal + **bold** + normal in one paragraph', () => {
    const doc = textToProseMirror('hello **world** end');
    const parts = doc.content[0].content;
    assert.strictEqual(parts.length, 3);
    assert.strictEqual(parts[0].text, 'hello ');
    assert.strictEqual(parts[0].marks, undefined);
    assert.strictEqual(parts[1].text, 'world');
    assert.deepStrictEqual(parts[1].marks, [{ type: 'bold' }]);
    assert.strictEqual(parts[2].text, ' end');
    assert.strictEqual(parts[2].marks, undefined);
  });

  it('empty string produces a single paragraph with a space (prevents API rejection)', () => {
    const doc = textToProseMirror('');
    assert.strictEqual(doc.content.length, 1);
    assert.strictEqual(doc.content[0].type, 'paragraph');
    assert.strictEqual(doc.content[0].content[0].text, ' ');
  });

  it('all docs have type "doc" and attrs.schemaVersion "v1"', () => {
    const doc = textToProseMirror('anything');
    assert.strictEqual(doc.type, 'doc');
    assert.deepStrictEqual(doc.attrs, { schemaVersion: 'v1' });
  });
});
