import { describe, it } from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';
import { tools } from '../src/mcp/tools.js';

describe('MCP tools definitions', () => {
  it('all tools have non-empty name', () => {
    for (const tool of tools) {
      assert.ok(tool.name.length > 0, `Tool has empty name`);
    }
  });

  it('all tools have non-empty description', () => {
    for (const tool of tools) {
      assert.ok(tool.description.length > 0, `Tool "${tool.name}" has empty description`);
    }
  });

  it('no duplicate tool names', () => {
    const names = tools.map((t) => t.name);
    const unique = new Set(names);
    assert.strictEqual(unique.size, names.length, `Duplicate tool names found: ${names.filter((n, i) => names.indexOf(n) !== i)}`);
  });

  it('all tools have a valid zod schema', () => {
    for (const tool of tools) {
      assert.ok(tool.schema instanceof z.ZodObject, `Tool "${tool.name}" schema is not a ZodObject`);
    }
  });

  it('all tools have a handler function', () => {
    for (const tool of tools) {
      assert.strictEqual(typeof tool.handler, 'function', `Tool "${tool.name}" handler is not a function`);
    }
  });

  it('tool count matches expected (16 tools)', () => {
    assert.strictEqual(tools.length, 16, `Expected 16 tools, got ${tools.length}`);
  });
});
