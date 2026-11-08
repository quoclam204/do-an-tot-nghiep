import { Test, TestingModule } from '@nestjs/testing';
import { FarmsService } from './farms.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('FarmsService (Nông Hộ & Lô Trồng)', () => {
  let service: FarmsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      farm: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      plot: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      farmMember: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FarmsService>(FarmsService);
  });

  describe('Tạo nông hộ mới (Create Farm)', () => {
    it('phải tạo nông hộ thành công khi dữ liệu hợp lệ', async () => {
      const dto = {
        name: 'Trang Trại Cà Phê Cầu Đất',
        location: 'Trạm Hành, TP. Đà Lạt',
        totalArea: 2.5,
      };

      const mockCreatedFarm = {
        id: 'farm-1',
        userId: 'user-owner-1',
        ...dto,
      };

      prisma.farm.create.mockResolvedValue(mockCreatedFarm);

      const result = await service.create('user-owner-1', dto as any);

      expect(prisma.farm.create).toHaveBeenCalled();
      expect(result.id).toBe('farm-1');
      expect(result.name).toBe(dto.name);
    });

    it('phải báo lỗi nếu diện tích nông hộ nhỏ hơn hoặc bằng 0', async () => {
      const dto = {
        name: 'Trang Trại Lỗi',
        location: 'Đà Lạt',
        totalArea: -1,
      };

      await expect(service.create('user-owner-1', dto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Ràng buộc diện tích Lô đất (Plot Area Constraint)', () => {
    const farmId = 'farm-uuid-1';
    const userId = 'user-owner-1';
    const mockFarm = {
      id: farmId,
      userId,
      name: 'Vườn Sầu Riêng Đạ Huoai',
      totalArea: 2.0, // 2 hecta
      members: [],
    };

    it('phải tạo lô trồng thành công khi tổng diện tích không vượt quá diện tích nông hộ', async () => {
      prisma.farm.findFirst.mockResolvedValue(mockFarm);
      // Hiện tại đã dùng 0.8 ha
      prisma.plot.aggregate.mockResolvedValue({
        _sum: { area: 0.8 },
      });

      const newPlot = {
        id: 'plot-1',
        farmId,
        name: 'Lô A1 - Sầu riêng Ri6',
        area: 1.0, // Thêm 1.0 ha -> Tổng 1.8 ha <= 2.0 ha (Hợp lệ)
      };
      prisma.plot.create.mockResolvedValue(newPlot);

      const result = await service.createPlot(farmId, userId, 'OWNER', {
        name: newPlot.name,
        area: 1.0,
      } as any);

      expect(result.area).toBe(1.0);
      expect(prisma.plot.create).toHaveBeenCalled();
    });

    it('phải ném BadRequestException khi tổng diện tích các lô vượt quá diện tích nông hộ', async () => {
      prisma.farm.findFirst.mockResolvedValue(mockFarm);
      // Hiện tại đã dùng 1.5 ha
      prisma.plot.aggregate.mockResolvedValue({
        _sum: { area: 1.5 },
      });

      // Cố gắng thêm 0.8 ha nữa -> 1.5 + 0.8 = 2.3 ha > 2.0 ha (Quá diện tích vườn)
      await expect(
        service.createPlot(farmId, userId, 'OWNER', {
          name: 'Lô Vượt Diện Tích',
          area: 0.8,
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('phải ngăn chặn người dùng không thuộc nông hộ thao tác (ForbiddenException)', async () => {
      prisma.farm.findFirst.mockResolvedValue(mockFarm);

      // User lạ "intruder-user" không phải chủ cũng không phải thành viên
      await expect(
        service.createPlot(farmId, 'intruder-user', 'WORKER', {
          name: 'Lô Đất Lạ',
          area: 0.5,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
