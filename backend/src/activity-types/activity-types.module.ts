import { Module } from '@nestjs/common';
import { ActivityTypesController } from './activity-types.controller';
import { ActivityTypesService } from './activity-types.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityTypesController],
  providers: [ActivityTypesService],
  exports: [ActivityTypesService],
})
export class ActivityTypesModule {}
