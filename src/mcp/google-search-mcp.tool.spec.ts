import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { GoogleSearchService } from '../google-search/google-search.service';

import { GoogleSearchMcpTool } from './google-search-mcp.tool';

describe('GoogleSearchMcpTool', () => {
  let googleSearchMcpTool: GoogleSearchMcpTool;
  let googleSearchService: { search: jest.Mock };

  beforeEach(async () => {
    googleSearchService = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleSearchMcpTool,
        {
          provide: GoogleSearchService,
          useValue: googleSearchService,
        },
      ],
    }).compile();

    googleSearchMcpTool = module.get<GoogleSearchMcpTool>(GoogleSearchMcpTool);
  });

  it('registers the search_google tool, calls GoogleSearchService, and returns MCP-formatted structured content', async () => {
    googleSearchService.search.mockResolvedValue([
      {
        title: 'First result',
        url: 'https://example.com/1',
        snippet: 'Snippet 1',
        position: 1,
      },
    ]);

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    googleSearchMcpTool.register(server);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.callTool({
      name: 'search_google',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(googleSearchService.search).toHaveBeenCalledWith({
      query: 'nestjs',
      topK: 1,
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({
      results: [
        {
          title: 'First result',
          url: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
        },
      ],
    });
    expect(result.content).toEqual([
      {
        type: 'text',
        text: JSON.stringify(
          {
            results: [
              {
                title: 'First result',
                url: 'https://example.com/1',
                snippet: 'Snippet 1',
                position: 1,
              },
            ],
          },
          null,
          2,
        ),
      },
    ]);

    await Promise.all([client.close(), server.close()]);
  });

  it('returns an MCP error result when GoogleSearchService throws', async () => {
    googleSearchService.search.mockRejectedValue(
      new Error('Google search failed'),
    );

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    googleSearchMcpTool.register(server);

    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({
      name: 'test-client',
      version: '1.0.0',
    });

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);

    const result = await client.callTool({
      name: 'search_google',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Google search failed',
        },
      ],
      isError: true,
    });

    await Promise.all([client.close(), server.close()]);
  });
});
