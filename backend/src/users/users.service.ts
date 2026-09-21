import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/update-user.dto';

const scrypt = promisify(nodeScrypt);

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ────────────────────────────────────────────────
  //  CRUD người dùng
  // ────────────────────────────────────────────────

  /** Lấy danh sách tất cả người dùng (chỉ ADMIN) */
  async findAll() {
    const users = await (this.prisma.user as any).findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        isActive: true,
        approvalStatus: true,
        rejectionReason: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        farms: {
          where: { deletedAt: null },
          select: { id: true, name: true, location: true, totalArea: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    try {
      const avatars = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id, "avatarUrl" FROM "User" WHERE "avatarUrl" IS NOT NULL`,
      );
      const avatarMap = new Map((avatars || []).map((a) => [a.id, a.avatarUrl]));
      for (const u of users) {
        u.avatarUrl = avatarMap.get(u.id) || null;
      }
    } catch {}

    return users;
  }

  /** Lấy thông tin 1 người dùng theo ID */
  async findById(id: string) {
    let user: any = null;
    try {
      user = await (this.prisma.user as any).findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          isActive: true,
          approvalStatus: true,
          rejectionReason: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          farms: {
            where: { deletedAt: null },
            select: { id: true, name: true, location: true, totalArea: true },
          },
        },
      });
    } catch {
      // Fallback nếu cột approvalStatus chưa được migrate trong database
    }

    if (!user) {
      user = await (this.prisma.user as any).findFirst({
        where: { id, deletedAt: null },
        select: {
          id: true,
          email: true,
          phone: true,
          fullName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
          farms: {
            where: { deletedAt: null },
            select: { id: true, name: true, location: true, totalArea: true },
          },
        },
      });
    }

    if (user) {
      try {
        const rows = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT "avatarUrl" FROM "User" WHERE id = $1::uuid LIMIT 1`,
          id,
        );
        user.avatarUrl = rows?.[0]?.avatarUrl || null;
      } catch {
        user.avatarUrl = null;
      }
    }

    return user;
  }

  /** Tìm user theo email (nội bộ) */
  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
    });
  }

  /** Tạo người dùng từ RegisterDto (dùng bởi AuthService) */
  async create(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email đã được sử dụng');

    const passwordHash = await this.hashPassword(dto.password);
    return (this.prisma.user as any).create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        role: dto.role ?? UserRole.OWNER,
        approvalStatus: 'PENDING',
      },
    });
  }

  /** Tìm hoặc tạo người dùng từ Google payload */
  async findOrCreateGoogleUser(payload: { email: string; name?: string; picture?: string }) {
    const email = payload.email.trim().toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản này đã bị vô hiệu hóa');
      }
      user = await (this.prisma.user as any).update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
          ...(payload.picture && !(user as any).avatarUrl ? { avatarUrl: payload.picture } : {}),
        },
      });
      return user;
    }

    const randomPassword = randomBytes(32).toString('hex');
    const passwordHash = await this.hashPassword(randomPassword);

    const newUser = await (this.prisma.user as any).create({
      data: {
        email,
        passwordHash,
        fullName: (payload.name && payload.name.trim()) || 'Người dùng Google',
        role: UserRole.OWNER,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });

    if (payload.picture) {
      try {
        await this.prisma.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;`
        );
        await this.prisma.$executeRawUnsafe(
          `UPDATE "User" SET "avatarUrl" = $1 WHERE id = $2::uuid`,
          payload.picture,
          newUser.id,
        );
      } catch {}
    }

    return newUser;
  }

  /** Cập nhật thông tin cá nhân (chỉ owner hoặc ADMIN) */
  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    // 1. Cập nhật các trường cơ bản bằng Prisma
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        updatedAt: true,
      },
    });

    // 2. Nếu có avatarUrl, cập nhật an toàn bằng raw SQL
    let currentAvatar: string | null = null;
    if (dto.avatarUrl !== undefined) {
      try {
        await this.prisma.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;`
        );
        await this.prisma.$executeRawUnsafe(
          `UPDATE "User" SET "avatarUrl" = $1 WHERE id = $2::uuid`,
          dto.avatarUrl || null,
          id,
        );
        currentAvatar = dto.avatarUrl || null;
      } catch (err) {
        console.error('Lỗi khi lưu avatarUrl vào CSDL:', err);
      }
    } else {
      try {
        const rows = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT "avatarUrl" FROM "User" WHERE id = $1::uuid LIMIT 1`,
          id,
        );
        if (rows && rows[0]) currentAvatar = rows[0].avatarUrl;
      } catch {}
    }

    return {
      ...updatedUser,
      avatarUrl: currentAvatar,
    };
  }

  /** Thay đổi vai trò người dùng (chỉ ADMIN) */
  async updateRole(id: string, dto: UpdateUserRoleDto, requesterId: string) {
    if (id === requesterId) throw new ForbiddenException('Không thể thay đổi vai trò của chính mình');

    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  /** Kích hoạt / vô hiệu hóa tài khoản (chỉ ADMIN) */
  async toggleActive(id: string, requesterId: string) {
    if (id === requesterId) throw new ForbiddenException('Không thể thay đổi trạng thái tài khoản của chính mình');

    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, fullName: true, isActive: true },
    });
  }

  /** Xóa mềm tài khoản người dùng (chỉ ADMIN) */
  async softDelete(id: string, requesterId: string) {
    if (id === requesterId) throw new ForbiddenException('Không thể xóa tài khoản của chính mình');

    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, email: true, fullName: true },
    });
  }

  /** Admin tạo tài khoản cho nông hộ */
  async createByAdmin(dto: { email: string; fullName: string; password: string; role?: string; phone?: string }) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email đã được sử dụng');

    const passwordHash = await this.hashPassword(dto.password);
    return (this.prisma.user as any).create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        role: (dto.role as any) || UserRole.OWNER,
        isActive: true,
        approvalStatus: 'APPROVED',
        emailVerified: true,
      },
      select: {
        id: true, email: true, phone: true, fullName: true, role: true, isActive: true, approvalStatus: true, createdAt: true,
      },
    });
  }

  /** Lấy danh sách tài khoản chờ xét duyệt (chỉ ADMIN) */
  async findPending() {
    return (this.prisma.user as any).findMany({
      where: {
        approvalStatus: 'PENDING',
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Phê duyệt tài khoản (chỉ ADMIN) */
  async approveUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản người dùng');

    return (this.prisma.user as any).update({
      where: { id },
      data: { approvalStatus: 'APPROVED', isActive: true },
      select: { id: true, email: true, fullName: true, approvalStatus: true, isActive: true },
    });
  }

  /** Từ chối tài khoản (chỉ ADMIN) */
  async rejectUser(id: string, reason?: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản người dùng');

    return (this.prisma.user as any).update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
        rejectionReason: reason?.trim() || 'Không đạt điều kiện xét duyệt của DalatAgri',
        isActive: false,
      },
      select: { id: true, email: true, fullName: true, approvalStatus: true, rejectionReason: true, isActive: true },
    });
  }

  /** Khôi phục tài khoản đã xóa mềm */
  async restoreUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản đã xóa');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      select: { id: true, email: true, fullName: true, isActive: true },
    });
  }

  /** Lấy danh sách tài khoản đã xóa (để khôi phục) */
  async findDeleted() {
    return this.prisma.user.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true, email: true, phone: true, fullName: true, role: true,
        isActive: true, deletedAt: true, createdAt: true,
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  /** Thống kê tổng quan cho admin dashboard */
  async getStatistics() {
    try {
      const [totalUsers, activeUsers, pendingUsers, totalFarms, totalSeasons, totalLogs] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }).catch(() => 0),
        this.prisma.user.count({ where: { deletedAt: null, isActive: true } }).catch(() => 0),
        this.prisma.user.count({ where: { deletedAt: null, approvalStatus: 'PENDING' } as any }).catch(() => 0),
        this.prisma.farm.count({ where: { deletedAt: null } }).catch(() => 0),
        this.prisma.cropCycle.count({ where: { deletedAt: null } }).catch(() => 0),
        this.prisma.activityLog.count({ where: { deletedAt: null } }).catch(() => 0),
      ]);

      // Thống kê users theo role
      let usersByRole: any[] = [];
      try {
        const grouped = await this.prisma.user.groupBy({
          by: ['role'],
          where: { deletedAt: null },
          _count: { id: true },
        });
        usersByRole = grouped.map((r: any) => ({ role: r.role, count: r._count?.id || 0 }));
      } catch (e) {
        usersByRole = [];
      }

      // Users đăng ký gần đây (7 ngày)
      const recentUsers = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => []);

      return {
        totalUsers,
        activeUsers,
        pendingUsers,
        inactiveUsers: Math.max(0, totalUsers - activeUsers),
        totalFarms,
        totalSeasons,
        totalLogs,
        usersByRole,
        recentUsers,
      };
    } catch (error) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        inactiveUsers: 0,
        totalFarms: 0,
        totalSeasons: 0,
        totalLogs: 0,
        usersByRole: [],
        recentUsers: [],
      };
    }
  }

  // ────────────────────────────────────────────────
  //  Xác thực (dùng nội bộ bởi AuthService)
  // ────────────────────────────────────────────────

  async verifyCredentials(email: string, password: string) {
    const user: any = await this.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    if (user.role !== 'ADMIN' && user.approvalStatus === 'PENDING') {
      throw new UnauthorizedException('Tài khoản của bạn đang chờ Quản trị viên phê duyệt. Vui lòng quay lại sau.');
    }
    if (user.role !== 'ADMIN' && user.approvalStatus === 'REJECTED') {
      throw new UnauthorizedException(`Tài khoản đã bị từ chối phê duyệt. Lý do: ${user.rejectionReason || 'Không đủ điều kiện'}`);
    }

    const isMatch = await this.verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      // Tăng failedLoginAttempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Reset failedLoginAttempts và cập nhật lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
    });

    return user;
  }

  createSession(user: any) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone || null,
        avatarUrl: (user as any).avatarUrl || null,
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt || new Date().toISOString(),
      },
    };
  }

  // ────────────────────────────────────────────────
  //  Mã hóa mật khẩu
  // ────────────────────────────────────────────────

  async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verifyPassword(password: string, storedHash: string) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;

    const storedKey = Buffer.from(key, 'hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
  }

  // ────────────────────────────────────────────────
  //  Quên mật khẩu / Đặt lại mật khẩu
  // ────────────────────────────────────────────────

  async saveResetToken(userId: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  async findByResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  async resetPassword(userId: string, newPasswordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  /** Admin đặt lại mật khẩu của người dùng bất kỳ */
  async adminResetPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản người dùng');
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu phải có ít nhất 6 ký tự');
    }
    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { message: `Đã đặt lại mật khẩu thành công cho ${user.fullName || user.email}` };
  }
}
