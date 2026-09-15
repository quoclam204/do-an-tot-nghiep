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

  /** Lấy tất cả nông hộ của user đang đăng nhập (sở hữu HOẶC là thành viên) */
  async findMyFarms(userId: string) {
    return (this.prisma.farm as any).findMany({
      where: {
        deletedAt: null,
        OR: [
          { userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
        },
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
    return (this.prisma.farm as any).findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
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
    const farm = await this.prisma.farm.create({
      data: {
        userId,
        name: dto.name,
        location: dto.location,
        totalArea,
      },
    });

    // Tự động thêm người tạo làm thành viên OWNER trong FarmMember
    try {
      await (this.prisma as any).farmMember.create({
        data: {
          farmId: farm.id,
          userId,
          role: 'OWNER',
          canEditLog: true,
          canManageInventory: true,
        },
      });
    } catch {
      // ignore nếu đã tồn tại
    }

    return farm;
  }

  /** Xem chi tiết 1 nông hộ */
  async findOne(id: string, userId: string, role: string) {
    const farm: any = await (this.prisma.farm as any).findFirst({
      where: { id, deletedAt: null },
      include: {
        plots: { where: { deletedAt: null } },
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phone: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!farm) throw new NotFoundException('Nông hộ không tồn tại');
    
    const isMember = farm.members?.some((m: any) => m.userId === userId);
    if (farm.userId !== userId && !isMember && role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền xem nông hộ này');
    }
    return farm;
  }

  /** Cập nhật nông hộ */
  async update(id: string, dto: UpdateFarmDto, userId: string, role: string) {
    const farm = await this.checkFarmOwnership(id, userId, role, true);

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
    await this.checkFarmOwnership(id, userId, role, true);
    return this.prisma.farm.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true, name: true },
    });
  }

  // ==========================================
  // FARM MEMBERS MANAGEMENT (N - N)
  // ==========================================

  /** Lấy danh sách thành viên / nông dân của trang trại */
  async getFarmMembers(farmId: string, userId: string, role: string) {
    await this.checkFarmOwnership(farmId, userId, role, false);
    return (this.prisma as any).farmMember.findMany({
      where: { farmId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /** Thêm tài khoản nông dân vào trang trại */
  async addFarmMember(
    farmId: string,
    currentUserId: string,
    role: string,
    dto: { emailOrPhone: string; role?: string; canEditLog?: boolean; canManageInventory?: boolean },
  ) {
    await this.checkFarmOwnership(farmId, currentUserId, role, true);

    const term = dto.emailOrPhone?.trim();
    if (!term) throw new BadRequestException('Vui lòng nhập email hoặc số điện thoại của người nông dân');

    const targetUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: term.toLowerCase() },
          { phone: term },
        ],
        deletedAt: null,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng với thông tin này');
    }

    // Kiểm tra đã là thành viên chưa
    const existing = await (this.prisma as any).farmMember.findUnique({
      where: {
        farmId_userId: { farmId, userId: targetUser.id },
      },
    });
    if (existing) {
      throw new BadRequestException('Người nông dân này đã tham gia trang trại rồi');
    }

    return (this.prisma as any).farmMember.create({
      data: {
        farmId,
        userId: targetUser.id,
        role: dto.role || 'WORKER',
        canEditLog: dto.canEditLog ?? true,
        canManageInventory: dto.canManageInventory ?? true,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
  }

  /** Xóa nông dân khỏi trang trại */
  async removeFarmMember(farmId: string, memberId: string, currentUserId: string, role: string) {
    const farm = await this.checkFarmOwnership(farmId, currentUserId, role, true);
    
    const member = await (this.prisma as any).farmMember.findFirst({
      where: { id: memberId, farmId },
    });
    if (!member) throw new NotFoundException('Không tìm thấy thành viên trong nông hộ');

    if (member.userId === farm.userId) {
      throw new BadRequestException('Không thể xóa chủ trang trại gốc');
    }

    return (this.prisma as any).farmMember.delete({
      where: { id: memberId },
    });
  }

  // ==========================================
  // PLOT CRUD
  // ==========================================

  /** Kiểm tra quyền truy cập hoặc quản lý farm */
  private async checkFarmOwnership(farmId: string, userId: string, role: string, requireManage = false) {
    const farm: any = await (this.prisma.farm as any).findFirst({
      where: { id: farmId, deletedAt: null },
      include: { members: true },
    });
    if (!farm) throw new NotFoundException('Nông hộ không tồn tại');
    if (role === 'ADMIN' || farm.userId === userId) {
      return farm;
    }

    const member = farm.members?.find((m: any) => m.userId === userId);
    if (!member) {
      throw new ForbiddenException('Bạn không có quyền thao tác trên nông hộ này');
    }
    if (requireManage && member.role !== 'OWNER' && member.role !== 'MANAGER') {
      throw new ForbiddenException('Bạn cần quyền Chủ/Quản lý trang trại để thực hiện thao tác này');
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
