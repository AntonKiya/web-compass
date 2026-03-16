import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Test, TestingModule } from '@nestjs/testing';

import { GOOGLE_SEARCH_AND_EXTRACT_PIPELINE } from '../google-search-and-extract/google-search-and-extract.module';

import { GoogleSearchAndExtractMcpTool } from './google-search-and-extract-mcp.tool';

describe('GoogleSearchAndExtractMcpTool', () => {
  let googleSearchAndExtractMcpTool: GoogleSearchAndExtractMcpTool;
  let pipeline: { run: jest.Mock };

  beforeEach(async () => {
    pipeline = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleSearchAndExtractMcpTool,
        {
          provide: GOOGLE_SEARCH_AND_EXTRACT_PIPELINE,
          useValue: pipeline,
        },
      ],
    }).compile();

    googleSearchAndExtractMcpTool = module.get<GoogleSearchAndExtractMcpTool>(
      GoogleSearchAndExtractMcpTool,
    );
  });

  it('registers the search_and_extract_google tool, calls the pipeline, and returns MCP-formatted structured content', async () => {
    pipeline.run.mockResolvedValue({
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
    googleSearchAndExtractMcpTool.register(server);

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
      name: 'search_and_extract_google',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(pipeline.run).toHaveBeenCalledWith({
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

  it('returns an MCP error result when the pipeline throws', async () => {
    pipeline.run.mockRejectedValue(
      new Error('Google search and extract failed'),
    );

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });
    googleSearchAndExtractMcpTool.register(server);

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
      name: 'search_and_extract_google',
      arguments: {
        query: 'nestjs',
        topK: 1,
      },
    });

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Google search and extract failed',
        },
      ],
      isError: true,
    });

    await Promise.all([client.close(), server.close()]);
  });
});
