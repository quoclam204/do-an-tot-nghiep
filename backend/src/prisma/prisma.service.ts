import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;`);
    } catch {
      // Bỏ qua nếu cột đã tồn tại hoặc quyền bị hạn chế
    }
  }
}
