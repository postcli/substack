import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { SubstackClient } from '../../../lib/substack.js';
import { useAsync, useListNav, renderScrollbar, useTerminalSize } from '../hooks.js';
import { theme } from '../theme.js';

interface Props {
  client: SubstackClient;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export function FeedView({ client, showToast }: Props) {
  const { rows, columns } = useTerminalSize();

  const { data: feed, loading, error, reload } = useAsync(
    () => client.getFeed({}),
    []
  );

  const items = feed?.items ?? [];
  const { cursor } = useListNav(items.length, { active: !loading });

  useInput((input) => {
    if (loading || !items.length) return;
    const item = items[cursor];
    if (!item) return;

    if (input === 'r') reload();
    if (input === 'o') {
      let url: string | undefined;
      if (item.type === 'post' && item.post?.canonical_url) {
        url = item.post.canonical_url;
      } else if (item.comment) {
        const handle = item.comment.handle ?? item.context?.users?.[0]?.handle ?? '';
        if (handle) {
          url = `https://substack.com/@${handle}/note/c-${item.comment.id}`;
        }
      }
      if (url) {
        import('child_process').then(({ execFile }) => {
          const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
          execFile(cmd, [url]);
        });
      }
    }
    if (input === 'l' && item.comment?.id) {
      client.reactToComment(item.comment.id)
        .then(() => showToast('Liked'))
        .catch((e: any) => showToast(e.message, 'error'));
    }
    if (input === 's' && item.comment?.id) {
      client.restackNote(item.comment.id)
        .then(() => showToast('Restacked'))
        .catch((e: any) => showToast(e.message, 'error'));
    }
  });

  if (loading) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color={theme.primary}>Loading feed...</Text>
      </Box>
    );
  }
  if (error) return <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>;
  if (!items.length) return <Box paddingX={2}><Text color={theme.textDim}>Feed is empty.</Text></Box>;

  const ITEM_H = 2;
  const reservedRows = 8;
  const viewportItems = Math.max(1, Math.floor((rows - reservedRows) / ITEM_H));
  const scrollStart = Math.max(
    0,
    Math.min(cursor - Math.floor(viewportItems / 2), items.length - viewportItems)
  );
  const visible = items.slice(scrollStart, scrollStart + viewportItems);
  const scrollbar = renderScrollbar(viewportItems * ITEM_H, items.length * ITEM_H, scrollStart * ITEM_H);
  const maxBodyLen = Math.max(20, columns - 8);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box flexDirection="row" flexGrow={1}>
        <Box flexDirection="column" flexGrow={1}>
          {visible.map((item, i) => {
            const idx = scrollStart + i;
            const selected = idx === cursor;
            const author = item.context?.users?.[0];
            const ts = item.context?.timestamp
              ? new Date(item.context.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : '';
            const typeLabel = item.context?.type ?? item.type;
            const rawBody = item.comment?.body
              ? item.comment.body.replace(/\n/g, ' ')
              : item.post?.title ?? '';
            const body = rawBody.length > maxBodyLen ? rawBody.slice(0, maxBodyLen) + '...' : rawBody;

            return (
              <Box key={item.entity_key} flexDirection="column" paddingLeft={1} height={ITEM_H}>
                <Box>
                  <Text color={selected ? theme.primary : theme.textMuted}>
                    {selected ? '> ' : '  '}
                  </Text>
                  {author && (
                    <Text color={selected ? theme.primaryLight : theme.link} bold={selected}>
                      @{author.handle}
                    </Text>
                  )}
                  <Text color={theme.textMuted}> {typeLabel} {ts}</Text>
                </Box>
                <Text color={selected ? theme.text : theme.textDim} wrap="truncate">
                  {'    '}{body}
                </Text>
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
      <Box paddingX={2}>
        <Text color={theme.textMuted}>{cursor + 1}/{items.length}</Text>
      </Box>
    </Box>
  );
}
