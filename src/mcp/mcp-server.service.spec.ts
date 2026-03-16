import { Logger } from '@nestjs/common';
import { Request, Response } from 'express';

import { ExtractMcpTool } from './extract-mcp.tool';
import { GoogleSearchAndExtractMcpTool } from './google-search-and-extract-mcp.tool';
import { GoogleSearchMcpTool } from './google-search-mcp.tool';
import { McpServerService } from './mcp-server.service';
import { YandexSearchAndExtractMcpTool } from './yandex-search-and-extract-mcp.tool';
import { YandexSearchMcpTool } from './yandex-search-mcp.tool';

describe('McpServerService', () => {
  let loggerLogSpy: jest.SpiedFunction<Logger['log']>;
  let loggerErrorSpy: jest.SpiedFunction<Logger['error']>;
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
    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs MCP server initialization', () => {
    mcpServerService.onModuleInit();

    expect(loggerLogSpy).toHaveBeenCalledWith('MCP server initialized');
  });

  it('registers all MCP tools when a session server is created', () => {
    const server = (
      mcpServerService as unknown as {
        createServer: () => Record<string, unknown>;
      }
    ).createServer();

    expect(server).toBeDefined();
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'Registering MCP tools: search_yandex, search_google, extract, search_and_extract_yandex, search_and_extract_google',
    );
    expect(yandexSearchMcpTool.register).toHaveBeenCalledWith(server);
    expect(extractMcpTool.register).toHaveBeenCalledWith(server);
    expect(googleSearchAndExtractMcpTool.register).toHaveBeenCalledWith(server);
    expect(googleSearchMcpTool.register).toHaveBeenCalledWith(server);
    expect(yandexSearchAndExtractMcpTool.register).toHaveBeenCalledWith(server);
  });

  it('creates a session for initialize requests and delegates to the new transport', async () => {
    const transport = {
      handleRequest: jest.fn().mockResolvedValue(undefined),
    };
    const createSessionMock = jest
      .fn()
      .mockResolvedValue({ server: {}, transport });
    (
      mcpServerService as unknown as {
        createSession: typeof createSessionMock;
      }
    ).createSession = createSessionMock;
    const request = {
      method: 'POST',
      headers: {},
    } as Request;
    const response = {
      headersSent: false,
    } as Response;
    const body = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    };

    await mcpServerService.handleRequest(request, response, body);

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(transport.handleRequest).toHaveBeenCalledWith(
      request,
      response,
      body,
    );
  });

  it('reuses the existing session transport when Mcp-Session-Id is provided', async () => {
    const transport = {
      handleRequest: jest.fn().mockResolvedValue(undefined),
    };
    (
      mcpServerService as unknown as {
        sessions: Map<string, { server: unknown; transport: typeof transport }>;
      }
    ).sessions.set('session-123', {
      server: {},
      transport,
    });
    const request = {
      method: 'GET',
      headers: {
        'mcp-session-id': 'session-123',
      },
    } as unknown as Request;
    const response = {
      headersSent: false,
    } as Response;

    await mcpServerService.handleRequest(request, response, undefined);

    expect(transport.handleRequest).toHaveBeenCalledWith(
      request,
      response,
      undefined,
    );
  });

  it('returns 400 for requests with an unknown session id', async () => {
    const status = jest.fn().mockReturnThis();
    const send = jest.fn().mockReturnThis();
    const request = {
      method: 'GET',
      headers: {
        'mcp-session-id': 'missing-session',
      },
    } as unknown as Request;
    const response = {
      headersSent: false,
      status,
      send,
    } as unknown as Response;

    await mcpServerService.handleRequest(request, response, undefined);

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith('Invalid or missing session ID');
  });

  it('closes active sessions on shutdown', async () => {
    const server = {
      close: jest.fn().mockResolvedValue(undefined),
    };
    (
      mcpServerService as unknown as {
        sessions: Map<string, { server: typeof server; transport: unknown }>;
      }
    ).sessions.set('session-123', {
      server,
      transport: {},
    });

    await mcpServerService.onModuleDestroy();

    expect(loggerLogSpy).toHaveBeenCalledWith('MCP server shutting down');
    expect(loggerLogSpy).toHaveBeenCalledWith(
      'MCP session closed: session-123',
    );
    expect(server.close).toHaveBeenCalledTimes(1);
  });

  it('returns 500 and logs when MCP request handling throws unexpectedly', async () => {
    const transport = {
      handleRequest: jest.fn().mockRejectedValue(new Error('boom')),
    };
    (
      mcpServerService as unknown as {
        sessions: Map<string, { server: unknown; transport: typeof transport }>;
      }
    ).sessions.set('session-123', {
      server: {},
      transport,
    });
    const status = jest.fn().mockReturnThis();
    const json = jest.fn().mockReturnThis();
    const request = {
      method: 'POST',
      headers: {
        'mcp-session-id': 'session-123',
      },
    } as unknown as Request;
    const response = {
      headersSent: false,
      status,
      json,
    } as unknown as Response;

    await mcpServerService.handleRequest(request, response, {
      method: 'tools/list',
    });

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Failed to handle MCP request: method=POST cause="boom"',
      expect.any(String),
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
      },
      id: null,
    });
  });
});
