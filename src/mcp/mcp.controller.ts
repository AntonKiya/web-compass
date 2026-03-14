import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { McpServerService } from './mcp-server.service';
import { MCP_ENDPOINT_PATH } from './mcp.constants';

@Controller(MCP_ENDPOINT_PATH)
export class McpController {
  constructor(private readonly mcpServerService: McpServerService) {}

  @Post()
  async handle(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: unknown,
  ): Promise<void> {
    await this.mcpServerService.handleRequest(request, response, body);
  }
}
