import React from 'react';
import { Box, Text, useInput } from 'ink';
import type { SubstackClient } from '../../../lib/substack.js';
import { useAsync } from '../hooks.js';
import { theme, LOGO } from '../theme.js';

interface Props {
  client: SubstackClient;
}

export function ProfileView({ client }: Props) {
  const { data: profile, loading, error } = useAsync(
    () => client.ownProfile(),
    []
  );

  useInput((input) => {
    if (input === 'o' && profile?.handle) {
      const url = `https://substack.com/@${profile.handle}`;
      import('child_process').then(({ execFile }) => {
        const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
        execFile(cmd, [url]);
      });
    }
  });

  if (loading) {
    return (
      <Box paddingX={2} paddingY={1}>
        <Text color={theme.primary}>⠋ Loading profile...</Text>
      </Box>
    );
  }
  if (error) return <Box paddingX={2}><Text color={theme.error}>Error: {error}</Text></Box>;
  if (!profile) return <Box paddingX={2}><Text color={theme.textDim}>No profile found.</Text></Box>;

  return (
    <Box flexDirection="row" paddingX={2} paddingY={1} gap={3}>
      <Box flexDirection="column">
        {LOGO.map((line, i) => (
          <Text key={i} color={theme.primary}>{line}</Text>
        ))}
      </Box>
      <Box flexDirection="column" gap={0}>
        <Box gap={1}>
          <Text bold color={theme.text}>{profile.name}</Text>
          <Text color={theme.primaryLight}>@{profile.handle}</Text>
        </Box>
        {profile.bio && (
          <Box marginTop={1} width={60}>
            <Text color={theme.textDim}>{profile.bio}</Text>
          </Box>
        )}
        <Box marginTop={1} flexDirection="column">
          <Text bold color={theme.heading}>Publications</Text>
          {profile.publications.map((pub) => (
            <Box key={pub.id} paddingLeft={1} gap={1}>
              <Text color={theme.primary}>▸</Text>
              <Text bold color={theme.text}>{pub.name}</Text>
              <Text color={theme.textMuted}>{pub.subdomain}.substack.com</Text>
              <Text color={theme.textMuted} dimColor>{pub.role}</Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
