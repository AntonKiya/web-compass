import { Inject, Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { SearchAndExtractResponseDto } from '../common/dto/search-and-extract-response.dto';
import { SearchAndExtractPipeline } from '../common/services/search-and-extract-pipeline.service';
import { GOOGLE_SEARCH_AND_EXTRACT_PIPELINE } from '../google-search-and-extract/google-search-and-extract.module';

const googleSearchAndExtractToolInputSchema = z.object({
  query: z
    .string()
    .min(1)
    .describe(
      'Natural-language search query for global Google search and content extraction.',
    ),
  topK: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe('Number of results to search and extract. Maximum 10.'),
});

const googleSearchAndExtractToolOutputSchema = z.object({
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

type GoogleSearchAndExtractToolInput = z.infer<
  typeof googleSearchAndExtractToolInputSchema
>;
type GoogleSearchAndExtractToolStructuredContent = z.infer<
  typeof googleSearchAndExtractToolOutputSchema
>;

@Injectable()
export class GoogleSearchAndExtractMcpTool {
  constructor(
    @Inject(GOOGLE_SEARCH_AND_EXTRACT_PIPELINE)
    private readonly pipeline: SearchAndExtractPipeline,
  ) {}

  register(server: McpServer): void {
    server.registerTool(
      'search_and_extract_google',
      {
        title: 'Google Search And Extract',
        description:
          'Search the web globally with Google and then extract the main content from the returned pages in one combined pipeline.',
        inputSchema: googleSearchAndExtractToolInputSchema,
        outputSchema: googleSearchAndExtractToolOutputSchema,
      },
      async (input: GoogleSearchAndExtractToolInput) => {
        try {
          const response = await this.pipeline.run(input);

          return this.toToolResult(response);
        } catch (error: unknown) {
          return this.toToolError(error);
        }
      },
    );
  }

  private toToolResult(response: SearchAndExtractResponseDto): {
    content: { type: 'text'; text: string }[];
    structuredContent: GoogleSearchAndExtractToolStructuredContent;
  } {
    const structuredContent: GoogleSearchAndExtractToolStructuredContent = {
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
        : 'Unknown Google search_and_extract tool error';

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
