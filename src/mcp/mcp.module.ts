import { Module } from '@nestjs/common';

import { SearchModule } from '../search/search.module';

import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { SearchMcpTool } from './search-mcp-tool';

@Module({
  imports: [SearchModule],
  controllers: [McpController],
  providers: [McpServerService, SearchMcpTool],
  exports: [McpServerService],
})
export class McpModule {}
