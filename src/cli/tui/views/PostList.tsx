import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SubstackClient } from '../../../lib/substack.js';
import type { PreviewPost } from '../../../lib/models.js';
import { useAsync, useListNav, renderScrollbar, useTerminalSize } from '../hooks.js';
import { theme } from '../theme.js';

const SUB_TABS = ['mine', 'following', 'general'] as const;
type SubTab = (typeof SUB_TABS)[number];
const SEP = '\u2502'; // │

interface Props {
  client: SubstackClient;
  onSelect: (post: PreviewPost) => void;
}

export function PostListView({ client, onSelect }: Props) {
  const { rows, columns } = useTerminalSize();
  const [subTab, setSubTab] = useState<SubTab>('mine');

  const fetchPosts = useCallback(async () => {
    if (subTab === 'mine') {
      const profile = await client.ownProfile();
      const subs = profile.publications.map((p) => p.subdomain);
      const results = await Promise.all(
        subs.map(async (sub) => {
          const subPosts = await client.listPosts({ subdomain: sub, limit: 30 });
          for (const p of subPosts) p.publicationSubdomain = sub;
          return subPosts;
        })
      );
      return results.flat().sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, 50);
    }
    const tab = subTab === 'following' ? 'subscribed' : 'for-you';
    const feed = await client.getFeed({ tab });
    const posts: PreviewPost[] = [];
    for (const item of feed.items) {
      if (item.type === 'post' && item.post) {
        const { PreviewPost: PP } = await import('../../../lib/models.js');
        const p = new PP(item.post);
        p.publicationSubdomain = item.post.publishedBylines?.[0]?.handle ?? '';
        posts.push(p);
      }
    }
    return posts;
  }, [subTab, client]);

  const { data: posts, loading, error, reload } = useAsync(fetchPosts, [subTab]);
  const items = posts ?? [];
  const { cursor } = useListNav(items.length, { active: !loading });

  useInput((input, key) => {
    if (key.return && items[cursor]) onSelect(items[cursor]);
    if (input === 'r') reload();
    if (input === 'o' && items[cursor]) {
      const url = items[cursor].canonicalUrl;
      if (url) {
        import('child_process').then(({ exec }) => {
          const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
          exec(`${cmd} "${url}"`);
        });
      }
    }
    if (key.leftArrow && !loading) {
      const idx = SUB_TABS.indexOf(subTab);
      if (idx > 0) setSubTab(SUB_TABS[idx - 1]);
    }
    if (key.rightArrow && !loading) {
      const idx = SUB_TABS.indexOf(subTab);
      if (idx < SUB_TABS.length - 1) setSubTab(SUB_TABS[idx + 1]);
    }
  });

  // 2 lines per item: line1=metadata cols, line2=title/subtitle
  const ITEM_H = 2;
  const reservedRows = 10;
  const viewportItems = Math.max(1, Math.floor((rows - reservedRows) / ITEM_H));
  const scrollStart = Math.max(0, Math.min(cursor - Math.floor(viewportItems / 2), items.length - viewportItems));
  const visible = items.slice(scrollStart, scrollStart + viewportItems);
  const scrollbar = renderScrollbar(viewportItems * ITEM_H, items.length * ITEM_H, scrollStart * ITEM_H);

  // Fixed columns for metadata
  const COL = { pub: 16, date: 8, likes: 5, cmts: 5, words: 6 };
  const metaW = COL.pub + COL.date + COL.likes + COL.cmts + COL.words + 8; // 8 = separators + cursor
  const contentW = Math.max(20, columns - metaW - 2);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <SubTabBar tabs={SUB_TABS} active={subTab} />

      {loading ? (
        <Box paddingX={2} paddingY={1}><Text color={theme.primary}>Loading...</Text></Box>
      ) : error ? (
        <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>
      ) : !items.length ? (
        <Box paddingX={2}><Text color={theme.textDim}>No posts.</Text></Box>
      ) : (
        <>
          {/* Header */}
          <Box paddingLeft={1}>
            <Text color={theme.textMuted}>
              {'  '}{pad('Publication', COL.pub)} <Text color={theme.border}>{SEP}</Text> {pad('Date', COL.date)} <Text color={theme.border}>{SEP}</Text> {rpad('Likes', COL.likes)} <Text color={theme.border}>{SEP}</Text> {rpad('Cmts', COL.cmts)} <Text color={theme.border}>{SEP}</Text> {rpad('Words', COL.words)} <Text color={theme.border}>{SEP}</Text> {'Content'}
            </Text>
          </Box>
          <Box paddingLeft={1}>
            <Text color={theme.border}>{'─'.repeat(columns - 2)}</Text>
          </Box>
          {/* Rows */}
          <Box flexDirection="row" flexGrow={1}>
            <Box flexDirection="column" flexGrow={1}>
              {visible.map((post, i) => {
                const idx = scrollStart + i;
                const sel = idx === cursor;
                const pub = truncate(post.publicationSubdomain ?? '', COL.pub);
                const date = fmtDate(post.publishedAt);
                const title = truncate(post.title, contentW);
                const subtitle = post.subtitle ? truncate(post.subtitle, contentW) : '';

                return (
                  <Box key={post.id} flexDirection="column" height={ITEM_H}>
                    <Box>
                      <Text color={sel ? theme.primary : theme.textMuted}>{sel ? '> ' : '  '}</Text>
                      <Text color={sel ? theme.primaryLight : theme.textDim}>{pad(pub, COL.pub)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{pad(date, COL.date)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(String(post.reactionCount ?? 0), COL.likes)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(String(post.commentCount ?? 0), COL.cmts)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(post.wordcount ? String(post.wordcount) : '-', COL.words)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={sel ? theme.text : theme.textDim} bold={sel}>{title}</Text>
                    </Box>
                    <Box>
                      <Text>{' '.repeat(2 + COL.pub + 3 + COL.date + 3 + COL.likes + 3 + COL.cmts + 3 + COL.words + 3)}</Text>
                      <Text color={theme.textMuted} dimColor>{subtitle || ' '}</Text>
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
          <Box paddingX={2}>
            <Text color={theme.textMuted}>{cursor + 1}/{items.length}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}

function SubTabBar({ tabs, active }: { tabs: readonly string[]; active: string }) {
  return (
    <Box paddingX={1}>
      {tabs.map((st) => (
        <React.Fragment key={st}>
          <Text
            color={active === st ? theme.primary : theme.textMuted}
            bold={active === st}
            inverse={active === st}
          >
            {` ${st} `}
          </Text>
          <Text> </Text>
        </React.Fragment>
      ))}
      <Text color={theme.textMuted}>({'\u2190'}/{'\u2192'})</Text>
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
