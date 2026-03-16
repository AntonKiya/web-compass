import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { SearchAndExtractPipeline } from '../common/services/search-and-extract-pipeline.service';

import { YandexSearchAndExtractMcpTool } from './yandex-search-and-extract-mcp.tool';

describe('YandexSearchAndExtractMcpTool', () => {
  let yandexSearchAndExtractMcpTool: YandexSearchAndExtractMcpTool;
  let searchAndExtractPipeline: { run: jest.Mock };

  beforeEach(async () => {
    searchAndExtractPipeline = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YandexSearchAndExtractMcpTool,
        {
          provide: SearchAndExtractPipeline,
          useValue: searchAndExtractPipeline,
        },
      ],
    }).compile();

    yandexSearchAndExtractMcpTool = module.get<YandexSearchAndExtractMcpTool>(
      YandexSearchAndExtractMcpTool,
    );
  });

  it('registers the search_and_extract_yandex tool, calls SearchAndExtractPipeline, and returns MCP-formatted structured content', async () => {
    searchAndExtractPipeline.run.mockResolvedValue({
      results: [
        {
          title: 'First result',
          url: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
          content: 'Content 1',
        },
      ],
      meta: {
        requested: 1,
        extracted: 1,
      },
    });

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    yandexSearchAndExtractMcpTool.register(server);

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
      name: 'search_and_extract_yandex',
      arguments: {
        query: 'nestjs',
        topK: 1,
        region: 'cis',
      },
    });

    expect(searchAndExtractPipeline.run).toHaveBeenCalledWith({
      query: 'nestjs',
      topK: 1,
      region: 'cis',
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({
      results: [
        {
          title: 'First result',
          url: 'https://example.com/1',
          snippet: 'Snippet 1',
          position: 1,
          content: 'Content 1',
        },
      ],
      meta: {
        requested: 1,
        extracted: 1,
      },
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
                content: 'Content 1',
              },
            ],
            meta: {
              requested: 1,
              extracted: 1,
            },
          },
          null,
          2,
        ),
      },
    ]);

    await Promise.all([client.close(), server.close()]);
  });

  it('returns an MCP error result when SearchAndExtractPipeline throws', async () => {
    searchAndExtractPipeline.run.mockRejectedValue(
      new Error('Search and extract failed'),
    );

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    yandexSearchAndExtractMcpTool.register(server);

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
      name: 'search_and_extract_yandex',
      arguments: {
        query: 'nestjs',
        topK: 1,
        region: 'cis',
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Search and extract failed',
        },
      ],
      isError: true,
    });

    await Promise.all([client.close(), server.close()]);
  });
});
