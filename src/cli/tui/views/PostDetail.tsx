import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import TurndownService from 'turndown';
import type { SubstackClient } from '../../../lib/substack.js';
import { useAsync, useScroll, useTerminalSize, renderScrollbar } from '../hooks.js';
import { theme } from '../theme.js';

interface Props {
  client: SubstackClient;
  slug: string;
  subdomain?: string;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});
turndown.remove(['form', 'input', 'iframe', 'script', 'style', 'noscript']);
turndown.addRule('subscription-widget', {
  filter: (node) => {
    const cls = node.getAttribute?.('class') || '';
    const component = node.getAttribute?.('data-component-name') || '';
    return cls.includes('subscription-widget') || component.includes('Subscribe');
  },
  replacement: () => '',
});

interface ContentLine {
  text: string;
  type: 'title' | 'subtitle' | 'meta' | 'separator' | 'h2' | 'h3' | 'quote' | 'code' | 'bold-line' | 'list' | 'link' | 'text';
}

function parseLines(post: {
  title: string;
  subtitle: string;
  authors: { name: string; handle: string }[];
  publishedAt: Date;
  canonicalUrl: string;
  wordcount?: number;
  reactionCount?: number;
  commentCount?: number;
  restacks?: number;
  htmlBody: string;
  truncatedBody: string;
  postTags: string[];
}): ContentLine[] {
  const lines: ContentLine[] = [];

  // Header
  lines.push({ text: post.title, type: 'title' });
  if (post.subtitle) lines.push({ text: post.subtitle, type: 'subtitle' });
  lines.push({ text: '', type: 'text' });

  if (post.authors.length) {
    lines.push({
      text: post.authors.map((a) => `${a.name} (@${a.handle})`).join(', '),
      type: 'meta',
    });
  }

  const date = post.publishedAt.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const stats: string[] = [date];
  if (post.wordcount) stats.push(`${post.wordcount} words`);
  if (post.reactionCount) stats.push(`♥ ${post.reactionCount}`);
  if (post.commentCount) stats.push(`◆ ${post.commentCount}`);
  if (post.restacks) stats.push(`↻ ${post.restacks}`);
  lines.push({ text: stats.join('  ·  '), type: 'meta' });

  if (post.postTags?.length) {
    lines.push({ text: post.postTags.map((t) => `#${t}`).join('  '), type: 'meta' });
  }

  lines.push({ text: post.canonicalUrl, type: 'link' });
  lines.push({ text: '', type: 'text' });
  lines.push({ text: '─', type: 'separator' });
  lines.push({ text: '', type: 'text' });

  // Body
  const md = post.htmlBody
    ? turndown.turndown(post.htmlBody).replace(/\n{3,}/g, '\n\n').trim()
    : post.truncatedBody || '';

  for (const line of md.split('\n')) {
    if (line.startsWith('## ')) {
      lines.push({ text: line, type: 'h2' });
    } else if (line.startsWith('### ')) {
      lines.push({ text: line, type: 'h3' });
    } else if (line.startsWith('> ')) {
      lines.push({ text: line, type: 'quote' });
    } else if (line.startsWith('```') || line.startsWith('    ')) {
      lines.push({ text: line, type: 'code' });
    } else if (line.startsWith('- ') || line.match(/^\d+\. /)) {
      lines.push({ text: line, type: 'list' });
    } else if (line.startsWith('**') && line.endsWith('**')) {
      lines.push({ text: line, type: 'bold-line' });
    } else {
      lines.push({ text: line, type: 'text' });
    }
  }

  return lines;
}

function renderLine(line: ContentLine, width: number): React.ReactNode {
  switch (line.type) {
    case 'title':
      return <Text bold color={theme.text}>{line.text}</Text>;
    case 'subtitle':
      return <Text color={theme.textDim} italic>{line.text}</Text>;
    case 'meta':
      return <Text color={theme.textMuted}>{line.text}</Text>;
    case 'separator':
      return <Text color={theme.border}>{'─'.repeat(Math.min(width - 6, 60))}</Text>;
    case 'h2':
      return <Text bold color={theme.heading}>{line.text}</Text>;
    case 'h3':
      return <Text bold color={theme.headingSub}>{line.text}</Text>;
    case 'quote':
      return (
        <Box>
          <Text color={theme.primary}>│ </Text>
          <Text color={theme.quote} italic>{line.text.slice(2)}</Text>
        </Box>
      );
    case 'code':
      return <Text color={theme.accent}>{line.text}</Text>;
    case 'bold-line':
      return <Text bold color={theme.bold}>{line.text}</Text>;
    case 'list':
      return (
        <Box>
          <Text color={theme.primary}>{line.text.startsWith('-') ? '  ▪ ' : '  '}</Text>
          <Text color={theme.text}>{line.text.replace(/^- /, '').replace(/^\d+\. /, '')}</Text>
        </Box>
      );
    case 'link':
      return <Text color={theme.link} underline>{line.text}</Text>;
    default:
      return <Text color={theme.text}>{line.text}</Text>;
  }
}

export function PostDetailView({ client, slug, subdomain }: Props) {
  const { columns } = useTerminalSize();

  const { data: post, loading, error } = useAsync(
    () => client.getPost(slug, subdomain),
    [slug, subdomain]
  );

  const content = useMemo(() => {
    if (!post) return [];
    return parseLines(post);
  }, [post]);

  const { scrollOffset, viewportHeight, maxScroll } = useScroll(content.length, {
    active: !!post,
  });

  if (loading) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color={theme.primary}>⠋ Loading post...</Text>
      </Box>
    );
  }
  if (error) return <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>;
  if (!post) return <Box paddingX={2}><Text color={theme.textDim}>Post not found.</Text></Box>;

  const visibleLines = content.slice(scrollOffset, scrollOffset + viewportHeight);
  const scrollbar = renderScrollbar(viewportHeight, content.length, scrollOffset);
  const scrollPct =
    content.length <= viewportHeight
      ? 100
      : Math.round((scrollOffset / maxScroll) * 100);

  return (
    <Box flexDirection="row">
      <Box flexDirection="column" flexGrow={1} paddingX={2}>
        {visibleLines.map((line, i) => (
          <Box key={scrollOffset + i}>
            {renderLine(line, columns)}
          </Box>
        ))}
      </Box>
      <Box flexDirection="column" width={1}>
        {scrollbar.slice(0, viewportHeight).map((ch, i) => (
          <Text key={i} color={ch === '█' ? theme.primary : theme.textMuted}>{ch}</Text>
        ))}
      </Box>
      <Box position="absolute" marginLeft={columns - 8}>
        <Text color={theme.textMuted}> {scrollPct}%</Text>
      </Box>
    </Box>
  );
}
