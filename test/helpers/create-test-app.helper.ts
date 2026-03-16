import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';

export async function createTestApp(
  overrideProviders: { token: unknown; value: unknown }[] = [],
): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });

  for (const { token, value } of overrideProviders) {
    builder = builder.overrideProvider(token).useValue(value);
  }

  const module: TestingModule = await builder.compile();
  const app = module.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();
  return app;
}
