import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { ExtractResponseDto } from '../extract/dto/extract-response.dto';
import { ExtractService } from '../extract/extract.service';

const extractToolInputSchema = z.object({
  urls: z
    .array(z.string().url())
    .min(1)
    .max(10)
    .describe('List of URLs to extract main content from. Maximum 10.'),
});

const extractToolOutputSchema = z.object({
  results: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      content: z.string(),
    }),
  ),
  meta: z.object({
    requested: z.number().int(),
    extracted: z.number().int(),
  }),
});

type ExtractToolInput = z.infer<typeof extractToolInputSchema>;
type ExtractToolStructuredContent = z.infer<typeof extractToolOutputSchema>;

@Injectable()
export class ExtractMcpTool {
  constructor(private readonly extractService: ExtractService) {}

  register(server: McpServer): void {
    server.registerTool(
      'extract',
      {
        title: 'Content Extract',
        description:
          'Fetch web pages by URL and extract the main readable content, returning cleaned text for LLM use.',
        inputSchema: extractToolInputSchema,
        outputSchema: extractToolOutputSchema,
      },
      async (input: ExtractToolInput) => {
        try {
          const response = await this.extractService.extract(input);

          return this.toToolResult(response);
        } catch (error: unknown) {
          return this.toToolError(error);
        }
      },
    );
  }

  private toToolResult(response: ExtractResponseDto): {
    content: { type: 'text'; text: string }[];
    structuredContent: ExtractToolStructuredContent;
  } {
    const structuredContent: ExtractToolStructuredContent = {
      results: response.results.map((result) => ({
        url: result.url,
        title: result.title,
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
      error instanceof Error ? error.message : 'Unknown extract tool error';

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
