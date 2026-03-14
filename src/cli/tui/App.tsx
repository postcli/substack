import React, { useState, useCallback } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import type { SubstackClient } from '../../lib/substack.js';
import { PostListView } from './views/PostList.js';
import { PostDetailView } from './views/PostDetail.js';
import { NotesView } from './views/Notes.js';
import { FeedView } from './views/Feed.js';
import { ProfileView } from './views/Profile.js';
import { CommentsView } from './views/Comments.js';
import { AutomationsView } from './views/Automations.js';
import { theme, LOGO_HEADER } from './theme.js';
import { useToast } from './hooks.js';
import type { PreviewPost } from '../../lib/models.js';
import type { AutomationEngine } from '../automations/engine.js';

const TABS = ['posts', 'notes', 'comments', 'feed', 'auto', 'profile'] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  posts: 'Posts',
  notes: 'Notes',
  comments: 'Comments',
  feed: 'Feed',
  auto: 'Auto',
  profile: 'Me',
};

interface AppProps {
  client: SubstackClient;
  engine: AutomationEngine;
}

type Screen =
  | { type: 'list' }
  | { type: 'post-detail'; slug: string; subdomain?: string; title: string; url: string };

export function App({ client, engine }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const termRows = stdout?.rows ?? 24;
  const [tab, setTab] = useState<Tab>('notes');
  const [screen, setScreen] = useState<Screen>({ type: 'list' });
  const { toast, showToast } = useToast();

  useInput((input, key) => {
    if (screen.type !== 'list') {
      if (input === 'q' || key.escape) {
        setScreen({ type: 'list' });
      }
      if (input === 'o' && screen.type === 'post-detail') {
        import('child_process').then(({ execFile }) => {
          const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
          execFile(cmd, [screen.url]);
        });
      }
      return;
    }

    if (input === 'q') {
      exit();
      return;
    }

    const num = parseInt(input, 10);
    if (num >= 1 && num <= TABS.length) {
      setTab(TABS[num - 1]);
    }
    if (key.tab) {
      const idx = TABS.indexOf(tab);
      setTab(TABS[(idx + 1) % TABS.length]);
    }
  });

  const handleSelectPost = useCallback((post: PreviewPost) => {
    setScreen({
      type: 'post-detail',
      slug: post.slug,
      subdomain: post.publicationSubdomain,
      title: post.title,
      url: post.canonicalUrl,
    });
  }, []);

  return (
    <Box flexDirection="column" width="100%" height={termRows} overflowY="hidden">
      {/* Header: logo + tabs (3 lines) */}
      <Box paddingX={1} borderStyle="round" borderColor={theme.border}>
        <Box flexDirection="column" marginRight={1}>
          {LOGO_HEADER.map((line, i) => (
            <Text key={i} color={theme.primary} bold>{line}</Text>
          ))}
        </Box>
        <Box flexDirection="column" justifyContent="center">
          <Box gap={1}>
            <Text color={theme.primaryLight} bold>PostCLI</Text>
            <Text color={theme.textMuted}>substack</Text>
            {toast && (
              <Text color={toast.type === 'success' ? theme.success : theme.error}>
                {toast.text}
              </Text>
            )}
          </Box>
          <Box gap={0}>
            {screen.type === 'post-detail' ? (
              <Text color={theme.text} bold wrap="truncate">{screen.title}</Text>
            ) : (
              TABS.map((t, i) => (
                <React.Fragment key={t}>
                  <Text
                    color={tab === t ? theme.primary : theme.textMuted}
                    bold={tab === t}
                    inverse={tab === t}
                  >
                    {` ${i + 1} ${TAB_LABELS[t]} `}
                  </Text>
                  <Text> </Text>
                </React.Fragment>
              ))
            )}
          </Box>
        </Box>
      </Box>
      {/* Content: fills remaining space */}
      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        {screen.type === 'post-detail' ? (
          <PostDetailView client={client} slug={screen.slug} subdomain={screen.subdomain} />
        ) : (
          <>
            {tab === 'posts' && <PostListView client={client} onSelect={handleSelectPost} />}
            {tab === 'notes' && <NotesView client={client} showToast={showToast} />}
            {tab === 'comments' && <CommentsView client={client} showToast={showToast} />}
            {tab === 'feed' && <FeedView client={client} showToast={showToast} />}
            {tab === 'auto' && <AutomationsView engine={engine} showToast={showToast} />}
            {tab === 'profile' && <ProfileView client={client} />}
          </>
        )}
      </Box>
      {/* Footer: 1 line */}
      <Footer screen={screen} tab={tab} />
    </Box>
  );
}

function Footer({ screen, tab }: { screen: Screen; tab: Tab }) {
  let keys: [string, string][];
  if (screen.type === 'post-detail') {
    keys = [['\u2191\u2193', 'scroll'], ['d/u', 'page'], ['o', 'browser'], ['q', 'back']];
  } else if (tab === 'notes') {
    keys = [['\u2191\u2193', 'nav'], ['\u2190\u2192', 'tab'], ['l', 'like'], ['s', 'restack'], ['c', 'reply'], ['o', 'browser'], ['r', 'refresh'], ['q', 'quit']];
  } else if (tab === 'comments') {
    keys = [['\u2191\u2193', 'nav'], ['enter', 'thread'], ['l', 'like'], ['c', 'reply'], ['o', 'browser'], ['r', 'refresh'], ['q', 'quit']];
  } else if (tab === 'feed') {
    keys = [['\u2191\u2193', 'nav'], ['l', 'like'], ['s', 'restack'], ['o', 'browser'], ['r', 'refresh'], ['q', 'quit']];
  } else if (tab === 'auto') {
    keys = [['\u2191\u2193', 'nav'], ['enter', 'toggle'], ['n', 'new'], ['d', 'del'], ['x', 'run'], ['q', 'quit']];
  } else if (tab === 'posts') {
    keys = [['\u2191\u2193', 'nav'], ['\u2190\u2192', 'tab'], ['enter', 'open'], ['o', 'browser'], ['r', 'refresh'], ['q', 'quit']];
  } else if (tab === 'profile') {
    keys = [['o', 'browser'], ['q', 'quit']];
  } else {
    keys = [['\u2191\u2193', 'nav'], ['enter', 'open'], ['r', 'refresh'], ['q', 'quit']];
  }

  return (
    <Box paddingX={1}>
      {keys.map(([key, label]) => (
        <Box key={key}>
          <Text color={theme.primary} bold> {key}</Text>
          <Text color={theme.textMuted}> {label} </Text>
        </Box>
      ))}
    </Box>
  );
}
