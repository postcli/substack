import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SubstackClient } from '../../../lib/substack.js';
import type { Note } from '../../../lib/models.js';
import { useAsync, useListNav, renderScrollbar, useTerminalSize } from '../hooks.js';
import { theme } from '../theme.js';

const SUB_TABS = ['mine', 'following', 'general'] as const;
type SubTab = (typeof SUB_TABS)[number];
const SEP = '\u2502'; // │

interface Props {
  client: SubstackClient;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export function NotesView({ client, showToast }: Props) {
  const { rows, columns } = useTerminalSize();
  const [subTab, setSubTab] = useState<SubTab>('following');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchNotes = useCallback(async (): Promise<Note[]> => {
    const { Note: NoteModel } = await import('../../../lib/models.js');

    if (subTab === 'mine') {
      // Use profile feed endpoint for accurate results
      const profile = await client.ownProfile();
      const notes: Note[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 3; page++) {
        const feed = await client.getProfileFeed(profile.id, { cursor });
        for (const item of feed.items) {
          if (item.type === 'comment' && item.context?.typeBucket === 'notes' && item.comment) {
            notes.push(new NoteModel(item));
          }
        }
        if (!feed.nextCursor || notes.length >= 30) break;
        cursor = feed.nextCursor;
      }
      return notes;
    }
    if (subTab === 'following') {
      return client.listNotes({ limit: 25 });
    }
    // general: for-you feed
    const feed = await client.getFeed({ tab: 'for-you' });
    const notes: Note[] = [];
    for (const item of feed.items) {
      if (item.type === 'comment' && item.context?.typeBucket === 'notes' && item.comment) {
        notes.push(new NoteModel(item));
      }
    }
    return notes;
  }, [subTab, client]);

  const { data: notes, loading, error, reload } = useAsync(fetchNotes, [subTab]);
  const items = notes ?? [];
  const { cursor } = useListNav(items.length, { active: !loading && replyTo === null });

  useInput((input, key) => {
    if (replyTo === null && !loading) {
      if (key.leftArrow) {
        const idx = SUB_TABS.indexOf(subTab);
        if (idx > 0) setSubTab(SUB_TABS[idx - 1]);
        return;
      }
      if (key.rightArrow) {
        const idx = SUB_TABS.indexOf(subTab);
        if (idx < SUB_TABS.length - 1) setSubTab(SUB_TABS[idx + 1]);
        return;
      }
    }

    if (loading || !items.length) return;

    if (replyTo !== null) {
      if (key.escape) { setReplyTo(null); setReplyText(''); return; }
      if (key.return && replyText.trim()) {
        const text = replyText.trim();
        const id = replyTo;
        setReplyTo(null);
        setReplyText('');
        client.replyToNote(id, text)
          .then(() => showToast('Reply sent'))
          .catch((e: any) => showToast(e.message, 'error'));
        return;
      }
      if (key.backspace || key.delete) { setReplyText((t) => t.slice(0, -1)); return; }
      if (input && !key.ctrl && !key.meta) { setReplyText((t) => t + input); }
      return;
    }

    const note = items[cursor];
    if (!note) return;

    if (input === 'r') reload();
    if (input === 'o') {
      const url = `https://substack.com/@${note.author.handle}/note/c-${note.id}`;
      import('child_process').then(({ execFile }) => {
        const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
        execFile(cmd, [url]);
      });
    }
    if (input === 'l') {
      client.reactToComment(note.id)
        .then(() => showToast('Liked'))
        .catch((e: any) => showToast(e.message, 'error'));
    }
    if (input === 's') {
      client.restackNote(note.id)
        .then(() => showToast('Restacked'))
        .catch((e: any) => showToast(e.message, 'error'));
    }
    if (input === 'c') {
      setReplyTo(note.id);
      setReplyText('');
    }
  });

  // 2 lines: line1=author+date+stats, line2=content continuation
  const ITEM_H = 2;
  const reservedRows = 10 + (replyTo !== null ? 2 : 0);
  const viewportItems = Math.max(1, Math.floor((rows - reservedRows) / ITEM_H));
  const scrollStart = Math.max(0, Math.min(cursor - Math.floor(viewportItems / 2), items.length - viewportItems));
  const visible = items.slice(scrollStart, scrollStart + viewportItems);
  const scrollbar = renderScrollbar(viewportItems * ITEM_H, items.length * ITEM_H, scrollStart * ITEM_H);

  // Fixed cols for metadata, content takes remaining
  const COL = { author: 18, date: 8, likes: 5, re: 4 };
  const metaW = 2 + COL.author + 3 + COL.date + 3 + COL.likes + 3 + COL.re + 3; // cursor + cols + separators
  const contentW = Math.max(10, columns - metaW - 2);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Sub-tab bar */}
      <Box paddingX={1}>
        {SUB_TABS.map((st) => (
          <React.Fragment key={st}>
            <Text color={subTab === st ? theme.primary : theme.textMuted} bold={subTab === st} inverse={subTab === st}>
              {` ${st} `}
            </Text>
            <Text> </Text>
          </React.Fragment>
        ))}
        <Text color={theme.textMuted}>({'\u2190'}/{'\u2192'})</Text>
      </Box>

      {loading ? (
        <Box paddingX={2} paddingY={1}><Text color={theme.primary}>Loading...</Text></Box>
      ) : error ? (
        <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>
      ) : !items.length ? (
        <Box paddingX={2}><Text color={theme.textDim}>No notes.</Text></Box>
      ) : (
        <>
          {/* Header */}
          <Box paddingLeft={1}>
            <Text color={theme.textMuted}>
              {'  '}{pad('Author', COL.author)} <Text color={theme.border}>{SEP}</Text> {pad('Date', COL.date)} <Text color={theme.border}>{SEP}</Text> {rpad('Likes', COL.likes)} <Text color={theme.border}>{SEP}</Text> {rpad('Re', COL.re)} <Text color={theme.border}>{SEP}</Text> {'Content'}
            </Text>
          </Box>
          <Box paddingLeft={1}>
            <Text color={theme.border}>{'─'.repeat(columns - 2)}</Text>
          </Box>
          {/* Rows */}
          <Box flexDirection="row" flexGrow={1}>
            <Box flexDirection="column" flexGrow={1}>
              {visible.map((note, i) => {
                const idx = scrollStart + i;
                const sel = idx === cursor;
                const date = fmtDate(note.publishedAt);
                const body = note.body.replace(/\n/g, ' ');
                const reactions = note.reactions
                  ? Object.values(note.reactions).reduce((a, b) => a + b, 0)
                  : 0;
                // Split body into 2 lines
                const line1 = truncate(body, contentW);
                const line2 = body.length > contentW ? truncate(body.slice(contentW - 1), contentW) : '';
                const indent = ' '.repeat(2 + COL.author + 3 + COL.date + 3 + COL.likes + 3 + COL.re + 3);

                return (
                  <Box key={note.id} flexDirection="column" height={ITEM_H}>
                    <Box>
                      <Text color={sel ? theme.primary : theme.textMuted}>{sel ? '> ' : '  '}</Text>
                      <Text color={sel ? theme.primaryLight : theme.link} bold={sel}>
                        {pad(truncate(`@${note.author.handle}`, COL.author), COL.author)}
                      </Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{pad(date, COL.date)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(String(reactions), COL.likes)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(String(note.childrenCount), COL.re)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={sel ? theme.text : theme.textDim}>{line1}</Text>
                    </Box>
                    <Box>
                      <Text>{indent}</Text>
                      <Text color={sel ? theme.textDim : theme.textMuted} dimColor>{line2 || ' '}</Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            <Box flexDirection="column" width={1}>
              {scrollbar.slice(0, viewportItems * ITEM_H).map((ch, i) => (
                <Text key={i} color={ch === '█' ? theme.primary : theme.textMuted}>{ch}</Text>
              ))}
            </Box>
          </Box>
          {replyTo !== null && (
            <Box paddingX={1} borderStyle="single" borderColor={theme.primary}>
              <Text color={theme.primary}>reply: </Text>
              <Text color={theme.text}>{replyText}<Text color={theme.textMuted}>|</Text></Text>
            </Box>
          )}
          <Box paddingX={2}>
            <Text color={theme.textMuted}>{cursor + 1}/{items.length}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}

function pad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : s + ' '.repeat(w - s.length);
}
function rpad(s: string, w: number): string {
  return s.length >= w ? s.slice(0, w) : ' '.repeat(w - s.length) + s;
}
function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '\u2026';
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
