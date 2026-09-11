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
    return this.prisma.user.findMany({
      where: { deletedAt: null },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Lấy thông tin 1 người dùng theo ID */
  async findById(id: string) {
    return this.prisma.user.findFirst({
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
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: dto.fullName.trim(),
        role: dto.role ?? UserRole.OWNER,
      },
    });
  }

  /** Tìm hoặc tạo người dùng từ Google payload */
  async findOrCreateGoogleUser(payload: { email: string; name?: string }) {
    const email = payload.email.trim().toLowerCase();
    let user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (user) {
      if (!user.isActive) {
        throw new UnauthorizedException('Tài khoản này đã bị vô hiệu hóa');
      }
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
        },
      });
      return user;
    }

    const randomPassword = randomBytes(32).toString('hex');
    const passwordHash = await this.hashPassword(randomPassword);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: (payload.name && payload.name.trim()) || 'Người dùng Google',
        role: UserRole.OWNER,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    });
  }

  /** Cập nhật thông tin cá nhân (chỉ owner hoặc ADMIN) */
  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName.trim() }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
      },
      select: {
        id: true, email: true, phone: true, fullName: true, role: true, updatedAt: true,
      },
    });
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

  // ────────────────────────────────────────────────
  //  Xác thực (dùng nội bộ bởi AuthService)
  // ────────────────────────────────────────────────

  async verifyCredentials(email: string, password: string) {
    const user = await this.findByEmail(email);
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    if (!user.isActive) throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');

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

  createSession(user: { id: string; email: string; fullName: string; role: string }) {
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
}
