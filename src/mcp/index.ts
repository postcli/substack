#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tools } from './tools.js';

const server = new McpServer({
  name: 'wrtr',
  version: '1.0.0',
});

for (const tool of tools) {
  const shape: Record<string, any> = {};
  const zodShape = tool.schema.shape;
  for (const [key, value] of Object.entries(zodShape)) {
    shape[key] = value;
  }

  server.tool(tool.name, tool.description, shape, async (args) => {
    try {
      const result = await tool.handler(args);
      return { content: [{ type: 'text' as const, text: result }] };
    } catch (err: any) {
      return {
        content: [{ type: 'text' as const, text: `Error: ${err.message}` }],
        isError: true,
      };
    }
  });
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('MCP server failed:', err);
  process.exit(1);
});
