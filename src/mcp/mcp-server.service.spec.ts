import { Logger } from '@nestjs/common';

import { ExtractMcpTool } from './extract-mcp.tool';
import { GoogleSearchAndExtractMcpTool } from './google-search-and-extract-mcp.tool';
import { GoogleSearchMcpTool } from './google-search-mcp.tool';
import { McpServerService } from './mcp-server.service';
import { YandexSearchAndExtractMcpTool } from './yandex-search-and-extract-mcp.tool';
import { YandexSearchMcpTool } from './yandex-search-mcp.tool';

describe('McpServerService', () => {
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let server: { connect: jest.Mock; close: jest.Mock };
  let transport: { kind: string };
  let yandexSearchMcpTool: { register: jest.Mock };
  let extractMcpTool: { register: jest.Mock };
  let googleSearchAndExtractMcpTool: { register: jest.Mock };
  let googleSearchMcpTool: { register: jest.Mock };
  let yandexSearchAndExtractMcpTool: { register: jest.Mock };
  let mcpServerService: McpServerService;

  beforeEach(() => {
    loggerLogSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    server = {
      connect: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };
    transport = { kind: 'test-transport' };
    yandexSearchMcpTool = { register: jest.fn() };
    extractMcpTool = { register: jest.fn() };
    googleSearchAndExtractMcpTool = { register: jest.fn() };
    googleSearchMcpTool = { register: jest.fn() };
    yandexSearchAndExtractMcpTool = { register: jest.fn() };

    mcpServerService = new McpServerService(
      yandexSearchMcpTool as unknown as YandexSearchMcpTool,
      extractMcpTool as unknown as ExtractMcpTool,
      googleSearchAndExtractMcpTool as unknown as GoogleSearchAndExtractMcpTool,
      googleSearchMcpTool as unknown as GoogleSearchMcpTool,
      yandexSearchAndExtractMcpTool as unknown as YandexSearchAndExtractMcpTool,
    );

    const writableService = mcpServerService as unknown as {
      server: typeof server;
      transport: typeof transport;
    };

    writableService.server = server;
    writableService.transport = transport;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers all MCP tools and logs startup and shutdown', async () => {
    await mcpServerService.onModuleInit();

    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Registering MCP tools: search_yandex, search_google, extract, search_and_extract_yandex, search_and_extract_google',
    );
    expect(yandexSearchMcpTool.register).toHaveBeenCalledWith(server);
    expect(extractMcpTool.register).toHaveBeenCalledWith(server);
    expect(googleSearchAndExtractMcpTool.register).toHaveBeenCalledWith(server);
    expect(googleSearchMcpTool.register).toHaveBeenCalledWith(server);
    expect(yandexSearchAndExtractMcpTool.register).toHaveBeenCalledWith(server);
    expect(server.connect).toHaveBeenCalledWith(transport);
    expect(loggerLogSpy).toHaveBeenCalledWith('MCP server initialized');

    await mcpServerService.onModuleDestroy();

    expect(loggerLogSpy).toHaveBeenCalledWith('MCP server shutting down');
    expect(server.close).toHaveBeenCalledTimes(1);
  });
});
