import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { SearchResultDto } from '../common/dto/search-result.dto';
import { YandexSearchService } from '../yandex-search/yandex-search.service';

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
  region: z
    .enum(['russia', 'cis'])
    .optional()
    .default('russia')
    .describe(
      'Region for search results. "russia" targets Russian web (lr=225), "cis" targets CIS countries (lr=166). Defaults to "russia".',
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
export class YandexSearchMcpTool {
  constructor(private readonly yandexSearchService: YandexSearchService) {}

  register(server: McpServer): void {
    server.registerTool(
      'search_yandex',
      {
        title: 'Yandex Web Search',
        description:
          'Search the web with Yandex via SerpAPI and return ranked results with title, URL, snippet, and position.',
        inputSchema: searchToolInputSchema,
        outputSchema: searchToolOutputSchema,
      },
      async (input: SearchToolInput) => {
        try {
          const results = await this.yandexSearchService.search(input);

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
      error instanceof Error
        ? error.message
        : 'Unknown search_yandex tool error';

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
