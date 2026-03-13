import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import type { SubstackClient } from '../../../lib/substack.js';
import { useAsync, useListNav, useScroll, renderScrollbar, useTerminalSize } from '../hooks.js';
import { theme } from '../theme.js';

const SEP = '\u2502'; // │

interface CommentItem {
  id: number;
  body: string;
  authorHandle: string;
  authorName: string;
  date: Date;
  reactions: number;
  replies: number;
  postTitle?: string;
  contextType: string;
}

interface ThreadComment {
  id: number;
  body: string;
  handle: string;
  name: string;
  date: Date;
  reactions: number;
  isMine: boolean;
}

interface Props {
  client: SubstackClient;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

type Screen = { type: 'list' } | { type: 'thread'; commentId: number };

export function CommentsView({ client, showToast }: Props) {
  const [screen, setScreen] = useState<Screen>({ type: 'list' });

  if (screen.type === 'thread') {
    return (
      <ThreadView
        client={client}
        commentId={screen.commentId}
        showToast={showToast}
        onBack={() => setScreen({ type: 'list' })}
      />
    );
  }

  return (
    <CommentListView
      client={client}
      showToast={showToast}
      onOpenThread={(id) => setScreen({ type: 'thread', commentId: id })}
    />
  );
}

/* ── Comment List ─────────────────────────────────────────────── */

function CommentListView({
  client,
  showToast,
  onOpenThread,
}: {
  client: SubstackClient;
  showToast: Props['showToast'];
  onOpenThread: (id: number) => void;
}) {
  const { rows, columns } = useTerminalSize();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchComments = useCallback(async (): Promise<CommentItem[]> => {
    const profile = await client.ownProfile();
    const myId = profile.id;
    const items: CommentItem[] = [];
    let cursor: string | undefined;

    for (let page = 0; page < 3; page++) {
      const feed = await client.getProfileFeed(myId, { cursor });
      for (const fi of feed.items) {
        if (fi.type !== 'comment' || !fi.comment) continue;
        const c = fi.comment;
        const isNote = fi.context?.typeBucket === 'notes';
        const authorHandle = c.handle ?? fi.context?.users?.[0]?.handle ?? '';
        const authorName = c.name ?? fi.context?.users?.[0]?.name ?? '';
        const reactions = c.reactions
          ? Object.values(c.reactions).reduce((a, b) => a + b, 0)
          : 0;

        items.push({
          id: c.id,
          body: c.body?.replace(/\n/g, ' ') ?? '',
          authorHandle,
          authorName,
          date: new Date(c.date || fi.context?.timestamp || ''),
          reactions,
          replies: c.children_count ?? 0,
          postTitle: fi.post?.title,
          contextType: isNote ? 'note' : (fi.context?.type ?? 'comment'),
        });
      }
      if (!feed.nextCursor || items.length >= 30) break;
      cursor = feed.nextCursor;
    }
    return items;
  }, [client]);

  const { data: comments, loading, error, reload } = useAsync(fetchComments, []);
  const items = comments ?? [];
  const { cursor: cur } = useListNav(items.length, { active: !loading && replyTo === null });

  useInput((input, key) => {
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

    const item = items[cur];
    if (!item) return;

    if (key.return) onOpenThread(item.id);
    if (input === 'r') reload();
    if (input === 'o') {
      const url = `https://substack.com/@${item.authorHandle}/note/c-${item.id}`;
      import('child_process').then(({ exec }) => {
        const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
        exec(`${cmd} "${url}"`);
      });
    }
    if (input === 'l') {
      client.reactToComment(item.id)
        .then(() => showToast('Liked'))
        .catch((e: any) => showToast(e.message, 'error'));
    }
    if (input === 'c') {
      setReplyTo(item.id);
      setReplyText('');
    }
  });

  const ITEM_H = 2;
  const reservedRows = 10 + (replyTo !== null ? 2 : 0);
  const viewportItems = Math.max(1, Math.floor((rows - reservedRows) / ITEM_H));
  const scrollStart = Math.max(0, Math.min(cur - Math.floor(viewportItems / 2), items.length - viewportItems));
  const visible = items.slice(scrollStart, scrollStart + viewportItems);
  const scrollbar = renderScrollbar(viewportItems * ITEM_H, items.length * ITEM_H, scrollStart * ITEM_H);

  const COL = { author: 18, date: 8, likes: 5, re: 4, type: 8 };
  const metaW = 2 + COL.author + 3 + COL.date + 3 + COL.likes + 3 + COL.re + 3 + COL.type + 3;
  const contentW = Math.max(10, columns - metaW - 2);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box paddingX={1}>
        <Text color={theme.primary} bold inverse>{' My Comments '}</Text>
        <Text color={theme.textMuted}> enter=thread  l=like  c=reply  r=refresh</Text>
      </Box>

      {loading ? (
        <Box paddingX={2} paddingY={1}><Text color={theme.primary}>Loading...</Text></Box>
      ) : error ? (
        <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>
      ) : !items.length ? (
        <Box paddingX={2}><Text color={theme.textDim}>No comments found.</Text></Box>
      ) : (
        <>
          <Box paddingLeft={1}>
            <Text color={theme.textMuted}>
              {'  '}{pad('Author', COL.author)} <Text color={theme.border}>{SEP}</Text> {pad('Date', COL.date)} <Text color={theme.border}>{SEP}</Text> {rpad('Likes', COL.likes)} <Text color={theme.border}>{SEP}</Text> {rpad('Re', COL.re)} <Text color={theme.border}>{SEP}</Text> {pad('Type', COL.type)} <Text color={theme.border}>{SEP}</Text> {'Content'}
            </Text>
          </Box>
          <Box paddingLeft={1}>
            <Text color={theme.border}>{'─'.repeat(columns - 2)}</Text>
          </Box>
          <Box flexDirection="row" flexGrow={1}>
            <Box flexDirection="column" flexGrow={1}>
              {visible.map((item, i) => {
                const idx = scrollStart + i;
                const sel = idx === cur;
                const date = fmtDate(item.date);
                const line1 = truncate(item.body, contentW);
                const line2 = item.body.length > contentW ? truncate(item.body.slice(contentW - 1), contentW) : '';
                const indent = ' '.repeat(2 + COL.author + 3 + COL.date + 3 + COL.likes + 3 + COL.re + 3 + COL.type + 3);

                return (
                  <Box key={`${item.id}-${idx}`} flexDirection="column" height={ITEM_H}>
                    <Box>
                      <Text color={sel ? theme.primary : theme.textMuted}>{sel ? '> ' : '  '}</Text>
                      <Text color={sel ? theme.primaryLight : theme.link} bold={sel}>
                        {pad(truncate(`@${item.authorHandle}`, COL.author), COL.author)}
                      </Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{pad(date, COL.date)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(String(item.reactions), COL.likes)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{rpad(String(item.replies), COL.re)}</Text>
                      <Text color={theme.border}> {SEP} </Text>
                      <Text color={theme.textMuted}>{pad(item.contextType, COL.type)}</Text>
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
            <Text color={theme.textMuted}>{cur + 1}/{items.length}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}

/* ── Thread View ──────────────────────────────────────────────── */

function ThreadView({
  client,
  commentId,
  showToast,
  onBack,
}: {
  client: SubstackClient;
  commentId: number;
  showToast: Props['showToast'];
  onBack: () => void;
}) {
  const { rows, columns } = useTerminalSize();
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchThread = useCallback(async (): Promise<{ thread: ThreadComment[]; myIndex: number }> => {
    const profile = await client.ownProfile();
    const myId = profile.id;

    // Get the comment + its parents
    const detail = await client.getComment(commentId);
    const parentComments: ThreadComment[] = (detail.parentComments ?? []).map((p: any) => ({
      id: p.id,
      body: p.body ?? '',
      handle: p.handle ?? '',
      name: p.name ?? '',
      date: new Date(p.date || ''),
      reactions: p.reaction_count ?? 0,
      isMine: p.user_id === myId,
    }));

    const mine: ThreadComment = {
      id: detail.comment.id,
      body: detail.comment.body ?? '',
      handle: detail.comment.handle ?? '',
      name: detail.comment.name ?? '',
      date: new Date(detail.comment.date || ''),
      reactions: detail.comment.reaction_count ?? 0,
      isMine: true,
    };

    // Get replies (children)
    let replies: ThreadComment[] = [];
    if (detail.comment.children_count > 0) {
      try {
        const repliesData = await client.getCommentReplies(commentId);
        for (const branch of repliesData.branches) {
          replies.push({
            id: branch.comment.id,
            body: branch.comment.body ?? '',
            handle: branch.comment.handle ?? '',
            name: branch.comment.name ?? '',
            date: new Date(branch.comment.date || ''),
            reactions: branch.comment.reaction_count ?? 0,
            isMine: branch.comment.user_id === myId,
          });
          for (const d of branch.descendants) {
            replies.push({
              id: d.id,
              body: d.body ?? '',
              handle: d.handle ?? '',
              name: d.name ?? '',
              date: new Date(d.date || ''),
              reactions: d.reaction_count ?? 0,
              isMine: d.user_id === myId,
            });
          }
        }
      } catch {
        // replies fetch may fail, show what we have
      }
    }

    const thread = [...parentComments, mine, ...replies];
    const myIndex = parentComments.length;
    return { thread, myIndex };
  }, [commentId, client]);

  const { data, loading, error } = useAsync(fetchThread, [commentId]);
  const thread = data?.thread ?? [];
  const myIndex = data?.myIndex ?? 0;

  // Build lines for scrollable content
  const contentWidth = Math.max(20, columns - 6);
  const lines: { text: string; color: string; bold?: boolean }[] = [];
  for (let i = 0; i < thread.length; i++) {
    const c = thread[i];
    const isMineComment = c.isMine;
    const isTarget = i === myIndex;
    const prefix = isTarget ? '\u25b6 ' : '  ';
    const header = `${prefix}@${c.handle || c.name}  ${fmtDate(c.date)}  \u2764 ${c.reactions}`;
    lines.push({
      text: header,
      color: isTarget ? theme.primary : (isMineComment ? theme.primaryLight : theme.link),
      bold: isTarget,
    });
    // Wrap body into lines
    const body = c.body || '';
    const bodyLines = wrapText(body, contentWidth);
    for (const bl of bodyLines) {
      lines.push({
        text: `  ${bl}`,
        color: isTarget ? theme.text : theme.textDim,
      });
    }
    // Separator
    lines.push({ text: '', color: theme.textMuted });
  }

  const { scrollOffset, viewportHeight } = useScroll(lines.length, { active: replyTo === null });
  const visibleLines = lines.slice(scrollOffset, scrollOffset + viewportHeight);
  const scrollbar = renderScrollbar(viewportHeight, lines.length, scrollOffset);

  useInput((input, key) => {
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

    if (input === 'q' || key.escape) onBack();
    if (input === 'o') {
      // Find the current thread's root comment handle
      const root = thread[0];
      if (root) {
        const url = `https://substack.com/@${root.handle}/note/c-${commentId}`;
        import('child_process').then(({ exec }) => {
          const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
          exec(`${cmd} "${url}"`);
        });
      }
    }
    if (input === 'c') {
      setReplyTo(commentId);
      setReplyText('');
    }
    if (input === 'l') {
      client.reactToComment(commentId)
        .then(() => showToast('Liked'))
        .catch((e: any) => showToast(e.message, 'error'));
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box paddingX={1}>
        <Text color={theme.primary} bold inverse>{' Thread '}</Text>
        <Text color={theme.textMuted}> q=back  c=reply  l=like  o=browser  {'\u2191\u2193'}=scroll</Text>
      </Box>
      <Box paddingLeft={1}>
        <Text color={theme.border}>{'─'.repeat(columns - 2)}</Text>
      </Box>

      {loading ? (
        <Box paddingX={2} paddingY={1}><Text color={theme.primary}>Loading thread...</Text></Box>
      ) : error ? (
        <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>
      ) : (
        <Box flexDirection="row" flexGrow={1}>
          <Box flexDirection="column" flexGrow={1} paddingX={1}>
            {visibleLines.map((line, i) => (
              <Text key={i} color={line.color} bold={line.bold}>{line.text || ' '}</Text>
            ))}
          </Box>
          <Box flexDirection="column" width={1}>
            {scrollbar.slice(0, viewportHeight).map((ch, i) => (
              <Text key={i} color={ch === '█' ? theme.primary : theme.textMuted}>{ch}</Text>
            ))}
          </Box>
        </Box>
      )}

      {replyTo !== null && (
        <Box paddingX={1} borderStyle="single" borderColor={theme.primary}>
          <Text color={theme.primary}>reply: </Text>
          <Text color={theme.text}>{replyText}<Text color={theme.textMuted}>|</Text></Text>
        </Box>
      )}
    </Box>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

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
function wrapText(text: string, width: number): string[] {
  if (!text) return [''];
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) { lines.push(''); continue; }
    let remaining = paragraph;
    while (remaining.length > width) {
      let breakAt = remaining.lastIndexOf(' ', width);
      if (breakAt <= 0) breakAt = width;
      lines.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
    if (remaining) lines.push(remaining);
  }
  return lines.length ? lines : [''];
}
