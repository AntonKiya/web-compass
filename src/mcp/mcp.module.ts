import { Module } from '@nestjs/common';

import { ExtractModule } from '../extract/extract.module';
import { SearchModule } from '../search/search.module';

import { ExtractMcpTool } from './extract-mcp.tool';
import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { SearchMcpTool } from './search-mcp-tool';

@Module({
  imports: [ExtractModule, SearchModule],
  controllers: [McpController],
  providers: [ExtractMcpTool, McpServerService, SearchMcpTool],
  exports: [McpServerService],
})
export class McpModule {}
