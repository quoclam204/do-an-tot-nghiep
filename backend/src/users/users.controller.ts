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
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users - Danh sách tất cả người dùng (chỉ ADMIN) */
  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  /** GET /users/me - Thông tin cá nhân đang đăng nhập */
  @Get('me')
  getMe(@Request() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  /** PATCH /users/me - Cập nhật thông tin cá nhân */
  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  /** GET /users/:id - Thông tin 1 người dùng (ADMIN) */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /** PATCH /users/:id/role - Thay đổi vai trò (ADMIN) */
  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.usersService.updateRole(id, dto, req.user.userId);
  }

  /** PATCH /users/:id/toggle-active - Kích hoạt/vô hiệu hóa (ADMIN) */
  @Patch(':id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  toggleActive(@Param('id') id: string, @Request() req: any) {
    return this.usersService.toggleActive(id, req.user.userId);
  }

  /** DELETE /users/:id - Xóa mềm người dùng (ADMIN) */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.usersService.softDelete(id, req.user.userId);
  }

  /** POST /users/admin/create - Admin tạo tài khoản mới */
  @Post('admin/create')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  createByAdmin(@Body() dto: { email: string; fullName: string; password: string; role?: string; phone?: string }) {
    return this.usersService.createByAdmin(dto);
  }

  /** PATCH /users/:id/restore - Khôi phục tài khoản đã xóa (ADMIN) */
  @Patch(':id/restore')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  restoreUser(@Param('id') id: string) {
    return this.usersService.restoreUser(id);
  }

  /** GET /users/deleted - Danh sách tài khoản đã xóa (ADMIN) */
  @Get('deleted')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findDeleted() {
    return this.usersService.findDeleted();
  }

  /** GET /users/pending-approvals - Danh sách tài khoản chờ duyệt (ADMIN) */
  @Get('pending-approvals')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findPending() {
    return this.usersService.findPending();
  }

  /** PATCH /users/:id/approve - Phê duyệt tài khoản (ADMIN) */
  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  approveUser(@Param('id') id: string) {
    return this.usersService.approveUser(id);
  }

  /** PATCH /users/:id/reject - Từ chối tài khoản (ADMIN) */
  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  rejectUser(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.usersService.rejectUser(id, body?.reason);
  }

  /** GET /users/statistics - Thống kê tổng quan (ADMIN) */
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getStatistics() {
    return this.usersService.getStatistics();
  }
}
