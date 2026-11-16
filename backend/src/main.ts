import 'dotenv/config';
import * as dns from 'node:dns';

// Render container không có định tuyến IPv6, ép Node.js ưu tiên IPv4
if (typeof (dns as any).setDefaultResultOrder === 'function') {
  (dns as any).setDefaultResultOrder('ipv4first');
}

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tăng giới hạn dung lượng tải lên (hỗ trợ ảnh đại diện base64)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Bật validation pipe toàn cục (dùng class-validator để validate DTO)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // Loại bỏ các field không được khai báo trong DTO
      forbidNonWhitelisted: false, // Không throw lỗi khi có field lạ (chỉ bỏ qua)
      transform: true,       // Tự động chuyển kiểu dữ liệu (string -> number, etc.)
    }),
  );

  // Bật CORS — chỉ cho phép các origin rõ ràng (whitelist)
  app.enableCors({
    origin: (origin, callback) => {
      // Cho phép server-to-server hoặc curl (không có origin header)
      if (!origin) {
        return callback(null, true);
      }

      const frontendEnv = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
      const allowedOrigins = [
        frontendEnv,
        'https://dalatagri.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ].filter(Boolean);

      // Cho phép mọi subdomain của vercel.app (preview deployments)
      const isVercelPreview =
        /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(origin) ||
        origin.endsWith('.vercel.app');

      // Cho phép localhost với bất kỳ port nào (môi trường dev)
      const isLocalDev =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      if (allowedOrigins.includes(origin) || isVercelPreview || isLocalDev) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin không được phép — ${origin}`));
      }
    },
    credentials: true,
  });

  const frontendDist = join(process.cwd(), '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    const serveStatic = (express as any).static || (express as any).default?.static;
    if (serveStatic) {
      app.getHttpAdapter().getInstance().use(serveStatic(frontendDist));
    }
    app.getHttpAdapter().getInstance().use((request: any, response: any, next: any) => {
      const apiPaths = ['/catalog', '/auth', '/users', '/farms', '/activity-types', '/sales'];
      if (request.method === 'GET' && !apiPaths.some((path) => request.path.startsWith(path))) {
        response.sendFile(join(frontendDist, 'index.html'));
        return;
      }
      next();
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 DalatAgri Backend đang chạy tại http://0.0.0.0:${port}`);
}
bootstrap();
