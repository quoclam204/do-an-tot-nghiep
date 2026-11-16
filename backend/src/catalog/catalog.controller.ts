import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// =====================================================================
// CatalogController — DalatAgri API
//
// Quy tắc bảo mật:
//  - Endpoint ĐỌC danh mục hệ thống (crops, growth-cycles, materials):
//    public — thiết bị offline cần đồng bộ danh mục mà không cần token.
//  - Mọi thao tác GHI (POST/PATCH/DELETE) và đọc dữ liệu riêng của nông hộ:
//    bắt buộc JwtAuthGuard.
//  - Endpoint seed dữ liệu mẫu: chỉ ADMIN.
// =====================================================================

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ==================== FARMS (NÔNG HỘ — qua Admin catalog) ====================

  /** GET /catalog/farms — danh sách nông hộ (public: offline sync) */
  @Get('farms')
  findFarms() {
    return this.catalogService.findFarms();
  }

  /** POST /catalog/farms — tạo nông hộ (phải đăng nhập) */
  @Post('farms')
  @UseGuards(JwtAuthGuard)
  createFarm(@Body() body: any) {
    return this.catalogService.createFarm(body);
  }

  /** PATCH /catalog/farms/:id — cập nhật nông hộ (phải đăng nhập) */
  @Patch('farms/:id')
  @UseGuards(JwtAuthGuard)
  updateFarm(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateFarm(id, body);
  }

  /** DELETE /catalog/farms/:id — xóa nông hộ (chỉ ADMIN) */
  @Delete('farms/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteFarm(@Param('id') id: string) {
    return this.catalogService.deleteFarm(id);
  }

  // ==================== PLOTS (LÔ ĐẤT) ====================

  /** GET /catalog/plots — danh sách lô trồng (phải đăng nhập) */
  @Get('plots')
  @UseGuards(JwtAuthGuard)
  findPlots(@Request() req: any, @Query('farmId') farmId?: string) {
    return this.catalogService.findPlots(req.user?.userId, req.user?.role, farmId);
  }

  /** POST /catalog/plots — tạo lô trồng (phải đăng nhập) */
  @Post('plots')
  @UseGuards(JwtAuthGuard)
  createPlot(@Body() body: any) {
    return this.catalogService.createPlot(body);
  }

  /** PATCH /catalog/plots/:id — cập nhật lô trồng (phải đăng nhập) */
  @Patch('plots/:id')
  @UseGuards(JwtAuthGuard)
  updatePlot(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updatePlot(id, body);
  }

  /** DELETE /catalog/plots/:id — xóa lô trồng (phải đăng nhập) */
  @Delete('plots/:id')
  @UseGuards(JwtAuthGuard)
  deletePlot(@Param('id') id: string) {
    return this.catalogService.deletePlot(id);
  }

  // ==================== CROPS (CÂY TRỒNG — danh mục hệ thống) ====================

  /** GET /catalog/crops — public (offline sync cần danh mục cây) */
  @Get('crops')
  findCrops() {
    return this.catalogService.findCrops();
  }

  /** POST /catalog/crops — tạo cây trồng (chỉ ADMIN) */
  @Post('crops')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createCrop(@Body() body: any) {
    return this.catalogService.createCrop(body);
  }

  /** PATCH /catalog/crops/:id — cập nhật cây trồng (chỉ ADMIN) */
  @Patch('crops/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateCrop(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateCrop(id, body);
  }

  /** DELETE /catalog/crops/:id — xóa cây trồng (chỉ ADMIN) */
  @Delete('crops/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteCrop(@Param('id') id: string) {
    return this.catalogService.deleteCrop(id);
  }

  // ==================== GROWTH CYCLES (CHU KỲ SINH TRƯỞNG — danh mục) ====================

  /** GET /catalog/growth-cycles — public (offline sync) */
  @Get('growth-cycles')
  findGrowthCycles() {
    return this.catalogService.findGrowthCycles();
  }

  /** POST /catalog/growth-cycles — tạo chu kỳ (chỉ ADMIN) */
  @Post('growth-cycles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  createGrowthCycle(@Body() body: any) {
    return this.catalogService.createGrowthCycle(body);
  }

  /** PATCH /catalog/growth-cycles/:id — cập nhật chu kỳ (chỉ ADMIN) */
  @Patch('growth-cycles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateGrowthCycle(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateGrowthCycle(id, body);
  }

  /** DELETE /catalog/growth-cycles/:id — xóa chu kỳ (chỉ ADMIN) */
  @Delete('growth-cycles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteGrowthCycle(@Param('id') id: string) {
    return this.catalogService.deleteGrowthCycle(id);
  }

  // ==================== SEASONS (MÙA VỤ) ====================

  /** GET /catalog/seasons — danh sách mùa vụ (phải đăng nhập) */
  @Get('seasons')
  @UseGuards(JwtAuthGuard)
  findSeasons(@Request() req: any, @Query('farmId') farmId?: string) {
    return this.catalogService.findSeasons(req.user?.userId, req.user?.role, farmId);
  }

  /** POST /catalog/seasons — tạo mùa vụ (phải đăng nhập) */
  @Post('seasons')
  @UseGuards(JwtAuthGuard)
  createSeason(@Body() body: any) {
    return this.catalogService.createSeason(body);
  }

  /** GET /catalog/seasons/:id — chi tiết mùa vụ (phải đăng nhập) */
  @Get('seasons/:id')
  @UseGuards(JwtAuthGuard)
  findOneSeason(@Param('id') id: string) {
    return this.catalogService.findOneSeason(id);
  }

  /** GET /catalog/seasons/:id/financial-summary — tóm tắt tài chính mùa vụ (phải đăng nhập) */
  @Get('seasons/:id/financial-summary')
  @UseGuards(JwtAuthGuard)
  getSeasonFinancialSummary(@Param('id') id: string) {
    return this.catalogService.getSeasonFinancialSummary(id);
  }

  /** GET /catalog/seasons/:id/material-consumption — tiêu hao vật tư mùa vụ (phải đăng nhập) */
  @Get('seasons/:id/material-consumption')
  @UseGuards(JwtAuthGuard)
  getSeasonMaterialConsumption(@Param('id') id: string) {
    return this.catalogService.getSeasonMaterialConsumption(id);
  }

  /** PATCH /catalog/seasons/:id — cập nhật mùa vụ (phải đăng nhập) */
  @Patch('seasons/:id')
  @UseGuards(JwtAuthGuard)
  updateSeason(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateSeason(id, body);
  }

  /** DELETE /catalog/seasons/:id — xóa mùa vụ (phải đăng nhập) */
  @Delete('seasons/:id')
  @UseGuards(JwtAuthGuard)
  deleteSeason(@Param('id') id: string) {
    return this.catalogService.deleteSeason(id);
  }

  // ==================== MATERIALS (VẬT TƯ: PHÂN, THUỐC BVTV) ====================

  /** GET /catalog/materials — public (offline sync cần danh mục vật tư) */
  @Get('materials')
  findMaterials() {
    return this.catalogService.findMaterials();
  }

  /** POST /catalog/materials — tạo vật tư (phải đăng nhập) */
  @Post('materials')
  @UseGuards(JwtAuthGuard)
  createMaterial(@Body() body: any) {
    return this.catalogService.createMaterial(body);
  }

  /** PATCH /catalog/materials/:id — cập nhật vật tư (phải đăng nhập) */
  @Patch('materials/:id')
  @UseGuards(JwtAuthGuard)
  updateMaterial(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateMaterial(id, body);
  }

  /** DELETE /catalog/materials/:id — xóa vật tư (phải đăng nhập) */
  @Delete('materials/:id')
  @UseGuards(JwtAuthGuard)
  deleteMaterial(@Param('id') id: string) {
    return this.catalogService.deleteMaterial(id);
  }

  /** GET /catalog/material-history/:materialId — lịch sử vật tư (phải đăng nhập) */
  @Get('material-history/:materialId')
  @UseGuards(JwtAuthGuard)
  findMaterialHistory(@Param('materialId') materialId: string) {
    return this.catalogService.findMaterialHistory(materialId);
  }

  // ==================== ACTIVITY LOGS (NHẬT KÝ CANH TÁC) ====================

  /** GET /catalog/activity-logs — danh sách nhật ký (phải đăng nhập) */
  @Get('activity-logs')
  @UseGuards(JwtAuthGuard)
  findActivityLogs(
    @Request() req: any,
    @Query('cropCycleId') cropCycleId?: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.catalogService.findActivityLogs(req.user?.userId, req.user?.role, cropCycleId, farmId);
  }

  /** POST /catalog/activity-logs — tạo nhật ký canh tác (phải đăng nhập) */
  @Post('activity-logs')
  @UseGuards(JwtAuthGuard)
  createActivityLog(@Body() body: any) {
    return this.catalogService.createActivityLog(body);
  }

  /** PATCH /catalog/activity-logs/:id — cập nhật nhật ký (phải đăng nhập) */
  @Patch('activity-logs/:id')
  @UseGuards(JwtAuthGuard)
  updateActivityLog(@Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateActivityLog(id, body);
  }

  /** DELETE /catalog/activity-logs/:id — xóa nhật ký (phải đăng nhập) */
  @Delete('activity-logs/:id')
  @UseGuards(JwtAuthGuard)
  deleteActivityLog(@Param('id') id: string) {
    return this.catalogService.deleteActivityLog(id);
  }

  // ==================== FINANCIAL REPORT ====================

  /** GET /catalog/financial-report — báo cáo tài chính (phải đăng nhập) */
  @Get('financial-report')
  @UseGuards(JwtAuthGuard)
  getFinancialReport(
    @Query() query: { cropCycleId?: string; farmId?: string; plotId?: string; startDate?: string; endDate?: string },
  ) {
    return this.catalogService.getFinancialReport(query);
  }

  // ==================== INVENTORY (TỒN KHO) ====================

  /** GET /catalog/inventory — tồn kho (phải đăng nhập) */
  @Get('inventory')
  @UseGuards(JwtAuthGuard)
  findInventory(@Request() req: any, @Query('farmId') farmId?: string) {
    return this.catalogService.findInventory(req.user?.userId, req.user?.role, farmId);
  }

  /** POST /catalog/inventory — nhập kho (phải đăng nhập) */
  @Post('inventory')
  @UseGuards(JwtAuthGuard)
  createInventory(@Request() req: any, @Body() body: any) {
    return this.catalogService.createInventory(body, req.user?.userId, req.user?.role);
  }

  /** PATCH /catalog/inventory/:id — cập nhật tồn kho (phải đăng nhập) */
  @Patch('inventory/:id')
  @UseGuards(JwtAuthGuard)
  updateInventory(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.catalogService.updateInventory(id, body, req.user?.userId, req.user?.role);
  }

  /** DELETE /catalog/inventory/:id — xóa bản ghi tồn kho (phải đăng nhập) */
  @Delete('inventory/:id')
  @UseGuards(JwtAuthGuard)
  deleteInventory(@Request() req: any, @Param('id') id: string) {
    return this.catalogService.deleteInventory(id, req.user?.userId, req.user?.role);
  }

  // ==================== SEED LÂM ĐỒNG (chỉ ADMIN) ====================

  /** POST /catalog/seed-lamdong — seed dữ liệu mẫu Lâm Đồng (chỉ ADMIN) */
  @Post('seed-lamdong')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  seedLamDong() {
    return this.catalogService.seedLamDongData();
  }

  // ==================== ADMIN: TOÀN HỆ THỐNG ====================

  /** GET /catalog/admin/farms — Tất cả nông hộ/nông trại (ADMIN) */
  @Get('admin/farms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminGetAllFarms(@Query('search') search?: string, @Query('location') location?: string) {
    return this.catalogService.adminGetAllFarms({ search, location });
  }

  /** GET /catalog/admin/activity-logs — Tất cả nhật ký toàn hệ thống (ADMIN) */
  @Get('admin/activity-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminGetAllActivityLogs(
    @Query('farmId') farmId?: string,
    @Query('syncStatus') syncStatus?: string,
    @Query('activityType') activityType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.adminGetAllActivityLogs({
      farmId,
      syncStatus,
      activityType,
      from,
      to,
      limit: limit ? parseInt(limit) : 100,
    });
  }
}
