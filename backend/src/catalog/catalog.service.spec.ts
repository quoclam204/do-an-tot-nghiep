import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CatalogService (Nhật Ký Canh Tác, Hạch Toán Chi Phí & Tồn Kho)', () => {
  let service: CatalogService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cropCycle: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      material: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      inventory: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      activityLog: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      plot: {
        findFirst: jest.fn(),
      },
      farm: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
  });

  describe('Hạch toán chi phí hoạt động canh tác (Cost Calculation)', () => {
    const cropCycleId = 'season-uuid-1';
    const mockSeason = {
      id: cropCycleId,
      name: 'Vụ Cà Phê 2026',
      plot: { farmId: 'farm-1', name: 'Lô A' },
    };

    it('phải tính toán chính xác: Tổng chi phí = Nhân công thuê + Chi phí khác + Vật tư tiêu hao', async () => {
      prisma.cropCycle.findFirst.mockResolvedValue(mockSeason);

      const mockMaterial = {
        id: 'mat-1',
        name: 'Phân NPK 16-16-8',
        defaultPrice: 18000,
      };
      prisma.material.findFirst.mockResolvedValue(mockMaterial);

      const mockInventory = {
        id: 'inv-1',
        farmId: 'farm-1',
        materialId: 'mat-1',
        quantity: 100, // Tồn 100kg
        totalCost: 1800000, // 18.000 đ/kg
      };
      prisma.inventory.findFirst.mockResolvedValue(mockInventory);
      prisma.inventory.update.mockResolvedValue({ ...mockInventory, quantity: 60 });

      const input = {
        cropCycleId,
        activityType: 'BON_PHAN',
        activityDate: '2026-10-26',
        isHiredLabor: true,
        laborWorkers: 2,
        laborWagePerDay: 200000, // Tiền công = 2 * 200.000 = 400.000 đ
        otherCosts: 50000,       // Chi phí khác = 50.000 đ
        materials: [
          {
            materialId: 'mat-1',
            quantityUsed: 40,    // Dùng 40kg -> 40 * 18.000 = 720.000 đ
          },
        ],
      };

      prisma.activityLog.create.mockImplementation((args: any) => {
        return Promise.resolve({
          id: 'log-1',
          ...args.data,
        });
      });

      const result = await service.createActivityLog(input);

      // Kiểm tra tính tiền nhân công: 2 * 200.000 = 400.000
      expect(result.laborCost).toBe(400000);
      // Kiểm tra chi phí khác: 50.000
      expect(result.otherCosts).toBe(50000);
      // Tổng chi phí hoạt động = 400.000 (công) + 50.000 (khác) + 720.000 (vật tư) = 1.170.000 đ
      expect(result.cost).toBe(1170000);

      // Kiểm tra kho vật tư đã tự động trừ 40kg (100 - 40 = 60kg)
      expect(prisma.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({ quantity: 60 }),
        }),
      );
    });

    it('phải tính toán doanh thu và cập nhật tổng sản lượng khi thu hoạch nông sản', async () => {
      prisma.cropCycle.findFirst.mockResolvedValue(mockSeason);

      const harvestInput = {
        cropCycleId,
        activityType: 'THU_HOACH',
        activityDate: '2026-10-26',
        harvestQuantity: 2000, // 2000 kg (2 tấn)
        unitPrice: 90000,      // 90.000 đ/kg
      };

      prisma.activityLog.create.mockImplementation((args: any) => {
        return Promise.resolve({
          id: 'harvest-log-1',
          ...args.data,
        });
      });

      prisma.activityLog.aggregate.mockResolvedValue({
        _sum: { harvestQuantity: 2000 },
      });
      prisma.cropCycle.update.mockResolvedValue({ ...mockSeason, totalYield: 2000 });

      const result = await service.createActivityLog(harvestInput);

      // Doanh thu = 2000 * 90.000 = 180.000.000 đ
      expect(result.revenue).toBe(180000000);
      expect(result.harvestQuantity).toBe(2000);

      // Kiểm tra tổng sản lượng mùa vụ đã được cập nhật
      expect(prisma.cropCycle.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: cropCycleId },
          data: { totalYield: 2000 },
        }),
      );
    });
  });

  describe('Hoàn trả tồn kho khi xóa nhật ký (Inventory Rollback)', () => {
    it('phải cộng hoàn lại số lượng vật tư vào kho khi xóa nhật ký đã dùng vật tư', async () => {
      const logId = 'log-to-delete';
      const mockLog = {
        id: logId,
        activityType: 'BON_PHAN',
        cropCycle: {
          plot: { farmId: 'farm-1' },
        },
        materials: [
          { materialId: 'mat-1', quantityUsed: 30 }, // Đã dùng 30kg
        ],
      };

      prisma.activityLog.findFirst.mockResolvedValue(mockLog);

      const currentInventory = {
        id: 'inv-1',
        farmId: 'farm-1',
        materialId: 'mat-1',
        quantity: 50, // Hiện đang còn 50kg
        totalCost: 900000,
        material: { defaultPrice: 18000 },
      };
      prisma.inventory.findFirst.mockResolvedValue(currentInventory);
      prisma.inventory.update.mockResolvedValue(true);
      prisma.activityLog.update = jest.fn().mockResolvedValue(true);

      await service.deleteActivityLog(logId);

      // Kiểm tra kho đã được hoàn trả 30kg: 50 + 30 = 80kg
      expect(prisma.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'inv-1' },
          data: expect.objectContaining({ quantity: 80 }),
        }),
      );
    });

    it('phải ném NotFoundException nếu nhật ký không tồn tại', async () => {
      prisma.activityLog.findFirst.mockResolvedValue(null);

      await expect(service.deleteActivityLog('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
