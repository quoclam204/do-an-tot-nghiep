import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) { }

  findFarms() {
    return this.prisma.farm.findMany({
      where: { deletedAt: null },
      include: { plots: { where: { deletedAt: null } } },
    });
  }
  async createFarm(input: any) {
    let totalArea = Number(input.totalArea);
    if (input.unit === 'm2' || input.unit === 'm²') {
      totalArea = Number((totalArea / 10000).toFixed(4));
    }
    this.requirePositive(totalArea, 'totalArea');
    await this.requireUser(input.userId);
    return this.prisma.farm.create({
      data: {
        userId: input.userId,
        name: this.text(input.name, 'name'),
        location: this.text(input.location, 'location'),
        totalArea,
      },
    });
  }
  async updateFarm(id: string, input: any) {
    const dataToUpdate: any = this.pick(input, ['name', 'location']);
    if (input.totalArea !== undefined) {
      let totalArea = Number(input.totalArea);
      if (input.unit === 'm2' || input.unit === 'm²') {
        totalArea = Number((totalArea / 10000).toFixed(4));
      }
      this.requirePositive(totalArea, 'totalArea');
      const usedArea = await this.prisma.plot.aggregate({
        where: { farmId: id, deletedAt: null },
        _sum: { area: true },
      });
      if ((usedArea._sum.area || 0) > totalArea)
        throw new BadRequestException(
          'Diện tích vườn không đủ cho các lô hiện có',
        );
      dataToUpdate.totalArea = totalArea;
    }
    return this.prisma.farm.update({
      where: { id },
      data: dataToUpdate,
    });
  }
  async deleteFarm(id: string) {
    if (await this.hasChildren('plot', { farmId: id }))
      throw new ConflictException('Không thể xóa vườn đã có lô');
    return this.softDelete(this.prisma.farm, id);
  }

  findPlots() {
    return this.prisma.plot.findMany({
      where: { deletedAt: null },
      include: { farm: true },
    });
  }
  async createPlot(input: any) {
    let area = Number(input.area);
    if (input.unit === 'm2' || input.unit === 'm²') {
      area = Number((area / 10000).toFixed(4));
    }
    this.requirePositive(area, 'area');
    const farm = await this.prisma.farm.findFirst({
      where: { id: input.farmId, deletedAt: null },
    });
    if (!farm) throw new NotFoundException('Không tìm thấy vườn');
    const usedArea = await this.prisma.plot.aggregate({
      where: { farmId: input.farmId, deletedAt: null },
      _sum: { area: true },
    });
    if ((usedArea._sum.area || 0) + area > farm.totalArea + 0.0001)
      throw new BadRequestException(
        `Tổng diện tích các lô vượt quá diện tích vườn (${farm.totalArea} ha)`,
      );
    return this.prisma.plot.create({
      data: {
        farmId: input.farmId,
        name: this.text(input.name, 'name'),
        area,
      },
    });
  }
  async updatePlot(id: string, input: any) {
    const dataToUpdate: any = this.pick(input, ['name']);
    if (input.area !== undefined) {
      let area = Number(input.area);
      if (input.unit === 'm2' || input.unit === 'm²') {
        area = Number((area / 10000).toFixed(4));
      }
      this.requirePositive(area, 'area');
      const plot = await this.prisma.plot.findUnique({ where: { id } });
      if (!plot) throw new NotFoundException('Không tìm thấy lô trồng');
      const farm = await this.prisma.farm.findUnique({
        where: { id: plot.farmId },
      });
      const otherArea = await this.prisma.plot.aggregate({
        where: { farmId: plot.farmId, id: { not: id }, deletedAt: null },
        _sum: { area: true },
      });
      if (
        farm &&
        (otherArea._sum.area || 0) + area > farm.totalArea + 0.0001
      )
        throw new BadRequestException(
          `Tổng diện tích các lô vượt quá diện tích vườn (${farm.totalArea} ha)`,
        );
      dataToUpdate.area = area;
    }
    return this.prisma.plot.update({
      where: { id },
      data: dataToUpdate,
    });
  }
  async deletePlot(id: string) {
    if (await this.hasChildren('cropCycle', { plotId: id }))
      throw new ConflictException('Không thể xóa lô đã có mùa vụ');
    return this.softDelete(this.prisma.plot, id);
  }

  findCrops() {
    return this.prisma.crop.findMany({
      where: { deletedAt: null },
      include: {
        growthCycles: {
          where: { deletedAt: null },
          include: {
            stages: {
              where: { deletedAt: null },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });
  }
  createCrop(input: any) {
    return this.prisma.crop.create({
      data: {
        name: this.text(input.name, 'name'),
        type: this.text(input.type, 'type'),
      },
    });
  }
  updateCrop(id: string, input: any) {
    return this.prisma.crop.update({
      where: { id },
      data: this.pick(input, ['name', 'type']),
    });
  }
  async deleteCrop(id: string) {
    if (await this.hasChildren('cropCycle', { cropId: id }))
      throw new ConflictException('Không thể xóa cây trồng đã có mùa vụ');
    return this.softDelete(this.prisma.crop, id);
  }

  findGrowthCycles() {
    return this.prisma.growthCycle.findMany({
      where: { deletedAt: null },
      include: {
        crop: true,
        stages: { where: { deletedAt: null }, orderBy: { sequence: 'asc' } },
      },
    });
  }
  async createGrowthCycle(input: any) {
    const crop = await this.prisma.crop.findFirst({
      where: { id: input.cropId, deletedAt: null },
    });
    if (!crop) throw new NotFoundException('Không tìm thấy cây trồng');
    const stages = input.stages || [];
    if (!stages.length)
      throw new BadRequestException('Chu kỳ phải có ít nhất một giai đoạn');
    return this.prisma.growthCycle.create({
      data: {
        cropId: input.cropId,
        name: this.text(input.name, 'name'),
        description: input.description,
        stages: {
          create: stages.map((stage: any, index: number) => ({
            name: this.text(stage.name, 'stage.name'),
            sequence: stage.sequence ?? index + 1,
            durationDays: this.positiveInteger(
              stage.durationDays,
              'durationDays',
            ),
            description: stage.description,
          })),
        },
      },
      include: { stages: true },
    });
  }

  findSeasons() {
    return this.prisma.cropCycle.findMany({
      where: { deletedAt: null },
      include: {
        plot: true,
        crop: true,
        growthCycle: { include: { stages: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }
  async createSeason(input: any) {
    const dates = this.dates(input.startDate, input.expectedEndDate);
    const plot = await this.prisma.plot.findFirst({
      where: { id: input.plotId, deletedAt: null },
    });
    const crop = await this.prisma.crop.findFirst({
      where: { id: input.cropId, deletedAt: null },
    });
    if (!plot) throw new NotFoundException('Không tìm thấy lô trồng');
    if (!crop) throw new NotFoundException('Không tìm thấy cây trồng');
    if (
      input.growthCycleId &&
      !(await this.prisma.growthCycle.findFirst({
        where: {
          id: input.growthCycleId,
          cropId: input.cropId,
          deletedAt: null,
        },
      }))
    )
      throw new BadRequestException('Chu kỳ không thuộc cây trồng đã chọn');
    const overlap = await this.prisma.cropCycle.findFirst({
      where: {
        plotId: input.plotId,
        deletedAt: null,
        startDate: { lte: dates.end },
        expectedEndDate: { gte: dates.start },
        status: { not: 'CANCELLED' },
      },
    });
    if (overlap)
      throw new ConflictException('Mùa vụ bị trùng thời gian trên lô này');
    return this.prisma.cropCycle.create({
      data: {
        plotId: input.plotId,
        cropId: input.cropId,
        growthCycleId: input.growthCycleId || null,
        name: this.text(input.name, 'name'),
        startDate: dates.start,
        expectedEndDate: dates.end,
        status: input.status || 'PLANNED',
      },
    });
  }
  async updateSeason(id: string, input: any) {
    const dates =
      input.startDate || input.expectedEndDate
        ? this.dates(input.startDate, input.expectedEndDate)
        : undefined;
    return this.prisma.cropCycle.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.status && { status: input.status }),
        ...(dates && { startDate: dates.start, expectedEndDate: dates.end }),
      },
    });
  }
  deleteSeason(id: string) {
    return this.softDelete(this.prisma.cropCycle, id);
  }

  /** Chi tiết 1 vụ mùa */
  async findOneSeason(id: string) {
    const season = await this.prisma.cropCycle.findFirst({
      where: { id, deletedAt: null },
      include: {
        plot: { include: { farm: true } },
        crop: true,
        growthCycle: { include: { stages: { orderBy: { sequence: 'asc' } } } },
        activityLogs: {
          where: { deletedAt: null },
          include: { materials: { include: { material: true } } },
          orderBy: { activityDate: 'desc' },
        },
      },
    });
    if (!season) throw new NotFoundException('Không tìm thấy mùa vụ');
    return season;
  }

  /** Cập nhật trạng thái vụ mùa */
  async updateCropCycleStatus(id: string, status: string) {
    const validStatuses = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status))
      throw new BadRequestException(`Trạng thái phải là: ${validStatuses.join(', ')}`);
    const season = await this.prisma.cropCycle.findFirst({ where: { id, deletedAt: null } });
    if (!season) throw new NotFoundException('Không tìm thấy mùa vụ');
    return this.prisma.cropCycle.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' ? { actualEndDate: new Date() } : {}),
      },
    });
  }

  // ==================== QUẢN LÝ VẬT TƯ (MATERIALS) ====================
  findMaterials() {
    return this.prisma.material.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMaterial(input: any) {
    this.requirePositive(input.defaultPrice, 'defaultPrice');
    return (this.prisma.material as any).create({
      data: {
        name: this.text(input.name, 'name'),
        type: input.type || 'PHAN_BON',
        unit: this.text(input.unit, 'unit'),
        defaultPrice: Number(input.defaultPrice),
      },
    });
  }

  async updateMaterial(id: string, input: any) {
    if (input.defaultPrice !== undefined) {
      this.requirePositive(input.defaultPrice, 'defaultPrice');
    }
    return (this.prisma.material as any).update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.type && { type: input.type }),
        ...(input.unit && { unit: input.unit.trim() }),
        ...(input.defaultPrice !== undefined && {
          defaultPrice: Number(input.defaultPrice),
        }),
      },
    });
  }

  deleteMaterial(id: string) {
    return this.softDelete(this.prisma.material, id);
  }

  // ==================== NHẬT KÝ CANH TÁC & CHI PHÍ ====================
  async findActivityLogs(cropCycleId?: string) {
    return this.prisma.activityLog.findMany({
      where: {
        deletedAt: null,
        ...(cropCycleId && { cropCycleId }),
      },
      include: {
        cropCycle: {
          include: {
            crop: true,
            plot: { include: { farm: true } },
          },
        },
        materials: {
          include: { material: true },
        },
      },
      orderBy: { activityDate: 'desc' },
    });
  }

  async createActivityLog(input: any) {
    const cropCycle = await this.prisma.cropCycle.findFirst({
      where: { id: input.cropCycleId, deletedAt: null },
    });
    if (!cropCycle) throw new NotFoundException('Không tìm thấy mùa vụ canh tác');

    const activityDate = input.activityDate ? new Date(input.activityDate) : new Date();
    const isHiredLabor = Boolean(input.isHiredLabor);
    const laborWorkers = isHiredLabor ? Number(input.laborWorkers || 0) : 0;
    const laborWagePerDay = isHiredLabor ? Number(input.laborWagePerDay || 0) : 0;
    const laborCost = laborWorkers * laborWagePerDay;

    const otherCosts = Number(input.otherCosts || 0);

    // Tính chi phí vật tư
    let totalMaterialCost = 0;
    const materialsData: any[] = [];
    if (Array.isArray(input.materials) && input.materials.length > 0) {
      for (const item of input.materials) {
        if (!item.materialId || !isUUID(item.materialId)) continue;
        const material = await this.prisma.material.findFirst({
          where: { id: item.materialId, deletedAt: null },
        });
        if (material) {
          const qty = Math.max(0, Number(item.quantityUsed || 0));
          const itemCost = item.cost !== undefined ? Number(item.cost) : qty * material.defaultPrice;
          totalMaterialCost += itemCost;
          materialsData.push({
            materialId: material.id,
            quantityUsed: qty,
            cost: itemCost,
          });
        }
      }
    }

    const totalCost = laborCost + otherCosts + totalMaterialCost;

    // Doanh thu khi thu hoạch
    let harvestQty: number | null = null;
    let unitPrice: number | null = null;
    let revenue: number | null = null;

    if (input.activityType === 'THU_HOACH') {
      harvestQty = input.harvestQuantity ? Number(input.harvestQuantity) : null;
      unitPrice = input.unitPrice ? Number(input.unitPrice) : null;
      revenue = input.revenue ? Number(input.revenue) : (harvestQty && unitPrice ? harvestQty * unitPrice : null);
    }

    const result = await (this.prisma.activityLog as any).create({
      data: {
        cropCycleId: input.cropCycleId,
        activityType: this.text(input.activityType, 'activityType'),
        activityDate,
        notes: input.notes?.trim() || null,
        syncStatus: input.syncStatus || 'SYNCED',
        isHiredLabor,
        laborWorkers: isHiredLabor ? laborWorkers : null,
        laborWagePerDay: isHiredLabor ? laborWagePerDay : null,
        laborCost,
        otherCosts,
        cost: totalCost,
        harvestQuantity: harvestQty,
        unitPrice,
        revenue,
        materials: {
          create: materialsData,
        },
      },
      include: {
        materials: { include: { material: true } },
        cropCycle: { include: { crop: true, plot: true } },
      },
    });

    // Tự động cập nhật totalYield khi thu hoạch
    if (input.activityType === 'THU_HOACH' && harvestQty) {
      const allHarvests = await (this.prisma.activityLog as any).aggregate({
        where: { cropCycleId: input.cropCycleId, activityType: 'THU_HOACH', deletedAt: null },
        _sum: { harvestQuantity: true },
      });
      await (this.prisma.cropCycle as any).update({
        where: { id: input.cropCycleId },
        data: { totalYield: allHarvests._sum?.harvestQuantity || 0 },
      });
    }

    return result;
  }

  deleteActivityLog(id: string) {
    return this.softDelete(this.prisma.activityLog, id);
  }

  /** Cập nhật nhật ký canh tác */
  async updateActivityLog(id: string, input: any) {
    const log: any = await (this.prisma.activityLog as any).findFirst({ where: { id, deletedAt: null } });
    if (!log) throw new NotFoundException('Không tìm thấy nhật ký canh tác');

    const isHiredLabor = input.isHiredLabor !== undefined ? Boolean(input.isHiredLabor) : log.isHiredLabor;
    const laborWorkers = isHiredLabor ? Number(input.laborWorkers ?? log.laborWorkers ?? 0) : 0;
    const laborWagePerDay = isHiredLabor ? Number(input.laborWagePerDay ?? log.laborWagePerDay ?? 0) : 0;
    const laborCost = laborWorkers * laborWagePerDay;
    const otherCosts = Number(input.otherCosts ?? log.otherCosts ?? 0);

    // Cập nhật vật tư nếu có
    let totalMaterialCost = 0;
    if (Array.isArray(input.materials)) {
      await this.prisma.activityMaterial.deleteMany({ where: { activityLogId: id } });
      for (const item of input.materials) {
        const material = await this.prisma.material.findFirst({ where: { id: item.materialId, deletedAt: null } });
        if (material) {
          const qty = Number(item.quantityUsed || 0);
          const itemCost = item.cost !== undefined ? Number(item.cost) : qty * material.defaultPrice;
          totalMaterialCost += itemCost;
          await this.prisma.activityMaterial.create({
            data: { activityLogId: id, materialId: material.id, quantityUsed: qty, cost: itemCost },
          });
        }
      }
    } else {
      const existingMats = await this.prisma.activityMaterial.findMany({ where: { activityLogId: id } });
      totalMaterialCost = existingMats.reduce((sum, m) => sum + (m.cost || 0), 0);
    }

    const totalCost = laborCost + otherCosts + totalMaterialCost;

    const updateData: any = {
      ...(input.activityType && { activityType: input.activityType }),
      ...(input.activityDate && { activityDate: new Date(input.activityDate) }),
      ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
      isHiredLabor,
      laborWorkers: isHiredLabor ? laborWorkers : null,
      laborWagePerDay: isHiredLabor ? laborWagePerDay : null,
      laborCost,
      otherCosts,
      cost: totalCost,
    };

    if (input.activityType === 'THU_HOACH' || log.activityType === 'THU_HOACH') {
      updateData.harvestQuantity = input.harvestQuantity !== undefined ? Number(input.harvestQuantity) : log.harvestQuantity;
      updateData.unitPrice = input.unitPrice !== undefined ? Number(input.unitPrice) : log.unitPrice;
      updateData.revenue = input.revenue !== undefined ? Number(input.revenue)
        : (updateData.harvestQuantity && updateData.unitPrice ? updateData.harvestQuantity * updateData.unitPrice : log.revenue);
    }

    return (this.prisma.activityLog as any).update({
      where: { id },
      data: updateData,
      include: { materials: { include: { material: true } }, cropCycle: { include: { crop: true, plot: true } } },
    });
  }

  // ==================== BÁO CÁO KINH TẾ (FINANCIAL REPORT) ====================
  async getFinancialReport(query: { cropCycleId?: string; farmId?: string; plotId?: string; startDate?: string; endDate?: string }) {
    const { cropCycleId, farmId, plotId, startDate, endDate } = query || {};

    // Xây dựng filter
    const where: any = { deletedAt: null };
    if (cropCycleId) where.cropCycleId = cropCycleId;
    if (farmId || plotId) {
      where.cropCycle = { deletedAt: null };
      if (plotId) where.cropCycle.plotId = plotId;
      if (farmId) where.cropCycle = { ...where.cropCycle, plot: { farmId } };
    }
    if (startDate || endDate) {
      where.activityDate = {};
      if (startDate) where.activityDate.gte = new Date(startDate);
      if (endDate) where.activityDate.lte = new Date(endDate);
    }

    const logs: any[] = await (this.prisma.activityLog as any).findMany({
      where,
      include: {
        materials: { include: { material: true } },
        cropCycle: { include: { crop: true, plot: { include: { farm: true } } } },
      },
      orderBy: { activityDate: 'asc' },
    });

    let totalLaborCost = 0;
    let totalMaterialCost = 0;
    let totalOtherCosts = 0;
    let totalRevenue = 0;
    let totalHarvestQty = 0;

    const breakdownByActivity: Record<string, number> = {};
    const breakdownByMaterialType: Record<string, number> = {};
    const costByMonth: Record<string, { labor: number; material: number; other: number; revenue: number }> = {};
    const materialConsumption: Record<string, { name: string; unit: string; totalQty: number; totalCost: number }> = {};

    logs.forEach((log: any) => {
      totalLaborCost += log.laborCost || 0;
      totalOtherCosts += log.otherCosts || 0;
      totalRevenue += log.revenue || 0;
      totalHarvestQty += log.harvestQuantity || 0;

      // Chi phí theo tháng
      const monthKey = new Date(log.activityDate).toISOString().slice(0, 7); // YYYY-MM
      if (!costByMonth[monthKey]) costByMonth[monthKey] = { labor: 0, material: 0, other: 0, revenue: 0 };
      costByMonth[monthKey].labor += log.laborCost || 0;
      costByMonth[monthKey].other += log.otherCosts || 0;
      costByMonth[monthKey].revenue += log.revenue || 0;

      let logMatCost = 0;
      log.materials?.forEach((m: any) => {
        logMatCost += m.cost || 0;
        // Phân loại theo loại vật tư
        const matType = m.material?.type || 'KHAC';
        breakdownByMaterialType[matType] = (breakdownByMaterialType[matType] || 0) + (m.cost || 0);
        // Lượng vật tư tiêu thụ
        const matId = m.materialId;
        if (!materialConsumption[matId]) {
          materialConsumption[matId] = { name: m.material?.name || '', unit: m.material?.unit || '', totalQty: 0, totalCost: 0 };
        }
        materialConsumption[matId].totalQty += m.quantityUsed || 0;
        materialConsumption[matId].totalCost += m.cost || 0;
      });
      totalMaterialCost += logMatCost;
      costByMonth[monthKey].material += logMatCost;

      const actTotal = log.cost || 0;
      breakdownByActivity[log.activityType] = (breakdownByActivity[log.activityType] || 0) + actTotal;
    });

    const totalExpense = totalLaborCost + totalMaterialCost + totalOtherCosts;
    const netProfit = totalRevenue - totalExpense;
    const roiPercentage = totalExpense > 0 ? (netProfit / totalExpense) * 100 : 0;

    // Chuyển costByMonth thành mảng sắp xếp theo thời gian
    const costTrends = Object.entries(costByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data, total: data.labor + data.material + data.other }));

    return {
      totalExpense,
      totalLaborCost,
      totalMaterialCost,
      totalOtherCosts,
      totalRevenue,
      totalHarvestQty,
      netProfit,
      roiPercentage: Number(roiPercentage.toFixed(2)),
      breakdownByActivity,
      breakdownByMaterialType,
      costTrends,
      materialConsumption: Object.values(materialConsumption),
      logsCount: logs.length,
    };
  }

  // ==================== SEED DỮ LIỆU CÂY TRỒNG & VẬT TƯ MẪU ====================
  async seedLamDongData() {
    // 1. Danh mục giống cây trồng phổ biến toàn quốc (cây lâu năm, cây công nghiệp, cây ăn trái)
    const crops = [
      { name: 'Cà phê Robusta cao sản', type: 'Cây công nghiệp lâu năm' },
      { name: 'Cà phê Arabica chọn lọc', type: 'Cây công nghiệp lâu năm' },
      { name: 'Sầu riêng Ri6 cơm vàng', type: 'Cây ăn trái lâu năm' },
      { name: 'Sầu riêng Monthong Dona', type: 'Cây ăn trái lâu năm' },
      { name: 'Mắc-ca ghép thương phẩm', type: 'Cây hạt dinh dưỡng lâu năm' },
      { name: 'Bơ 034 sáp dẻo', type: 'Cây ăn trái lâu năm' },
      { name: 'Hồ tiêu Vĩnh Linh', type: 'Cây công nghiệp lâu năm' },
      { name: 'Bưởi da xanh ruột hồng', type: 'Cây ăn trái lâu năm' },
    ];

    const createdCrops: any[] = [];
    for (const c of crops) {
      let crop = await this.prisma.crop.findFirst({
        where: { name: c.name, deletedAt: null },
      });
      if (!crop) {
        crop = await this.prisma.crop.create({ data: c });
      }
      createdCrops.push(crop);
    }

    // 2. Tạo danh mục vật tư thông dụng toàn quốc
    const materials = [
      { name: 'Phân NPK 20-20-15 Đầu Trâu', type: 'PHAN_BON', unit: 'Bao 50kg', defaultPrice: 850000 },
      { name: 'Phân hữu cơ nở nhập khẩu', type: 'PHAN_BON', unit: 'Bao 25kg', defaultPrice: 420000 },
      { name: 'Phân chuồng ủ hoai mục vi sinh', type: 'PHAN_BON', unit: 'Tấn', defaultPrice: 1500000 },
      { name: 'Vôi bột nông nghiệp khử phèn', type: 'PHAN_BON', unit: 'Bao 40kg', defaultPrice: 80000 },
      { name: 'Thuốc trừ sâu sinh học Emamectin', type: 'THUOC_BVTV', unit: 'Chai 500ml', defaultPrice: 180000 },
      { name: 'Thuốc trừ nấm xì mủ Ridomil Gold', type: 'THUOC_BVTV', unit: 'Gói 1kg', defaultPrice: 320000 },
      { name: 'Chế phẩm nấm Trichoderma đối kháng', type: 'THUOC_BVTV', unit: 'Gói 1kg', defaultPrice: 95000 },
    ];

    const createdMaterials: any[] = [];
    for (const m of materials) {
      let mat = await this.prisma.material.findFirst({
        where: { name: m.name, deletedAt: null },
      });
      if (!mat) {
        mat = await (this.prisma.material as any).create({ data: m });
      }
      createdMaterials.push(mat);
    }

    return {
      message: 'Khởi tạo thành công danh mục cây trồng & vật tư mẫu!',
      crops: createdCrops,
      materials: createdMaterials,
    };
  }

  private text(value: any, field: string) {
    if (typeof value !== 'string' || !value.trim())
      throw new BadRequestException(`${field} là bắt buộc`);
    return value.trim();
  }
  private requirePositive(value: any, field: string) {
    if (!Number.isFinite(Number(value)) || Number(value) <= 0)
      throw new BadRequestException(`${field} phải lớn hơn 0`);
  }
  private positiveInteger(value: any, field: string) {
    this.requirePositive(value, field);
    return Math.floor(Number(value));
  }
  private dates(start: any, end: any) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      startDate > endDate
    )
      throw new BadRequestException('Khoảng thời gian mùa vụ không hợp lệ');
    return { start: startDate, end: endDate };
  }
  private pick(input: any, fields: string[]) {
    return Object.fromEntries(
      fields
        .filter((field) => input[field] !== undefined)
        .map((field) => [
          field,
          field === 'area' || field === 'totalArea'
            ? Number(input[field])
            : typeof input[field] === 'string'
              ? input[field].trim()
              : input[field],
        ]),
    );
  }
  private async requireUser(id: string) {
    if (!id || !(await this.prisma.user.findUnique({ where: { id } })))
      throw new NotFoundException('Không tìm thấy người dùng');
  }
  private async hasChildren(model: any, where: any) {
    const delegate = typeof model === 'string' ? (this.prisma as any)[model] : model;
    return (await delegate.count({ where: { ...where, deletedAt: null } })) > 0;
  }
  private async softDelete(model: any, id: string) {
    const delegate = typeof model === 'string' ? (this.prisma as any)[model] : model;
    return delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
  // ==================== INVENTORY ====================
  async findInventory(farmId?: string) {
    const where: any = { deletedAt: null };
    if (farmId) where.farmId = farmId;
    return this.prisma.inventory.findMany({
      where,
      include: {
        material: true,
        farm: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createInventory(data: { farmId: string; materialId: string; quantity: number; totalCost: number }) {
    this.requirePositive(data.quantity, 'quantity');
    return this.prisma.inventory.create({
      data: {
        farmId: data.farmId,
        materialId: data.materialId,
        quantity: Number(data.quantity),
        totalCost: Number(data.totalCost || 0),
      },
      include: {
        material: true,
        farm: true,
      },
    });
  }

  async updateInventory(id: string, data: { quantity?: number; totalCost?: number }) {
    const updateData: any = {};
    if (data.quantity !== undefined) updateData.quantity = Number(data.quantity);
    if (data.totalCost !== undefined) updateData.totalCost = Number(data.totalCost);
    return this.prisma.inventory.update({
      where: { id },
      data: updateData,
      include: {
        material: true,
        farm: true,
      },
    });
  }

  async deleteInventory(id: string) {
    return this.softDelete(this.prisma.inventory, id);
  }
}
