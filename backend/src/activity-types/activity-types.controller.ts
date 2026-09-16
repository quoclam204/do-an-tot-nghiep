import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ActivityTypesService } from './activity-types.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('activity-types')
@UseGuards(JwtAuthGuard)
export class ActivityTypesController {
  constructor(private readonly service: ActivityTypesService) {}

  /** GET /activity-types?farmId=xxx - Lấy danh sách loại hoạt động */
  @Get()
  findAll(@Query('farmId') farmId?: string) {
    return this.service.findAll(farmId);
  }

  /** POST /activity-types - Tạo loại hoạt động mới */
  @Post()
  create(@Body() body: { code: string; name: string; description?: string; icon?: string; farmId?: string }) {
    return this.service.create(body);
  }

  /** PATCH /activity-types/:id - Cập nhật loại hoạt động */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { name?: string; description?: string; icon?: string }) {
    return this.service.update(id, body);
  }

  /** DELETE /activity-types/:id - Xóa loại hoạt động */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  /** POST /activity-types/seed - Seed dữ liệu mặc định */
  @Post('seed')
  seed() {
    return this.service.seedDefaults();
  }
}
