#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { tools } from './tools.js';

function createServer(): McpServer {
  const server = new McpServer({
    name: 'postcli-substack',
    version: process.env.npm_package_version || '0.1.0',
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

  return server;
}

export async function startMcpServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Allow direct execution: node mcp/index.js
const isDirectRun = process.argv[1]?.endsWith('mcp/index.js') ||
                    process.argv[1]?.endsWith('mcp/index.ts');
if (isDirectRun) {
  startMcpServer().catch((err) => {
    console.error('MCP server failed:', err);
    process.exit(1);
  });
}
