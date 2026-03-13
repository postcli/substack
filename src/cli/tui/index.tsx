import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import type { SubstackClient } from '../../lib/substack.js';
import { AutomationEngine } from '../automations/engine.js';

export function startTui(client: SubstackClient) {
  if (!process.stdin.isTTY) {
    console.error('TUI requires an interactive terminal.');
    process.exit(1);
  }

  const engine = new AutomationEngine(client);
  engine.startAll();

  const { waitUntilExit } = render(<App client={client} engine={engine} />);
  waitUntilExit().then(() => {
    engine.close();
    process.exit(0);
  });
}
