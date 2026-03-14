import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response } from 'express';

import { ExtractMcpTool } from './extract-mcp.tool';
import { SearchMcpTool } from './search-mcp-tool';

@Injectable()
export class McpServerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpServerService.name);
  private readonly server = new McpServer({
    name: 'web-compass',
    version: '1.0.0',
  });
  private readonly transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  constructor(
    private readonly searchMcpTool: SearchMcpTool,
    private readonly extractMcpTool: ExtractMcpTool,
  ) {}

  async onModuleInit(): Promise<void> {
    this.searchMcpTool.register(this.server);
    this.extractMcpTool.register(this.server);
    await this.server.connect(this.transport);
    this.logger.log('MCP server initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.server.close();
  }

  async handleRequest(
    request: Request,
    response: Response,
    body: unknown,
  ): Promise<void> {
    await this.transport.handleRequest(request, response, body);
  }
}
