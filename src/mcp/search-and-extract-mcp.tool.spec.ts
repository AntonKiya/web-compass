import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { SearchAndExtractService } from '../search-and-extract/search-and-extract.service';

import { SearchAndExtractMcpTool } from './search-and-extract-mcp.tool';

describe('SearchAndExtractMcpTool', () => {
  let searchAndExtractMcpTool: SearchAndExtractMcpTool;
  let searchAndExtractService: { searchAndExtract: jest.Mock };

  beforeEach(async () => {
    searchAndExtractService = {
      searchAndExtract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchAndExtractMcpTool,
        {
          provide: SearchAndExtractService,
          useValue: searchAndExtractService,
        },
      ],
    }).compile();

    searchAndExtractMcpTool = module.get<SearchAndExtractMcpTool>(
      SearchAndExtractMcpTool,
    );
  });

  it('registers the search_and_extract tool, calls SearchAndExtractService, and returns MCP-formatted structured content', async () => {
    searchAndExtractService.searchAndExtract.mockResolvedValue({
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
    searchAndExtractMcpTool.register(server);

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
      name: 'search_and_extract',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(searchAndExtractService.searchAndExtract).toHaveBeenCalledWith({
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

  it('returns an MCP error result when SearchAndExtractService throws', async () => {
    searchAndExtractService.searchAndExtract.mockRejectedValue(
      new Error('Search and extract failed'),
    );

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    searchAndExtractMcpTool.register(server);

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
      name: 'search_and_extract',
      arguments: {
        query: 'nestjs',
        topK: 1,
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
