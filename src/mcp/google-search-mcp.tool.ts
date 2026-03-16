import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { SearchResultDto } from '../common/dto/search-result.dto';
import { GoogleSearchService } from '../google-search/google-search.service';

const googleSearchToolInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe('Natural-language web search query for global Google search.'),
  topK: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Number of top search results to return. Maximum 10.'),
});

const googleSearchToolOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      position: z.number().int(),
    }),
  ),
});

type GoogleSearchToolInput = z.infer<typeof googleSearchToolInputSchema>;

@Injectable()
export class GoogleSearchMcpTool {
  constructor(private readonly googleSearchService: GoogleSearchService) {}

  register(server: McpServer): void {
    server.registerTool(
      'search_google',
      {
        title: 'Google Web Search',
        description:
          'Search the web globally with Google via SerpAPI and return ranked results with title, URL, snippet, and position.',
        inputSchema: googleSearchToolInputSchema,
        outputSchema: googleSearchToolOutputSchema,
      },
      async (input: GoogleSearchToolInput) => {
        try {
          const results = await this.googleSearchService.search(input);

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
        : 'Unknown Google search tool error';

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
