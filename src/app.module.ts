import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ExtractModule } from './extract/extract.module';
import { GoogleSearchAndExtractModule } from './google-search-and-extract/google-search-and-extract.module';
import { GoogleSearchModule } from './google-search/google-search.module';
import { McpModule } from './mcp/mcp.module';
import { YandexSearchAndExtractModule } from './yandex-search-and-extract/yandex-search-and-extract.module';
import { YandexSearchModule } from './yandex-search/yandex-search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ExtractModule,
    GoogleSearchAndExtractModule,
    GoogleSearchModule,
    McpModule,
    YandexSearchAndExtractModule,
    YandexSearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
