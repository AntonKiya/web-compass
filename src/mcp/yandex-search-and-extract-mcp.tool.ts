import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { SearchAndExtractResponseDto } from '../common/dto/search-and-extract-response.dto';
import { SearchAndExtractPipeline } from '../common/services/search-and-extract-pipeline.service';

const searchAndExtractToolInputSchema = z.object({
  query: z.string().min(1).describe('Natural-language search query.'),
  topK: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Number of results to search and extract. Maximum 10.'),
  region: z
    .enum(['russia', 'cis'])
    .optional()
    .default('russia')
    .describe(
      'Region for search results. "russia" targets Russian web (lr=225), "cis" targets CIS countries (lr=166). Defaults to "russia".',
    ),
});

const searchAndExtractToolOutputSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      position: z.number().int(),
      content: z.string(),
    }),
  ),
  meta: z.object({
    requested: z.number().int(),
    extracted: z.number().int(),
  }),
});

type SearchAndExtractToolInput = z.infer<
  typeof searchAndExtractToolInputSchema
>;
type SearchAndExtractToolStructuredContent = z.infer<
  typeof searchAndExtractToolOutputSchema
>;

@Injectable()
export class YandexSearchAndExtractMcpTool {
  constructor(
    private readonly searchAndExtractPipeline: SearchAndExtractPipeline,
  ) {}

  register(server: McpServer): void {
    server.registerTool(
      'search_and_extract_yandex',
      {
        title: 'Yandex Search And Extract',
        description:
          'Search the web and then extract the main content from the returned pages in one combined pipeline.',
        inputSchema: searchAndExtractToolInputSchema,
        outputSchema: searchAndExtractToolOutputSchema,
      },
      async (input: SearchAndExtractToolInput) => {
        try {
          const response = await this.searchAndExtractPipeline.run(input);

          return this.toToolResult(response);
        } catch (error: unknown) {
          return this.toToolError(error);
        }
      },
    );
  }

  private toToolResult(response: SearchAndExtractResponseDto): {
    content: { type: 'text'; text: string }[];
    structuredContent: SearchAndExtractToolStructuredContent;
  } {
    const structuredContent: SearchAndExtractToolStructuredContent = {
      results: response.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        position: result.position,
        content: result.content,
      })),
      meta: {
        requested: response.meta.requested,
        extracted: response.meta.extracted,
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(structuredContent, null, 2),
        },
      ],
      structuredContent,
    };
  }

  private toToolError(error: unknown): {
    content: { type: 'text'; text: string }[];
    isError: true;
  } {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown search_and_extract_yandex tool error';

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
