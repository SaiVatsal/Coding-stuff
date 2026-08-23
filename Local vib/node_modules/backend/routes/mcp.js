import express from 'express';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { getSettings } from './settings.js';

const router = express.Router();
const clients = new Map(); // name -> client instance

// Connects to a single MCP server
async function connectServer(server) {
  if (clients.has(server.name)) {
    return clients.get(server.name);
  }

  console.log(`Connecting to MCP server: ${server.name} (${server.url})`);
  const client = new Client(
    { name: 'nitrocode-client', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  let transport;
  const isHttp = server.url.startsWith('http://') || server.url.startsWith('https://');

  if (isHttp) {
    let url;
    try {
      url = new URL(server.url);
    } catch (e) {
      throw new Error(`Invalid MCP server URL: ${server.url}`);
    }
    // SSRF protection: block internal/loopback IPs except localhost (Ollama etc.)
    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [/^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^169\.254\./, /^0\.0\.0\.0$/, /^\[?::1\]?$/];
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isBlocked = !isLocalhost && blockedPatterns.some(re => re.test(hostname));
    if (isBlocked) {
      throw new Error(`MCP server URL points to a blocked internal address: ${hostname}`);
    }
    if (server.token) {
      url.searchParams.set('token', server.token);
    }
    transport = new SSEClientTransport(url);
  } else {
    // Treat url as command + args
    const tokens = server.url.split(' ');
    const command = tokens[0];
    const args = tokens.slice(1);
    transport = new StdioClientTransport({ command, args });
  }

  try {
    await client.connect(transport);
    clients.set(server.name, client);
    console.log(`MCP server ${server.name} connected successfully.`);
    return client;
  } catch (error) {
    console.error(`Failed to connect to MCP server ${server.name}:`, error.message);
    throw error;
  }
}

// Synchronize clients with settings
async function syncMcpServers() {
  const settings = await getSettings();
  const servers = settings.mcpServers || [];

  // Close connections for removed/disabled servers
  for (const [name, client] of clients.entries()) {
    const serverConf = servers.find(s => s.name === name);
    if (!serverConf || !serverConf.enabled) {
      try {
        await client.close();
      } catch (e) {
        // Ignore
      }
      clients.delete(name);
      console.log(`Disconnected MCP server: ${name}`);
    }
  }

  // Connect to new/enabled servers
  const activeClients = [];
  for (const server of servers) {
    if (server.enabled) {
      try {
        const client = await connectServer(server);
        activeClients.push({ name: server.name, client });
      } catch (err) {
        // Log and continue, do not block others
      }
    }
  }
  return activeClients;
}

// GET /api/mcp/tools - Returns aggregated list of tools
router.get('/tools', async (req, res) => {
  try {
    const active = await syncMcpServers();
    const allTools = [];

    for (const { name, client } of active) {
      try {
        const result = await client.listTools();
        if (result && result.tools) {
          const toolsWithSource = result.tools.map(tool => ({
            ...tool,
            serverName: name
          }));
          allTools.push(...toolsWithSource);
        }
      } catch (err) {
        console.error(`Failed to list tools for server ${name}:`, err.message);
      }
    }

    res.json({ tools: allTools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/mcp/call - Invokes a tool
router.post('/call', async (req, res) => {
  const { serverName, toolName, arguments: args } = req.body;
  try {
    await syncMcpServers();
    const client = clients.get(serverName);
    if (!client) {
      return res.status(404).json({ error: `MCP Server '${serverName}' not connected` });
    }

    const response = await client.callTool({
      name: toolName,
      arguments: args
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/mcp/servers - Status endpoint
router.get('/servers', async (req, res) => {
  try {
    const settings = await getSettings();
    const servers = settings.mcpServers || [];
    await syncMcpServers();
    
    const list = servers.map(s => ({
      name: s.name,
      url: s.url,
      enabled: s.enabled,
      status: clients.has(s.name) ? 'online' : 'offline'
    }));
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
