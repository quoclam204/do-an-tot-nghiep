import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFarmDto, UpdateFarmDto } from './dto/farm.dto';
import { CreatePlotDto, UpdatePlotDto } from './dto/plot.dto';

/** Quy đổi đơn vị người dùng nhập (ha hoặc m2) về chuẩn ha trong CSDL */
function normalizeAreaToHa(value: number, unit?: string): number {
  const num = Number(value);
  if (isNaN(num)) return 0;
  if (unit === 'm2' || unit === 'm²' || unit === 'M2') {
    return Number((num / 10000).toFixed(4));
  }
  return Number(num.toFixed(4));
}

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy tất cả nông hộ của user đang đăng nhập */
  async findMyFarms(userId: string) {
    return this.prisma.farm.findMany({
      where: { userId, deletedAt: null },
      include: {
        plots: {
          where: { deletedAt: null },
          select: { id: true, name: true, area: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Lấy tất cả nông hộ (chỉ ADMIN) */
  async findAll() {
    return this.prisma.farm.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        plots: {
          where: { deletedAt: null },
          select: { id: true, name: true, area: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Tạo nông hộ mới */
  async create(userId: string, dto: CreateFarmDto) {
    const totalArea = normalizeAreaToHa(dto.totalArea, dto.unit);
    if (totalArea <= 0) {
      throw new BadRequestException('Tổng diện tích nông hộ phải lớn hơn 0');
    }
    return this.prisma.farm.create({
      data: {
        userId,
        name: dto.name,
        location: dto.location,
        totalArea,
      },
    });
  }

  /** Xem chi tiết 1 nông hộ */
  async findOne(id: string, userId: string, role: string) {
    const farm = await this.prisma.farm.findFirst({
      where: { id, deletedAt: null },
      include: {
        plots: { where: { deletedAt: null } },
        user: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!farm) throw new NotFoundException('Nông hộ không tồn tại');
    if (farm.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền xem nông hộ này');
    }
    return farm;
  }

  /** Cập nhật nông hộ */
  async update(id: string, dto: UpdateFarmDto, userId: string, role: string) {
    const farm = await this.prisma.farm.findFirst({ where: { id, deletedAt: null } });
    if (!farm) throw new NotFoundException('Nông hộ không tồn tại');
    if (farm.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa nông hộ này');
    }

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;
    if (dto.location !== undefined) dataToUpdate.location = dto.location;

    if (dto.totalArea !== undefined) {
      const newTotalArea = normalizeAreaToHa(dto.totalArea, dto.unit);
      if (newTotalArea <= 0) {
        throw new BadRequestException('Diện tích nông hộ phải lớn hơn 0');
      }
      const usedArea = await this.prisma.plot.aggregate({
        where: { farmId: id, deletedAt: null },
        _sum: { area: true },
      });
      const totalUsed = usedArea._sum.area || 0;
      if (newTotalArea < totalUsed - 0.0001) {
        throw new BadRequestException(
          `Không thể giảm diện tích nông hộ xuống ${newTotalArea} ha vì các lô đất hiện có đang chiếm ${totalUsed.toFixed(2)} ha.`
        );
      }
      dataToUpdate.totalArea = newTotalArea;
    }

    return this.prisma.farm.update({ where: { id }, data: dataToUpdate });
  }

  /** Xóa mềm nông hộ */
  async remove(id: string, userId: string, role: string) {
    const farm = await this.prisma.farm.findFirst({ where: { id, deletedAt: null } });
    if (!farm) throw new NotFoundException('Nông hộ không tồn tại');
    if (farm.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền xóa nông hộ này');
    }
    return this.prisma.farm.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true },
    });
  }

  // ==========================================
  // PLOT CRUD
  // ==========================================

  /** Kiểm tra quyền sở hữu farm */
  private async checkFarmOwnership(farmId: string, userId: string, role: string) {
    const farm = await this.prisma.farm.findFirst({
      where: { id: farmId, deletedAt: null },
    });
    if (!farm) throw new NotFoundException('Nông hộ không tồn tại');
    if (farm.userId !== userId && role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền thao tác trên nông hộ này');
    }
    return farm;
  }

  /** Tạo lô trồng mới */
  async createPlot(farmId: string, userId: string, role: string, dto: CreatePlotDto) {
    const farm = await this.checkFarmOwnership(farmId, userId, role);
    const plotArea = normalizeAreaToHa(dto.area, dto.unit);

    if (plotArea <= 0) {
      throw new BadRequestException('Diện tích lô đất phải lớn hơn 0');
    }

    // Tính tổng diện tích các lô hiện có
    const usedArea = await this.prisma.plot.aggregate({
      where: { farmId, deletedAt: null },
      _sum: { area: true },
    });
    const currentTotal = usedArea._sum.area || 0;

    if (currentTotal + plotArea > farm.totalArea + 0.0001) {
      const remaining = Math.max(0, farm.totalArea - currentTotal);
      throw new BadRequestException(
        `Tổng diện tích các lô (${(currentTotal + plotArea).toFixed(2)} ha) vượt quá diện tích nông hộ (${farm.totalArea} ha). Nông hộ chỉ còn trống ${remaining.toFixed(2)} ha (${Math.round(remaining * 10000).toLocaleString('vi-VN')} m²).`
      );
    }

    return this.prisma.plot.create({
      data: {
        farmId,
        name: dto.name,
        area: plotArea,
      },
    });
  }

  /** Lấy danh sách lô trồng của 1 nông hộ */
  async findPlots(farmId: string, userId: string, role: string) {
    await this.checkFarmOwnership(farmId, userId, role);
    return this.prisma.plot.findMany({
      where: { farmId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Lấy chi tiết 1 lô trồng */
  async findOnePlot(farmId: string, plotId: string, userId: string, role: string) {
    await this.checkFarmOwnership(farmId, userId, role);
    const plot = await this.prisma.plot.findFirst({
      where: { id: plotId, farmId, deletedAt: null },
    });
    if (!plot) throw new NotFoundException('Lô trồng không tồn tại');
    return plot;
  }

  /** Cập nhật lô trồng */
  async updatePlot(farmId: string, plotId: string, userId: string, role: string, dto: UpdatePlotDto) {
    const farm = await this.checkFarmOwnership(farmId, userId, role);
    const plot = await this.prisma.plot.findFirst({
      where: { id: plotId, farmId, deletedAt: null },
    });
    if (!plot) throw new NotFoundException('Lô trồng không tồn tại');

    const dataToUpdate: any = {};
    if (dto.name !== undefined) dataToUpdate.name = dto.name;

    if (dto.area !== undefined) {
      const plotArea = normalizeAreaToHa(dto.area, dto.unit);
      if (plotArea <= 0) {
        throw new BadRequestException('Diện tích lô đất phải lớn hơn 0');
      }

      const otherArea = await this.prisma.plot.aggregate({
        where: { farmId, id: { not: plotId }, deletedAt: null },
        _sum: { area: true },
      });
      const totalOther = otherArea._sum.area || 0;

      if (totalOther + plotArea > farm.totalArea + 0.0001) {
        const remaining = Math.max(0, farm.totalArea - totalOther);
        throw new BadRequestException(
          `Tổng diện tích các lô (${(totalOther + plotArea).toFixed(2)} ha) vượt quá diện tích nông hộ (${farm.totalArea} ha). Lô này chỉ có thể tối đa ${remaining.toFixed(2)} ha (${Math.round(remaining * 10000).toLocaleString('vi-VN')} m²).`
        );
      }
      dataToUpdate.area = plotArea;
    }

    return this.prisma.plot.update({
      where: { id: plotId },
      data: dataToUpdate,
    });
  }

  /** Xóa mềm lô trồng */
  async removePlot(farmId: string, plotId: string, userId: string, role: string) {
    await this.checkFarmOwnership(farmId, userId, role);
    const plot = await this.prisma.plot.findFirst({
      where: { id: plotId, farmId, deletedAt: null },
    });
    if (!plot) throw new NotFoundException('Lô trồng không tồn tại');
    
    // Check nếu lô có CropCycle thì không cho xóa (tùy nghiệp vụ, ở đây cứ xóa mềm)
    return this.prisma.plot.update({
      where: { id: plotId },
      data: { deletedAt: new Date() },
    });
  }
}
