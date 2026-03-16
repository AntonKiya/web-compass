import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { McpServerService } from './mcp-server.service';
import { MCP_ENDPOINT_PATH } from './mcp.constants';

@Controller(MCP_ENDPOINT_PATH)
export class McpController {
  constructor(private readonly mcpServerService: McpServerService) {}

  @Get()
  async handleGet(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.mcpServerService.handleRequest(request, response, undefined);
  }

  @Post()
  async handle(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: unknown,
  ): Promise<void> {
    await this.mcpServerService.handleRequest(request, response, body);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  async handleDelete(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    await this.mcpServerService.handleRequest(request, response, undefined);
  }
}
