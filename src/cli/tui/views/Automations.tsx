import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { useListNav } from '../hooks.js';
import { theme } from '../theme.js';
import { AutomationEngine } from '../../automations/engine.js';
import type { Automation, AutoTrigger } from '../../automations/engine.js';

interface Props {
  engine: AutomationEngine;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

type View = { type: 'list' } | { type: 'presets' };

export function AutomationsView({ engine, showToast }: Props) {
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;
  const [view, setView] = useState<View>({ type: 'list' });
  const [items, setItems] = useState<Automation[]>(() => engine.list());
  const [running, setRunning] = useState<number | null>(null);

  const refresh = useCallback(() => setItems(engine.list()), [engine]);

  if (view.type === 'presets') {
    return (
      <PresetsView
        engine={engine}
        showToast={showToast}
        onDone={() => { refresh(); setView({ type: 'list' }); }}
      />
    );
  }

  return (
    <AutoListView
      items={items}
      engine={engine}
      rows={rows}
      running={running}
      showToast={showToast}
      onNew={() => setView({ type: 'presets' })}
      onRefresh={refresh}
      onRun={async (id) => {
        setRunning(id);
        const result = await engine.runOnce(id);
        setRunning(null);
        refresh();
        if (result.errors.length) {
          showToast(result.errors[0], 'error');
        } else {
          showToast(`Executed ${result.executed} action(s)`);
        }
      }}
    />
  );
}

interface AutoListProps {
  items: Automation[];
  engine: AutomationEngine;
  rows: number;
  running: number | null;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onNew: () => void;
  onRefresh: () => void;
  onRun: (id: number) => void;
}

function AutoListView({ items, engine, rows, running, showToast, onNew, onRefresh, onRun }: AutoListProps) {
  const { cursor } = useListNav(items.length);

  useInput((input, key) => {
    if (input === 'n') {
      onNew();
      return;
    }
    if (!items.length) return;
    const auto = items[cursor];
    if (!auto) return;

    if (key.return) {
      engine.toggle(auto.id);
      onRefresh();
      showToast(auto.enabled ? 'Disabled' : 'Enabled');
    }
    if (input === 'd') {
      engine.remove(auto.id);
      onRefresh();
      showToast('Removed');
    }
    if (input === 'x' && running === null) {
      onRun(auto.id);
    }
  });

  if (!items.length) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color={theme.textDim}>No automations yet.</Text>
        <Text color={theme.textMuted}>Press <Text color={theme.primary} bold>n</Text> to create one from presets.</Text>
      </Box>
    );
  }

  const itemHeight = 3;
  const viewportHeight = Math.max(1, Math.floor((rows - 8) / itemHeight));
  const scrollStart = Math.max(
    0,
    Math.min(cursor - Math.floor(viewportHeight / 2), items.length - viewportHeight)
  );
  const visible = items.slice(scrollStart, scrollStart + viewportHeight);

  return (
    <Box flexDirection="column">
      <Box paddingX={2} paddingY={0}>
        <Text color={theme.heading} bold>Automations</Text>
        <Text color={theme.textMuted}> ({items.length})</Text>
      </Box>
      {visible.map((auto, i) => {
        const idx = scrollStart + i;
        const selected = idx === cursor;
        const isRunning = running === auto.id;
        const triggerLabel = describeTrigger(auto);
        const actionLabel = auto.actions.map((a) => a.type.replace(/_/g, ' ')).join(', ');

        return (
          <Box key={auto.id} flexDirection="column" paddingLeft={1}>
            <Box>
              <Text color={selected ? theme.primary : theme.textMuted}>
                {selected ? ' > ' : '   '}
              </Text>
              <Text color={auto.enabled ? theme.success : theme.textMuted}>
                {auto.enabled ? '[on] ' : '[off]'}
              </Text>
              <Text color={selected ? theme.text : theme.textDim} bold={selected}>
                {auto.name}
              </Text>
              {isRunning && <Text color={theme.primary}> running...</Text>}
            </Box>
            <Box paddingLeft={5}>
              <Text color={theme.textMuted}>
                {triggerLabel} {'>'} {actionLabel}
              </Text>
            </Box>
            <Box paddingLeft={5}>
              <Text color={theme.textMuted} dimColor>
                runs: {auto.runCount}
                {auto.lastRun ? ` | last: ${auto.lastRun}` : ''}
              </Text>
            </Box>
          </Box>
        );
      })}
      <Box paddingLeft={2} marginTop={1}>
        <Text color={theme.textMuted}>{cursor + 1}/{items.length}</Text>
      </Box>
    </Box>
  );
}

interface PresetsViewProps {
  engine: AutomationEngine;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onDone: () => void;
}

function PresetsView({ engine, showToast, onDone }: PresetsViewProps) {
  const presets = AutomationEngine.PRESETS;
  const { cursor } = useListNav(presets.length);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onDone();
      return;
    }
    if (key.return) {
      const preset = presets[cursor];
      engine.create(preset.name, preset.trigger, preset.actions);
      showToast(`Created: ${preset.name}`);
      onDone();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Text color={theme.heading} bold>Choose a preset automation</Text>
      <Text color={theme.textMuted}>Press enter to create, q to cancel</Text>
      <Text>{' '}</Text>
      {presets.map((p, i) => {
        const selected = i === cursor;
        const actionLabel = p.actions.map((a) => a.type.replace(/_/g, ' ')).join(' + ');
        return (
          <Box key={i} flexDirection="column" paddingLeft={1}>
            <Box>
              <Text color={selected ? theme.primary : theme.textMuted}>
                {selected ? ' > ' : '   '}
              </Text>
              <Text color={selected ? theme.text : theme.textDim} bold={selected}>
                {p.name}
              </Text>
            </Box>
            <Box paddingLeft={5}>
              <Text color={theme.textMuted}>
                when: {p.trigger.type.replace(/_/g, ' ')} {'>'} {actionLabel}
              </Text>
            </Box>
            <Text>{' '}</Text>
          </Box>
        );
      })}
    </Box>
  );
}

function describeTrigger(auto: Automation): string {
  const t = auto.trigger;
  if (t.type === 'someone_likes_my_note') return 'when someone likes my note';
  if (t.type === 'someone_replies_to_me') return 'when someone replies';
  if (t.type === 'new_note_from') return `new note from @${t.handles.join(', @')}`;
  if (t.type === 'new_post_from') return `new post from ${t.subdomains.join(', ')}`;
  if (t.type === 'cron') return `every ${t.intervalMinutes}m`;
  return (t as any).type ?? 'unknown';
}
