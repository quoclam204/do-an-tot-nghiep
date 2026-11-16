import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../auth/mail.service';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

describe('UsersService (Quản lý người dùng & Xác thực)', () => {
  let service: UsersService;
  let prisma: any;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;
  let mailService: Partial<Record<keyof MailService, jest.Mock>>;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      refreshToken: {
        deleteMany: jest.fn(),
      },
      farmMember: {
        deleteMany: jest.fn(),
      },
      farm: { count: jest.fn().mockResolvedValue(0) },
      cropCycle: { count: jest.fn().mockResolvedValue(0) },
      activityLog: { count: jest.fn().mockResolvedValue(0) },
      $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    mailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
      sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ================================================================
  // Đăng ký tài khoản
  // ================================================================

  describe('Tạo tài khoản (create)', () => {
    it('phải tạo tài khoản thành công với email chưa tồn tại', async () => {
      const dto = {
        email: 'bac.nong@dalatagri.vn',
        password: 'MatKhau@123',
        fullName: 'Bác Nông Dân',
      };

      prisma.user.findUnique.mockResolvedValue(null); // Chưa tồn tại
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: dto.email,
        fullName: dto.fullName,
        role: 'OWNER',
        approvalStatus: 'PENDING',
      });

      const result = await service.create(dto as any);
      expect(result.email).toBe(dto.email);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('phải ném BadRequestException nếu email đã tồn tại', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.create({
          email: 'da.ton.tai@dalatagri.vn',
          password: 'SomePass',
          fullName: 'Người Đã Có',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ================================================================
  // Xác thực đăng nhập (verifyCredentials)
  // ================================================================

  describe('Xác thực thông tin đăng nhập (verifyCredentials)', () => {
    it('phải ném UnauthorizedException nếu email không tồn tại', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyCredentials('khong.ton.tai@dalatagri.vn', 'BatKyPass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('phải ném UnauthorizedException nếu tài khoản bị vô hiệu hóa', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        email: 'bi.khoa@dalatagri.vn',
        passwordHash: 'hash:123',
        isActive: false,
        approvalStatus: 'APPROVED',
        role: 'OWNER',
      });

      await expect(
        service.verifyCredentials('bi.khoa@dalatagri.vn', 'DungPass'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('phải ném UnauthorizedException với thông báo "chờ phê duyệt" khi tài khoản PENDING', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-2',
        email: 'cho.duyet@dalatagri.vn',
        passwordHash: 'hash:abc',
        isActive: true,
        approvalStatus: 'PENDING',
        role: 'OWNER',
      });

      await expect(
        service.verifyCredentials('cho.duyet@dalatagri.vn', 'BatKyPass'),
      ).rejects.toThrow(/phê duyệt/i);
    });

    it('phải ném UnauthorizedException khi tài khoản bị từ chối (REJECTED)', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-3',
        email: 'bi.tu.choi@dalatagri.vn',
        passwordHash: 'hash:xyz',
        isActive: false,
        approvalStatus: 'REJECTED',
        rejectionReason: 'Thông tin không hợp lệ',
        role: 'OWNER',
      });

      await expect(
        service.verifyCredentials('bi.tu.choi@dalatagri.vn', 'BatKyPass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ================================================================
  // createSession
  // ================================================================

  describe('Tạo phiên làm việc (createSession)', () => {
    it('phải trả về accessToken và thông tin user cơ bản', () => {
      const mockUser = {
        id: 'user-id-1',
        email: 'farmer@dalatagri.vn',
        fullName: 'Nguyễn Thị Hoa',
        role: 'OWNER',
        phone: '0901234567',
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      const result = service.createSession(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: mockUser.id, email: mockUser.email }),
      );
      expect(result.accessToken).toBe('mocked-jwt-token');
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      // Không được tiết lộ passwordHash hay thông tin nhạy cảm
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  // ================================================================
  // Quyền ADMIN — toggleActive, updateRole, softDelete
  // ================================================================

  describe('Thao tác quản trị (Admin actions)', () => {
    const adminId = 'admin-user-id';
    const targetId = 'target-user-id';

    it('phải ném ForbiddenException khi admin cố thay đổi trạng thái của chính mình (toggleActive)', async () => {
      await expect(service.toggleActive(adminId, adminId)).rejects.toThrow(ForbiddenException);
    });

    it('phải ném ForbiddenException khi admin cố thay đổi role của chính mình (updateRole)', async () => {
      await expect(
        service.updateRole(adminId, { role: 'WORKER' } as any, adminId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('phải ném ForbiddenException khi admin cố tự xóa tài khoản mình (softDelete)', async () => {
      await expect(service.softDelete(adminId, adminId)).rejects.toThrow(ForbiddenException);
    });

    it('phải ném ForbiddenException khi admin cố xóa vĩnh viễn tài khoản mình (permanentDelete)', async () => {
      await expect(service.permanentDelete(adminId, adminId)).rejects.toThrow(ForbiddenException);
    });

    it('phải ném BadRequestException khi thay đổi trạng thái user không tồn tại', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.toggleActive(targetId, adminId)).rejects.toThrow(BadRequestException);
    });

    it('phải phê duyệt tài khoản thành công (approveUser)', async () => {
      const mockUser = { id: targetId, email: 'pending@dalatagri.vn', deletedAt: null };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        id: targetId,
        email: mockUser.email,
        approvalStatus: 'APPROVED',
        isActive: true,
      });

      const result = await service.approveUser(targetId);
      expect(result.approvalStatus).toBe('APPROVED');
      expect(result.isActive).toBe(true);
    });

    it('phải từ chối tài khoản với lý do cụ thể (rejectUser)', async () => {
      const mockUser = { id: targetId, email: 'pending@dalatagri.vn', deletedAt: null };
      prisma.user.findFirst.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        id: targetId,
        approvalStatus: 'REJECTED',
        rejectionReason: 'Thông tin nông hộ chưa đầy đủ',
        isActive: false,
      });

      const result = await service.rejectUser(targetId, 'Thông tin nông hộ chưa đầy đủ');
      expect(result.approvalStatus).toBe('REJECTED');
      expect(result.isActive).toBe(false);
    });
  });

  // ================================================================
  // Khôi phục tài khoản
  // ================================================================

  describe('Khôi phục tài khoản (restoreUser)', () => {
    it('phải ném BadRequestException nếu không tìm thấy tài khoản đã xóa', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(service.restoreUser('nonexistent-id')).rejects.toThrow(BadRequestException);
    });

    it('phải khôi phục tài khoản thành công (xóa deletedAt, bật isActive)', async () => {
      const deletedUser = { id: targetId, email: 'khoi.phuc@dalatagri.vn', deletedAt: new Date() };
      prisma.user.findFirst.mockResolvedValue(deletedUser);
      prisma.user.update.mockResolvedValue({ id: targetId, isActive: true, deletedAt: null });

      const result = await service.restoreUser(targetId);
      expect(result.isActive).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ deletedAt: null, isActive: true }) }),
      );
    });
  });
});
