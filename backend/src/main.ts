import 'dotenv/config';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật validation pipe toàn cục (dùng class-validator để validate DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Loại bỏ các field không được khai báo trong DTO
      forbidNonWhitelisted: false, // Không throw lỗi khi có field lạ (chỉ bỏ qua)
      transform: true,       // Tự động chuyển kiểu dữ liệu (string -> number, etc.)
    }),
  );

  const frontendDist = join(process.cwd(), '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.getHttpAdapter().getInstance().use(express.static(frontendDist));
    app.getHttpAdapter().getInstance().use((request: any, response: any, next: any) => {
      const apiPaths = ['/catalog', '/auth', '/users', '/farms'];
      if (request.method === 'GET' && !apiPaths.some((path) => request.path.startsWith(path))) {
        response.sendFile(join(frontendDist, 'index.html'));
        return;
      }
      next();
    });
  }

  app.enableCors({
    origin: (origin, callback) => {
      const frontendEnv = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
      const allowedOrigins = [
        frontendEnv,
        'https://dalatagri.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
      ].filter(Boolean);

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Origin không được phép'));
      }
    },
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend đang chạy tại cổng ${port}`);
}
bootstrap();
