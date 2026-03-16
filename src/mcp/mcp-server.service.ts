import { randomUUID } from 'node:crypto';

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { Request, Response } from 'express';

import { ExtractMcpTool } from './extract-mcp.tool';
import { GoogleSearchAndExtractMcpTool } from './google-search-and-extract-mcp.tool';
import { GoogleSearchMcpTool } from './google-search-mcp.tool';
import { YandexSearchAndExtractMcpTool } from './yandex-search-and-extract-mcp.tool';
import { YandexSearchMcpTool } from './yandex-search-mcp.tool';

interface McpSessionContext {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
}

@Injectable()
export class McpServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpServerService.name);
  private readonly sessions = new Map<string, McpSessionContext>();

  constructor(
    private readonly yandexSearchMcpTool: YandexSearchMcpTool,
    private readonly extractMcpTool: ExtractMcpTool,
    private readonly googleSearchAndExtractMcpTool: GoogleSearchAndExtractMcpTool,
    private readonly googleSearchMcpTool: GoogleSearchMcpTool,
    private readonly yandexSearchAndExtractMcpTool: YandexSearchAndExtractMcpTool,
  ) {}

  onModuleInit(): void {
    this.logger.log('MCP server initialized');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('MCP server shutting down');
    await Promise.all(
      [...this.sessions.keys()].map((sessionId) =>
        this.disposeSession(sessionId),
      ),
    );
  }

  async handleRequest(
    request: Request,
    response: Response,
    body: unknown,
  ): Promise<void> {
    try {
      const sessionIdHeader = request.headers['mcp-session-id'];
      const sessionId =
        typeof sessionIdHeader === 'string' ? sessionIdHeader : undefined;

      if (sessionId) {
        const session = this.sessions.get(sessionId);

        if (!session) {
          response.status(400).send('Invalid or missing session ID');
          return;
        }

        await session.transport.handleRequest(request, response, body);
        return;
      }

      if (request.method === 'POST' && isInitializeRequest(body)) {
        const session = await this.createSession();

        await session.transport.handleRequest(request, response, body);
        return;
      }

      if (request.method === 'GET' || request.method === 'DELETE') {
        response.status(400).send('Invalid or missing session ID');
        return;
      }

      response.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown MCP transport error';
      this.logger.error(
        `Failed to handle MCP request: method=${request.method} cause="${message}"`,
        error instanceof Error ? error.stack : undefined,
      );

      if (!response.headersSent) {
        response.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  }

  private async createSession(): Promise<McpSessionContext> {
    const server = this.createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        this.sessions.set(sessionId, {
          server,
          transport,
        });
        this.logger.log(`MCP session initialized: ${sessionId}`);
      },
    });

    transport.onclose = () => {
      const sessionId = transport.sessionId;

      if (!sessionId) {
        return;
      }

      void this.disposeSession(sessionId);
    };

    await server.connect(transport);

    return {
      server,
      transport,
    };
  }

  private createServer(): McpServer {
    const server = new McpServer({
      name: 'web-compass',
      version: '1.0.0',
    });

    this.logger.log(
      'Registering MCP tools: search_yandex, search_google, extract, search_and_extract_yandex, search_and_extract_google',
    );
    this.yandexSearchMcpTool.register(server);
    this.extractMcpTool.register(server);
    this.googleSearchAndExtractMcpTool.register(server);
    this.googleSearchMcpTool.register(server);
    this.yandexSearchAndExtractMcpTool.register(server);

    return server;
  }

  private async disposeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return;
    }

    this.sessions.delete(sessionId);
    this.logger.log(`MCP session closed: ${sessionId}`);
    await session.server.close();
  }
}
