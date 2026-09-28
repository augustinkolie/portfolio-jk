import { resolve } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { AppConfig } from './config/app-config.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(AppConfig);

  if (config.trustProxy) app.set('trust proxy', 1);
  app.use(
    helmet({
      // Les images servies par l'API sont affichées par le site (autre sous-domaine, même site).
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: config.webOrigin,
    credentials: true,
    // La liseuse PDF du site lit les dossiers de plans par morceaux (requêtes Range).
    exposedHeaders: ['Accept-Ranges', 'Content-Range', 'Content-Length'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  if (config.storageDriver === 'local') {
    // Clés uniques par fichier (UUID) : le contenu d'une URL ne change jamais.
    app.useStaticAssets(resolve(config.uploadsDir), {
      prefix: '/uploads/',
      maxAge: '365d',
      immutable: true,
      index: false,
    });
  }

  if (!config.isProduction) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('API Portfolio BTP')
        .setDescription('Routes publiques en lecture seule, routes /admin/* protégées par JWT.')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  app.enableShutdownHooks();
  await app.listen(config.port);
}
await bootstrap();
