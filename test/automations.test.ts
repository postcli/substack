import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { AutomationEngine } from '../src/cli/automations/engine.js';
import type { AutoTrigger, AutoAction } from '../src/cli/automations/engine.js';

// Minimal mock client that satisfies the SubstackClient interface enough for engine CRUD
const mockClient = {} as any;

describe('AutomationEngine CRUD', () => {
  let engine: AutomationEngine;

  beforeEach(() => {
    engine = new AutomationEngine(mockClient, ':memory:');
  });

  afterEach(() => {
    engine.close();
  });

  it('list returns empty array initially', () => {
    assert.deepStrictEqual(engine.list(), []);
  });

  it('create returns automation with correct fields', () => {
    const trigger: AutoTrigger = { type: 'someone_likes_my_note' };
    const actions: AutoAction[] = [{ type: 'like_back' }];
    const auto = engine.create('Test Auto', trigger, actions);

    assert.strictEqual(auto.name, 'Test Auto');
    assert.deepStrictEqual(auto.trigger, trigger);
    assert.deepStrictEqual(auto.actions, actions);
    assert.strictEqual(auto.enabled, true);
    assert.strictEqual(auto.runCount, 0);
    assert.strictEqual(auto.lastRun, null);
    assert.ok(auto.id > 0);
  });

  it('list returns created automations', () => {
    engine.create('A', { type: 'someone_likes_my_note' }, [{ type: 'log' }]);
    engine.create('B', { type: 'cron', intervalMinutes: 30 }, [{ type: 'log' }]);

    const items = engine.list();
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].name, 'A');
    assert.strictEqual(items[1].name, 'B');
  });

  it('get returns automation by id', () => {
    const created = engine.create('Find Me', { type: 'someone_replies_to_me' }, [{ type: 'log' }]);
    const found = engine.get(created.id);

    assert.ok(found);
    assert.strictEqual(found!.id, created.id);
    assert.strictEqual(found!.name, 'Find Me');
  });

  it('get returns null for non-existent id', () => {
    assert.strictEqual(engine.get(999), null);
  });

  it('toggle flips enabled state', () => {
    const auto = engine.create('Toggle Test', { type: 'someone_likes_my_note' }, [{ type: 'log' }]);
    assert.strictEqual(auto.enabled, true);

    engine.toggle(auto.id);
    assert.strictEqual(engine.get(auto.id)!.enabled, false);

    engine.toggle(auto.id);
    assert.strictEqual(engine.get(auto.id)!.enabled, true);
  });

  it('toggle returns false for non-existent id', () => {
    assert.strictEqual(engine.toggle(999), false);
  });

  it('remove deletes automation and its processed records', () => {
    const auto = engine.create('Remove Me', { type: 'someone_likes_my_note' }, [{ type: 'log' }]);
    assert.strictEqual(engine.list().length, 1);

    const removed = engine.remove(auto.id);
    assert.strictEqual(removed, true);
    assert.strictEqual(engine.list().length, 0);
    assert.strictEqual(engine.get(auto.id), null);
  });

  it('remove returns false for non-existent id', () => {
    assert.strictEqual(engine.remove(999), false);
  });

  it('creates automation with new_note_from trigger and handles', () => {
    const trigger: AutoTrigger = { type: 'new_note_from', handles: ['alice', 'bob'] };
    const auto = engine.create('Watch handles', trigger, [{ type: 'like_note' }]);

    assert.strictEqual(auto.trigger.type, 'new_note_from');
    assert.deepStrictEqual((auto.trigger as any).handles, ['alice', 'bob']);
  });

  it('creates automation with new_post_from trigger and subdomains', () => {
    const trigger: AutoTrigger = { type: 'new_post_from', subdomains: ['techblog'] };
    const auto = engine.create('Watch posts', trigger, [{ type: 'restack' }]);

    assert.strictEqual(auto.trigger.type, 'new_post_from');
    assert.deepStrictEqual((auto.trigger as any).subdomains, ['techblog']);
  });

  it('creates automation with multiple actions', () => {
    const actions: AutoAction[] = [
      { type: 'like_back' },
      { type: 'reply', text: 'Thanks!' },
      { type: 'restack' },
    ];
    const auto = engine.create('Multi action', { type: 'someone_likes_my_note' }, actions);

    assert.strictEqual(auto.actions.length, 3);
    assert.strictEqual(auto.actions[0].type, 'like_back');
    assert.strictEqual(auto.actions[1].type, 'reply');
    assert.strictEqual((auto.actions[1] as any).text, 'Thanks!');
    assert.strictEqual(auto.actions[2].type, 'restack');
  });
});

describe('AutomationEngine presets', () => {
  it('PRESETS array has entries', () => {
    assert.ok(AutomationEngine.PRESETS.length >= 4);
  });

  it('each preset has name, trigger, and actions', () => {
    for (const preset of AutomationEngine.PRESETS) {
      assert.ok(preset.name.length > 0, `Preset should have name`);
      assert.ok(preset.trigger.type, `Preset "${preset.name}" should have trigger type`);
      assert.ok(Array.isArray(preset.actions), `Preset "${preset.name}" should have actions array`);
      assert.ok(preset.actions.length > 0, `Preset "${preset.name}" should have at least one action`);
    }
  });

  it('presets requiring input have requiresInput field', () => {
    const needInput = AutomationEngine.PRESETS.filter((p) => 'requiresInput' in p);
    for (const preset of needInput) {
      const ri = (preset as any).requiresInput;
      assert.ok(ri === 'handles' || ri === 'subdomains', `Invalid requiresInput: ${ri}`);
    }
  });
});
