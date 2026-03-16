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
import { GoogleSearchAndExtractMcpTool } from './google-search-and-extract-mcp.tool';
import { GoogleSearchMcpTool } from './google-search-mcp.tool';
import { YandexSearchAndExtractMcpTool } from './yandex-search-and-extract-mcp.tool';
import { YandexSearchMcpTool } from './yandex-search-mcp.tool';

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
    private readonly yandexSearchMcpTool: YandexSearchMcpTool,
    private readonly extractMcpTool: ExtractMcpTool,
    private readonly googleSearchAndExtractMcpTool: GoogleSearchAndExtractMcpTool,
    private readonly googleSearchMcpTool: GoogleSearchMcpTool,
    private readonly yandexSearchAndExtractMcpTool: YandexSearchAndExtractMcpTool,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log(
      'Registering MCP tools: search_yandex, search_google, extract, search_and_extract_yandex, search_and_extract_google',
    );
    this.yandexSearchMcpTool.register(this.server);
    this.extractMcpTool.register(this.server);
    this.googleSearchAndExtractMcpTool.register(this.server);
    this.googleSearchMcpTool.register(this.server);
    this.yandexSearchAndExtractMcpTool.register(this.server);
    await this.server.connect(this.transport);
    this.logger.log('MCP server initialized');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('MCP server shutting down');
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
