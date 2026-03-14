import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { SearchService } from '../search/search.service';

import { SearchMcpTool } from './search-mcp-tool';

describe('SearchMcpTool', () => {
  let searchMcpTool: SearchMcpTool;
  let searchService: { search: jest.Mock };

  beforeEach(async () => {
    searchService = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchMcpTool,
        {
          provide: SearchService,
          useValue: searchService,
        },
      ],
    }).compile();

    searchMcpTool = module.get<SearchMcpTool>(SearchMcpTool);
  });

  it('registers the search tool, calls SearchService, and returns MCP-formatted results', async () => {
    searchService.search.mockResolvedValue([
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
    searchMcpTool.register(server);

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
      name: 'search',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(searchService.search).toHaveBeenCalledWith({
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
});
