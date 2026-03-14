import { Module } from '@nestjs/common';

import { ExtractModule } from '../extract/extract.module';
import { SearchModule } from '../search/search.module';
import { SearchAndExtractModule } from '../search-and-extract/search-and-extract.module';

import { ExtractMcpTool } from './extract-mcp.tool';
import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { SearchAndExtractMcpTool } from './search-and-extract-mcp.tool';
import { SearchMcpTool } from './search-mcp-tool';

@Module({
  imports: [ExtractModule, SearchAndExtractModule, SearchModule],
  controllers: [McpController],
  providers: [
    ExtractMcpTool,
    McpServerService,
    SearchAndExtractMcpTool,
    SearchMcpTool,
  ],
  exports: [McpServerService],
})
export class McpModule {}
