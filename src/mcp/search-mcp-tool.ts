import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { SearchResultDto } from '../search/dto/search-result.dto';
import { SearchService } from '../search/search.service';

const searchToolInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Natural-language web search query to run against Yandex.'),
  topK: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Number of top search results to return. Maximum 10.'),
  lr: z
    .number()
    .optional()
    .describe(
      'Optional Yandex region code passed through as the lr parameter.',
    ),
  familyMode: z
    .union([z.literal(0), z.literal(1), z.literal(2)])
    .optional()
    .describe(
      'Optional Yandex family filter mode: 0 disables filtering, 1 enables moderate filtering, 2 enables strict filtering.',
    ),
});

const searchToolOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      position: z.number().int(),
    }),
  ),
});

type SearchToolInput = z.infer<typeof searchToolInputSchema>;

@Injectable()
export class SearchMcpTool {
  constructor(private readonly searchService: SearchService) {}

  register(server: McpServer): void {
    server.registerTool(
      'search',
      {
        title: 'Web Search',
        description:
          'Search the web with Yandex via SerpAPI and return ranked results with title, URL, snippet, and position.',
        inputSchema: searchToolInputSchema,
        outputSchema: searchToolOutputSchema,
      },
      async (input: SearchToolInput) => {
        try {
          const results = await this.searchService.search(input);

          return this.toToolResult(results);
        } catch (error: unknown) {
          return this.toToolError(error);
        }
      },
    );
  }

  private toToolResult(results: SearchResultDto[]): {
    content: { type: 'text'; text: string }[];
    structuredContent: { results: SearchResultDto[] };
  } {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ results }, null, 2),
        },
      ],
      structuredContent: {
        results,
      },
    };
  }

  private toToolError(error: unknown): {
    content: { type: 'text'; text: string }[];
    isError: true;
  } {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown search tool error';

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
}
