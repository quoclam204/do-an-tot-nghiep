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

  findPlots(userId?: string, role?: string, farmId?: string) {
    const where: any = { deletedAt: null };
    if (farmId) {
      where.farmId = farmId;
    }
    if (role && role !== 'ADMIN' && userId) {
      where.farm = {
        deletedAt: null,
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      };
    }
    return this.prisma.plot.findMany({
      where,
      include: { farm: true },
      orderBy: { createdAt: 'desc' },
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
    const activeSeason = await (this.prisma as any).cropCycle.findFirst({
      where: { plotId: id, status: 'ACTIVE', deletedAt: null },
    });
    if (activeSeason) {
      throw new ConflictException(
        `Lô đất đang có mùa vụ đang diễn ra ("${activeSeason.name}"). Vui lòng kết thúc mùa vụ trước khi xóa lô.`
      );
    }
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
    // Chỉ chặn xóa nếu có mùa vụ trên lô đất và vườn đang còn hoạt động
    const activeCycles = await this.prisma.cropCycle.findMany({
      where: {
        cropId: id,
        deletedAt: null,
        plot: {
          deletedAt: null,
          farm: { deletedAt: null },
        },
      },
      include: {
        plot: { include: { farm: true } },
      },
    });

    if (activeCycles.length > 0) {
      const farmNames = [...new Set(activeCycles.map((c: any) => c.plot?.farm?.name).filter(Boolean))].join(', ');
      throw new ConflictException(
        `Không thể xóa cây trồng vì đang có ${activeCycles.length} mùa vụ ${farmNames ? `(tại: ${farmNames})` : ''}`,
      );
    }

    // Dọn dẹp các mùa vụ mồ côi (nếu lô đất hoặc vườn đã bị xóa trước đó)
    await this.prisma.cropCycle.updateMany({
      where: { cropId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    // Đồng thời dọn dẹp các chu kỳ sinh trưởng của cây này
    await this.prisma.growthCycle.updateMany({
      where: { cropId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    });

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

    // Tính tổng số ngày chu kỳ
    const totalDurationDays = stages.reduce((sum: number, s: any) => sum + (Number(s.durationDays) || 0), 0);

    return this.prisma.growthCycle.create({
      data: {
        cropId: input.cropId,
        name: this.text(input.name, 'name'),
        description: input.description,
        totalDurationDays,
        yearsToFlower: input.yearsToFlower ? Number(input.yearsToFlower) : null,
        yearsToHarvest: input.yearsToHarvest ? Number(input.yearsToHarvest) : null,
        stages: {
          create: stages.map((stage: any, index: number) => ({
            name: this.text(stage.name, 'stage.name'),
            sequence: stage.sequence ?? index + 1,
            durationDays: this.positiveInteger(
              stage.durationDays,
              'durationDays',
            ),
            description: stage.description,
            suggestedActivities: stage.suggestedActivities || null,
          })),
        },
      },
      include: { stages: true },
    });
  }

  findSeasons(userId?: string, role?: string, farmId?: string) {
    const where: any = { deletedAt: null };
    if (farmId) {
      where.plot = { farmId, deletedAt: null };
    }
    if (role && role !== 'ADMIN' && userId) {
      where.plot = {
        ...(where.plot || {}),
        deletedAt: null,
        farm: {
          deletedAt: null,
          OR: [
            { userId },
            { members: { some: { userId } } },
          ],
        },
      };
    }
    return this.prisma.cropCycle.findMany({
      where,
      include: {
        plot: { include: { farm: true } },
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
    const isIntercropped = Boolean(input.isIntercropped);
    if (!isIntercropped) {
      const overlap = await (this.prisma.cropCycle as any).findFirst({
        where: {
          plotId: input.plotId,
          deletedAt: null,
          startDate: { lte: dates.end },
          expectedEndDate: { gte: dates.start },
          status: { not: 'CANCELLED' },
          isIntercropped: false,
        },
      });
      if (overlap)
        throw new ConflictException(
          'Mùa vụ bị trùng thời gian trên lô này (Nếu bạn trồng xen canh như Cà phê xen Sầu riêng, hãy tích chọn "Trồng xen canh")',
        );
    }
    return (this.prisma.cropCycle as any).create({
      data: {
        plotId: input.plotId,
        cropId: input.cropId,
        growthCycleId: input.growthCycleId || null,
        name: this.text(input.name, 'name'),
        startDate: dates.start,
        expectedEndDate: dates.end,
        status: input.status || 'PLANNED',
        isIntercropped,
      },
    });
  }
  async updateSeason(id: string, input: any) {
    const dates =
      input.startDate || input.expectedEndDate
        ? this.dates(input.startDate, input.expectedEndDate)
        : undefined;
    return (this.prisma.cropCycle as any).update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.status && { status: input.status }),
        ...(input.isIntercropped !== undefined && { isIntercropped: Boolean(input.isIntercropped) }),
        ...(dates && { startDate: dates.start, expectedEndDate: dates.end }),
      },
    });
  }
  deleteSeason(id: string) {
    return this.softDelete(this.prisma.cropCycle, id);
  }

  /** Thống kê kinh tế chi tiết cho 1 mùa vụ (Đầu tư, Nhân công, Doanh thu, Lợi nhuận) */
  async getSeasonFinancialSummary(id: string) {
    const season: any = await (this.prisma.cropCycle as any).findFirst({
      where: { id, deletedAt: null },
      include: {
        plot: { include: { farm: true } },
        crop: true,
        growthCycle: true,
        activityLogs: {
          where: { deletedAt: null },
          include: { materials: { include: { material: true } } },
          orderBy: { activityDate: 'asc' },
        },
      },
    });
    if (!season) throw new NotFoundException('Không tìm thấy mùa vụ');

    let totalMaterialCost = 0;
    let totalLaborCost = 0;
    let totalWorkers = 0;
    let totalOtherCosts = 0;
    let totalRevenue = 0;
    let totalHarvestQty = 0;

    const laborLogs: any[] = [];
    const harvestLogs: any[] = [];
    const materialsUsedMap: Record<string, { name: string; type: string; unit: string; quantity: number; cost: number }> = {};
    const costByActivityType: Record<string, number> = {};

    season.activityLogs?.forEach((log: any) => {
      // 1. Thống kê nhân công
      if (log.isHiredLabor && (log.laborWorkers || 0) > 0) {
        totalWorkers += log.laborWorkers || 0;
        totalLaborCost += log.laborCost || 0;
        laborLogs.push({
          id: log.id,
          date: log.activityDate,
          activityType: log.activityType,
          workers: log.laborWorkers,
          wagePerDay: log.laborWagePerDay,
          totalCost: log.laborCost,
          notes: log.notes,
        });
      }

      // 2. Thống kê chi phí khác
      totalOtherCosts += log.otherCosts || 0;

      // 3. Thống kê vật tư
      let logMatCost = 0;
      log.materials?.forEach((m: any) => {
        const matCost = m.cost || 0;
        logMatCost += matCost;
        const matId = m.materialId;
        if (!materialsUsedMap[matId]) {
          materialsUsedMap[matId] = {
            name: m.materialName || m.material?.name || 'Vật tư',
            type: m.material?.type || 'KHAC',
            unit: m.unit || m.material?.unit || 'đơn vị',
            quantity: 0,
            cost: 0,
          };
        }
        materialsUsedMap[matId].quantity += m.quantityUsed || 0;
        materialsUsedMap[matId].cost += matCost;
      });
      totalMaterialCost += logMatCost;

      const actTotal = (log.laborCost || 0) + (log.otherCosts || 0) + logMatCost;
      costByActivityType[log.activityType] = (costByActivityType[log.activityType] || 0) + actTotal;

      // 4. Thống kê thu hoạch
      if (log.activityType === 'THU_HOACH' && (log.harvestQuantity || log.revenue)) {
        totalHarvestQty += log.harvestQuantity || 0;
        totalRevenue += log.revenue || 0;
        harvestLogs.push({
          id: log.id,
          date: log.activityDate,
          quantity: log.harvestQuantity || 0,
          unitPrice: log.unitPrice || 0,
          revenue: log.revenue || 0,
          notes: log.notes,
        });
      }
    });

    const totalInvestment = totalMaterialCost + totalLaborCost + totalOtherCosts;
    const netProfit = totalRevenue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    return {
      season: {
        id: season.id,
        name: season.name,
        cropName: season.crop?.name,
        plotName: season.plot?.name,
        farmName: season.plot?.farm?.name,
        isIntercropped: Boolean(season.isIntercropped),
        startDate: season.startDate,
        expectedEndDate: season.expectedEndDate,
        actualEndDate: season.actualEndDate,
        status: season.status,
      },
      summary: {
        totalInvestment,
        totalMaterialCost,
        totalLaborCost,
        totalOtherCosts,
        hasHiredLabor: totalWorkers > 0,
        totalWorkers,
        totalHarvestQty,
        totalRevenue,
        netProfit,
        roiPercentage: Number(roiPercentage.toFixed(2)),
        isProfitable: netProfit > 0,
      },
      materialsUsed: Object.values(materialsUsedMap),
      laborLogs,
      harvestLogs,
      costByActivityType,
    };
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
    const material = await (this.prisma.material as any).create({
      data: {
        name: this.text(input.name, 'name'),
        type: input.type || 'PHAN_BON',
        unit: this.text(input.unit, 'unit'),
        defaultPrice: Number(input.defaultPrice),
      },
    });

    // Lưu lịch sử tạo vật tư
    await (this.prisma as any).materialHistory.create({
      data: {
        materialId: material.id,
        name: material.name,
        type: material.type,
        unit: material.unit,
        defaultPrice: material.defaultPrice,
        action: 'CREATE',
        changedBy: input.changedBy || null,
      },
    });

    return material;
  }

  async updateMaterial(id: string, input: any) {
    if (input.defaultPrice !== undefined) {
      this.requirePositive(input.defaultPrice, 'defaultPrice');
    }

    // Lưu snapshot trước khi sửa (lịch sử vật tư)
    const current = await (this.prisma.material as any).findFirst({ where: { id, deletedAt: null } });
    if (current) {
      await (this.prisma as any).materialHistory.create({
        data: {
          materialId: id,
          name: current.name,
          type: current.type,
          unit: current.unit,
          defaultPrice: current.defaultPrice,
          action: 'UPDATE',
          changedBy: input.changedBy || null,
        },
      });
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

  async deleteMaterial(id: string) {
    // Lưu snapshot trước khi xóa (giữ lại lịch sử)
    const current = await (this.prisma.material as any).findFirst({ where: { id, deletedAt: null } });
    if (current) {
      await (this.prisma as any).materialHistory.create({
        data: {
          materialId: id,
          name: current.name,
          type: current.type,
          unit: current.unit,
          defaultPrice: current.defaultPrice,
          action: 'DELETE',
        },
      });
    }
    return this.softDelete(this.prisma.material, id);
  }

  /** Lấy lịch sử thay đổi của 1 vật tư */
  async findMaterialHistory(materialId: string) {
    return (this.prisma as any).materialHistory.findMany({
      where: { materialId },
      orderBy: { changedAt: 'desc' },
    });
  }

  /** Tổng hợp lượng vật tư tiêu thụ theo vụ mùa (từ bắt đầu → thu hoạch) */
  async getSeasonMaterialConsumption(seasonId: string) {
    const season: any = await (this.prisma.cropCycle as any).findFirst({
      where: { id: seasonId, deletedAt: null },
      include: {
        plot: { include: { farm: true } },
        crop: true,
        activityLogs: {
          where: { deletedAt: null },
          include: { materials: { include: { material: true } } },
          orderBy: { activityDate: 'asc' },
        },
      },
    });
    if (!season) throw new NotFoundException('Không tìm thấy mùa vụ');

    const consumptionMap: Record<string, {
      materialId: string;
      name: string;
      type: string;
      unit: string;
      totalQuantity: number;
      totalCost: number;
      usageHistory: Array<{ date: Date; activityType: string; quantity: number; cost: number }>;
    }> = {};

    let grandTotalCost = 0;
    let totalLaborCost = 0;
    let totalOtherCosts = 0;

    for (const log of season.activityLogs || []) {
      totalLaborCost += log.laborCost || 0;
      totalOtherCosts += log.otherCosts || 0;

      for (const mat of log.materials || []) {
        const key = mat.materialId;
        if (!consumptionMap[key]) {
          consumptionMap[key] = {
            materialId: mat.materialId,
            name: mat.materialName || mat.material?.name || 'Vật tư',
            type: mat.material?.type || 'KHAC',
            unit: mat.unit || mat.material?.unit || '',
            totalQuantity: 0,
            totalCost: 0,
            usageHistory: [],
          };
        }
        consumptionMap[key].totalQuantity += mat.quantityUsed || 0;
        consumptionMap[key].totalCost += mat.cost || 0;
        grandTotalCost += mat.cost || 0;
        consumptionMap[key].usageHistory.push({
          date: log.activityDate,
          activityType: log.activityType,
          quantity: mat.quantityUsed || 0,
          cost: mat.cost || 0,
        });
      }
    }

    return {
      season: {
        id: season.id,
        name: season.name,
        cropName: season.crop?.name,
        plotName: season.plot?.name,
        farmName: season.plot?.farm?.name,
        startDate: season.startDate,
        expectedEndDate: season.expectedEndDate,
        status: season.status,
      },
      totalMaterialCost: grandTotalCost,
      totalLaborCost,
      totalOtherCosts,
      grandTotalInvestment: grandTotalCost + totalLaborCost + totalOtherCosts,
      materials: Object.values(consumptionMap),
    };
  }

  // ==================== NHẬT KÝ CANH TÁC & CHI PHÍ ====================
  async findActivityLogs(userId?: string, role?: string, cropCycleId?: string, farmId?: string) {
    const where: any = {
      deletedAt: null,
      ...(cropCycleId && { cropCycleId }),
    };

    if (farmId) {
      where.cropCycle = {
        plot: { farmId, deletedAt: null },
      };
    }

    if (role && role !== 'ADMIN' && userId) {
      where.cropCycle = {
        ...(where.cropCycle || {}),
        plot: {
          ...(where.cropCycle?.plot || {}),
          farm: {
            deletedAt: null,
            OR: [
              { userId },
              { members: { some: { userId } } },
            ],
          },
        },
      };
    }

    return this.prisma.activityLog.findMany({
      where,
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

    // Validate ca làm việc
    const validShifts = ['SANG', 'CHIEU', 'TOI'];
    const workShift = input.workShift && validShifts.includes(input.workShift) ? input.workShift : null;
    const activityTime = input.activityTime?.trim() || null;

    // Tính chi phí vật tư & lưu snapshot
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
          const unitPrice = material.defaultPrice;
          const itemCost = item.cost !== undefined ? Number(item.cost) : qty * unitPrice;
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
        activityTime,
        workShift,
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

    // Ca làm việc & giờ
    const validShifts = ['SANG', 'CHIEU', 'TOI'];
    const workShift = input.workShift !== undefined
      ? (validShifts.includes(input.workShift) ? input.workShift : null)
      : log.workShift;
    const activityTime = input.activityTime !== undefined ? (input.activityTime?.trim() || null) : log.activityTime;

    // Cập nhật vật tư nếu có
    let totalMaterialCost = 0;
    if (Array.isArray(input.materials)) {
      await this.prisma.activityMaterial.deleteMany({ where: { activityLogId: id } });
      for (const item of input.materials) {
        const material = await this.prisma.material.findFirst({ where: { id: item.materialId, deletedAt: null } });
        if (material) {
          const qty = Number(item.quantityUsed || 0);
          const unitPrice = material.defaultPrice;
          const itemCost = item.cost !== undefined ? Number(item.cost) : qty * unitPrice;
          totalMaterialCost += itemCost;
          await (this.prisma as any).activityMaterial.create({
            data: {
              activityLogId: id,
              materialId: material.id,
              quantityUsed: qty,
              cost: itemCost,
            },
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
      activityTime,
      workShift,
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
      where.cropCycle = { deletedAt: null, ...(where.cropCycle || {}) };
      if (plotId) where.cropCycle.plotId = plotId;
      if (farmId) where.cropCycle = { ...where.cropCycle, plot: { farmId, deletedAt: null } };
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
      { name: 'Mắc-ca ghép thương phẩm', type: 'Cây lấy hạt lâu năm' },
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

    // 2. Tạo danh mục vật tư thông dụng toàn quốc (Đơn vị tính chuẩn cơ bản: kg, chai, gói)
    const materials = [
      { name: 'Phân NPK 20-20-15 Đầu Trâu (Bao 50kg)', type: 'PHAN_BON', unit: 'kg', defaultPrice: 17000 },
      { name: 'Phân hữu cơ nở nhập khẩu (Bao 25kg)', type: 'PHAN_BON', unit: 'kg', defaultPrice: 16800 },
      { name: 'Phân chuồng ủ hoai mục vi sinh', type: 'PHAN_BON', unit: 'kg', defaultPrice: 1500 },
      { name: 'Vôi bột nông nghiệp khử phèn (Bao 40kg)', type: 'PHAN_BON', unit: 'kg', defaultPrice: 2000 },
      { name: 'Thuốc trừ sâu sinh học Emamectin (Chai 500ml)', type: 'THUOC_BVTV', unit: 'chai', defaultPrice: 180000 },
      { name: 'Thuốc trừ nấm xì mủ Ridomil Gold (Gói 1kg)', type: 'THUOC_BVTV', unit: 'gói', defaultPrice: 320000 },
      { name: 'Chế phẩm nấm Trichoderma đối kháng (Gói 1kg)', type: 'THUOC_BVTV', unit: 'gói', defaultPrice: 95000 },
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

    // 3. Khởi tạo chu kỳ sinh trưởng & giai đoạn nông học chuẩn khoa học
    const agronomicCycles = [
      {
        cropName: 'Cà phê Robusta cao sản',
        cycleName: 'Chu kỳ kinh doanh Cà phê Robusta',
        yearsToFlower: 2.5,
        yearsToHarvest: 3.5,
        description: 'Chu kỳ kinh doanh hàng năm của cà phê vối cao sản Tây Nguyên & Lâm Đồng',
        stages: [
          { name: 'Phục hồi sau thu hoạch & Tỉa cành', sequence: 1, durationDays: 30, description: 'Cắt tỉa cành tăm, cành sâu bệnh, bón phân chuồng hoai mục', suggestedActivities: 'Cắt tỉa, Bón phân hữu cơ, Dọn cỏ' },
          { name: 'Tưới nước ép hoa & Nở hoa rộ', sequence: 2, durationDays: 25, description: 'Tưới đợt 1 đẫm nước để hoa bung trắng đồng loạt', suggestedActivities: 'Tưới nước, Kiểm tra sâu bệnh' },
          { name: 'Nuôi trái non & Phát triển cành dự trữ', sequence: 3, durationDays: 120, description: 'Bón NPK 16-16-8, phun phòng mọt đục cành, rệp sáp', suggestedActivities: 'Bón phân NPK, Phun thuốc BVTV, Làm cỏ' },
          { name: 'Nuôi hạt chắc & Chín tập trung', sequence: 4, durationDays: 75, description: 'Bón phân giàu Kali (NPK 15-5-20) để vào nhân chắc hạt', suggestedActivities: 'Bón phân Kali, Tưới bổ sung' },
          { name: 'Thu hoạch quả chín rộ', sequence: 5, durationDays: 45, description: 'Hái chọn lọc quả chín >85%, phơi trên bạt hoặc sấy đảo', suggestedActivities: 'Thu hoạch, Phơi sấy, Vận chuyển' },
        ],
      },
      {
        cropName: 'Sầu riêng Ri6 cơm vàng',
        cycleName: 'Chu kỳ kinh doanh Sầu riêng Ri6',
        yearsToFlower: 4.5,
        yearsToHarvest: 5.0,
        description: 'Quy trình tạo mầm hoa, nuôi trái sầu riêng Ri6 cơm vàng hạt lép xuất khẩu',
        stages: [
          { name: 'Phục hồi sau thu hoạch & Tạo cơi đọt', sequence: 1, durationDays: 60, description: 'Cắt tỉa cuống cũ, rửa vườn bằng đồng, bón phân hữu cơ vi sinh', suggestedActivities: 'Cắt tỉa, Rửa vườn, Bón phân hữu cơ' },
          { name: 'Xử lý tạo mầm hoa & Siết nước', sequence: 2, durationDays: 45, description: 'Tạo khô hạn siết nước mương vườn, phun Lân cao và Kali hữu cơ', suggestedActivities: 'Siết nước, Phun kích hoa, Quét mắt cua' },
          { name: 'Xổ nhụy & Đậu trái non', sequence: 3, durationDays: 20, description: 'Thụ phấn bổ sung ban đêm (19h-21h), giữ ẩm mặt đất nhẹ', suggestedActivities: 'Thụ phấn nhân tạo, Phun Bo-Canxi, Giữ ẩm' },
          { name: 'Nuôi trái non & Định lượng trái', sequence: 4, durationDays: 60, description: 'Bón Kali trắng Sulphate (chống sượng cơm), tỉa định trái giữ 80-100 trái/cây', suggestedActivities: 'Tỉa trái loại 2, Bón phân NPK Kali trắng, Phòng bọ xít' },
          { name: 'Trái lớn & Vào cơm đóng hộc', sequence: 5, durationDays: 40, description: 'Tích lũy tinh bột và đường, phòng trừ nấm nứt thân xì mủ Phytophthora', suggestedActivities: 'Phun phòng nấm, Bón Kali Sunfat, Buộc dây chống gió' },
          { name: 'Thu hoạch quả chín (đủ 8.5 - 9 tuổi)', sequence: 6, durationDays: 15, description: 'Cắt tỉa trái già gai nở đều, gõ âm thanh vang trong, đóng sọt xuất khẩu', suggestedActivities: 'Thu hoạch, Phân loại sản phẩm, Vận chuyển' },
        ],
      },
      {
        cropName: 'Bơ 034 sáp dẻo',
        cycleName: 'Chu kỳ kinh doanh Bơ 034',
        yearsToFlower: 2.5,
        yearsToHarvest: 3.0,
        description: 'Chu kỳ canh tác bơ sáp dài 034 Bảo Lộc - Lâm Đồng',
        stages: [
          { name: 'Phân hóa mầm hoa', sequence: 1, durationDays: 30, description: 'Tỉa cành thông thoáng, phun phân bón lá vi lượng', suggestedActivities: 'Cắt tỉa, Phun vi lượng' },
          { name: 'Nở hoa & Đậu quả non', sequence: 2, durationDays: 30, description: 'Tưới nước đều đặn, chống sốc nhiệt rụng hoa', suggestedActivities: 'Tưới nước, Bón vi lượng Bo' },
          { name: 'Phát triển chiều dài trái', sequence: 3, durationDays: 60, description: 'Trái bơ 034 dài từ 25-35cm, cần bón NPK cân đối', suggestedActivities: 'Bón phân NPK, Phòng bọ xít muỗi' },
          { name: 'Tích lũy độ béo & Tạo sáp', sequence: 4, durationDays: 50, description: 'Tích tụ dầu tự nhiên trong cơm bơ, bón phân hữu cơ khoáng', suggestedActivities: 'Bón phân hữu cơ, Tưới nước giữ ẩm' },
          { name: 'Thu hoạch trái chín già', sequence: 5, durationDays: 30, description: 'Hái khi vỏ quả chuyển màu xanh đậm bóng, chấm cám nhiều', suggestedActivities: 'Thu hoạch, Đóng hộp bọc xốp' },
        ],
      },
      {
        cropName: 'Mắc-ca ghép thương phẩm',
        cycleName: 'Chu kỳ kinh doanh Mắc-ca ghép',
        yearsToFlower: 3.5,
        yearsToHarvest: 4.5,
        description: 'Cây nữ hoàng hạt khô, thích hợp khí hậu mát mẻ cao nguyên',
        stages: [
          { name: 'Phân hóa mầm hoa đầu mùa khô', sequence: 1, durationDays: 45, description: 'Thời tiết se lạnh kích thích chùm hoa dài nở', suggestedActivities: 'Dọn cỏ vườn, Tỉa cành vượt' },
          { name: 'Nở hoa chuỗi & Đậu quả chùm', sequence: 2, durationDays: 30, description: 'Thụ phấn chéo nhờ ong mật, tưới nước bổ sung', suggestedActivities: 'Tưới nước, Nuôi ong mật hỗ trợ' },
          { name: 'Tăng trưởng kích thước vỏ hạt', sequence: 3, durationDays: 90, description: 'Vỏ xanh dày phát triển, phòng trừ chuột và sâu đục hạt', suggestedActivities: 'Bón phân NPK, Bẫy bả chuột' },
          { name: 'Hạt hóa gỗ & Tích lũy dầu béo', sequence: 4, durationDays: 60, description: 'Vỏ hạt chuyển sang màu nâu gỗ cứng cáp', suggestedActivities: 'Bón Kali, Magie' },
          { name: 'Thu hoạch hạt chín tự rụng', sequence: 5, durationDays: 45, description: 'Quả nứt tự nhiên rơi xuống đất, nhặt và bóc vỏ xanh trong 24h', suggestedActivities: 'Thu hoạch, Bóc vỏ xanh, Sấy gió nhẹ' },
        ],
      },
    ];

    for (const cyc of agronomicCycles) {
      const targetCrop = createdCrops.find((c) => c.name === cyc.cropName);
      if (!targetCrop) continue;

      let existingCycle = await (this.prisma as any).growthCycle.findFirst({
        where: { cropId: targetCrop.id, name: cyc.cycleName, deletedAt: null },
      });

      const totalDuration = cyc.stages.reduce((s, st) => s + st.durationDays, 0);

      if (!existingCycle) {
        await (this.prisma as any).growthCycle.create({
          data: {
            cropId: targetCrop.id,
            name: cyc.cycleName,
            description: cyc.description,
            yearsToFlower: cyc.yearsToFlower,
            yearsToHarvest: cyc.yearsToHarvest,
            totalDurationDays: totalDuration,
            stages: {
              create: cyc.stages.map((st) => ({
                name: st.name,
                sequence: st.sequence,
                durationDays: st.durationDays,
                description: st.description,
                suggestedActivities: st.suggestedActivities,
              })),
            },
          },
        });
      }
    }

    return {
      message: 'Khởi tạo thành công danh mục cây trồng, vật tư & chu kỳ sinh trưởng nông học!',
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
