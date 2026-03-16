import { Module } from '@nestjs/common';

import { ExtractModule } from '../extract/extract.module';
import { GoogleSearchModule } from '../google-search/google-search.module';
import { GoogleSearchAndExtractModule } from '../google-search-and-extract/google-search-and-extract.module';
import { YandexSearchModule } from '../yandex-search/yandex-search.module';
import { YandexSearchAndExtractModule } from '../yandex-search-and-extract/yandex-search-and-extract.module';

import { ExtractMcpTool } from './extract-mcp.tool';
import { GoogleSearchAndExtractMcpTool } from './google-search-and-extract-mcp.tool';
import { GoogleSearchMcpTool } from './google-search-mcp.tool';
import { McpController } from './mcp.controller';
import { McpServerService } from './mcp-server.service';
import { YandexSearchAndExtractMcpTool } from './yandex-search-and-extract-mcp.tool';
import { YandexSearchMcpTool } from './yandex-search-mcp.tool';

@Module({
  imports: [
    ExtractModule,
    GoogleSearchAndExtractModule,
    GoogleSearchModule,
    YandexSearchAndExtractModule,
    YandexSearchModule,
  ],
  controllers: [McpController],
  providers: [
    ExtractMcpTool,
    GoogleSearchAndExtractMcpTool,
    GoogleSearchMcpTool,
    McpServerService,
    YandexSearchAndExtractMcpTool,
    YandexSearchMcpTool,
  ],
  exports: [McpServerService],
})
export class McpModule {}
