import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { ExtractService } from '../extract/extract.service';

import { ExtractMcpTool } from './extract-mcp.tool';

describe('ExtractMcpTool', () => {
  let extractMcpTool: ExtractMcpTool;
  let extractService: { extract: jest.Mock };

  beforeEach(async () => {
    extractService = {
      extract: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExtractMcpTool,
        {
          provide: ExtractService,
          useValue: extractService,
        },
      ],
    }).compile();

    extractMcpTool = module.get<ExtractMcpTool>(ExtractMcpTool);
  });

  it('registers the extract tool, calls ExtractService, and returns MCP-formatted structured content', async () => {
    extractService.extract.mockResolvedValue({
      results: [
        {
          url: 'https://example.com/article',
          title: 'Example article',
          content: 'First paragraph. Second paragraph.',
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
    extractMcpTool.register(server);

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
      name: 'extract',
      arguments: {
        urls: ['https://example.com/article'],
      },
    });

    expect(extractService.extract).toHaveBeenCalledWith({
      urls: ['https://example.com/article'],
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({
      results: [
        {
          url: 'https://example.com/article',
          title: 'Example article',
          content: 'First paragraph. Second paragraph.',
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
                url: 'https://example.com/article',
                title: 'Example article',
                content: 'First paragraph. Second paragraph.',
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

  it('returns an MCP error result when ExtractService throws', async () => {
    extractService.extract.mockRejectedValue(new Error('Extraction failed'));

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    extractMcpTool.register(server);

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
      name: 'extract',
      arguments: {
        urls: ['https://example.com/article'],
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Extraction failed',
        },
      ],
      isError: true,
    });

    await Promise.all([client.close(), server.close()]);
  });
});
