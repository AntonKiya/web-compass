import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { YandexSearchService } from '../yandex-search/yandex-search.service';

import { YandexSearchMcpTool } from './yandex-search-mcp.tool';

describe('YandexSearchMcpTool', () => {
  let yandexSearchMcpTool: YandexSearchMcpTool;
  let yandexSearchService: { search: jest.Mock };

  beforeEach(async () => {
    yandexSearchService = {
      search: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexSearchMcpTool,
        {
          provide: YandexSearchService,
          useValue: yandexSearchService,
        },
      ],
    }).compile();

    yandexSearchMcpTool = module.get<YandexSearchMcpTool>(YandexSearchMcpTool);
  });

  it('registers the search_yandex tool, calls YandexSearchService, and returns MCP-formatted results', async () => {
    yandexSearchService.search.mockResolvedValue([
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
    yandexSearchMcpTool.register(server);

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
      name: 'search_yandex',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(yandexSearchService.search).toHaveBeenCalledWith({
      query: 'nestjs',
      topK: 1,
      region: 'russia',
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
