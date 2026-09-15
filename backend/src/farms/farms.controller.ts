import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FarmsService } from './farms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';
import { CreatePlotDto, UpdatePlotDto } from './dto/plot.dto';

@Controller('farms')
@UseGuards(JwtAuthGuard)
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  /** GET /farms - Nông hộ của tôi */
  @Get()
  getMyFarms(@Request() req: any) {
    return this.farmsService.findMyFarms(req.user.userId);
  }

  /** GET /farms/all - Tất cả nông hộ (ADMIN) */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.farmsService.findAll();
  }

  /** POST /farms - Tạo nông hộ mới */
  @Post()
  create(@Request() req: any, @Body() dto: CreateFarmDto) {
    return this.farmsService.create(req.user.userId, dto);
  }

  /** GET /farms/:id - Chi tiết 1 nông hộ */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.farmsService.findOne(id, req.user.userId, req.user.role);
  }

  /** PATCH /farms/:id - Cập nhật nông hộ */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFarmDto,
    @Request() req: any,
  ) {
    return this.farmsService.update(id, dto, req.user.userId, req.user.role);
  }

  /** DELETE /farms/:id - Xóa mềm nông hộ */
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.farmsService.remove(id, req.user.userId, req.user.role);
  }

  // ==========================================
  // FARM MEMBERS ENDPOINTS (N - N)
  // ==========================================

  /** GET /farms/:id/members - Danh sách nông dân / thành viên của nông hộ */
  @Get(':id/members')
  getMembers(@Param('id') id: string, @Request() req: any) {
    return this.farmsService.getFarmMembers(id, req.user.userId, req.user.role);
  }

  /** POST /farms/:id/members - Thêm tài khoản nông dân vào nông hộ */
  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: { emailOrPhone: string; role?: string; canEditLog?: boolean; canManageInventory?: boolean },
    @Request() req: any,
  ) {
    return this.farmsService.addFarmMember(id, req.user.userId, req.user.role, dto);
  }

  /** DELETE /farms/:id/members/:memberId - Xóa nông dân khỏi nông hộ */
  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.farmsService.removeFarmMember(id, memberId, req.user.userId, req.user.role);
  }

  // ==========================================
  // PLOT ENDPOINTS
  // ==========================================

  /** POST /farms/:farmId/plots - Tạo lô trồng */
  @Post(':farmId/plots')
  createPlot(
    @Param('farmId') farmId: string,
    @Body() dto: CreatePlotDto,
    @Request() req: any,
  ) {
    return this.farmsService.createPlot(farmId, req.user.userId, req.user.role, dto);
  }

  /** GET /farms/:farmId/plots - Danh sách lô trồng */
  @Get(':farmId/plots')
  findPlots(@Param('farmId') farmId: string, @Request() req: any) {
    return this.farmsService.findPlots(farmId, req.user.userId, req.user.role);
  }

  /** GET /farms/:farmId/plots/:plotId - Chi tiết 1 lô */
  @Get(':farmId/plots/:plotId')
  findOnePlot(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Request() req: any,
  ) {
    return this.farmsService.findOnePlot(farmId, plotId, req.user.userId, req.user.role);
  }

  /** PATCH /farms/:farmId/plots/:plotId - Cập nhật lô */
  @Patch(':farmId/plots/:plotId')
  updatePlot(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Body() dto: UpdatePlotDto,
    @Request() req: any,
  ) {
    return this.farmsService.updatePlot(farmId, plotId, req.user.userId, req.user.role, dto);
  }

  /** DELETE /farms/:farmId/plots/:plotId - Xóa lô */
  @Delete(':farmId/plots/:plotId')
  removePlot(
    @Param('farmId') farmId: string,
    @Param('plotId') plotId: string,
    @Request() req: any,
  ) {
    return this.farmsService.removePlot(farmId, plotId, req.user.userId, req.user.role);
  }
}
