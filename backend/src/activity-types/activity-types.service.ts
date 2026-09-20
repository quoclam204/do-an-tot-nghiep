import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityTypesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy tất cả loại hoạt động (global + theo farmId) */
  async findAll(farmId?: string) {
    const totalCount = await (this.prisma as any).activityType.count({ where: { deletedAt: null } });
    if (totalCount === 0) {
      await this.seedDefaults();
    }

    const where: any = { deletedAt: null };
    const validFarmId = farmId && farmId !== 'undefined' && farmId !== 'null' && farmId.trim() !== '' ? farmId.trim() : null;
    if (validFarmId) {
      where.OR = [
        { farmId: null },  // global
        { farmId: validFarmId }, // riêng nông hộ
      ];
    } else {
      where.farmId = null; // chỉ global
    }
    return (this.prisma as any).activityType.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /** Tạo loại hoạt động mới */
  async create(input: { code: string; name: string; description?: string; icon?: string; farmId?: string }) {
    if (!input.code?.trim()) throw new BadRequestException('Mã loại hoạt động là bắt buộc');
    if (!input.name?.trim()) throw new BadRequestException('Tên loại hoạt động là bắt buộc');

    // Kiểm tra trùng code trong cùng scope (global hoặc cùng farm)
    const existing = await (this.prisma as any).activityType.findFirst({
      where: {
        code: input.code.trim().toUpperCase(),
        farmId: input.farmId || null,
        deletedAt: null,
      },
    });
    if (existing) throw new BadRequestException('Mã loại hoạt động đã tồn tại');

    return (this.prisma as any).activityType.create({
      data: {
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        icon: input.icon?.trim() || null,
        farmId: input.farmId || null,
        isSystem: false,
      },
    });
  }

  /** Cập nhật loại hoạt động */
  async update(id: string, input: { name?: string; description?: string; icon?: string }) {
    const existing = await (this.prisma as any).activityType.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Không tìm thấy loại hoạt động');

    return (this.prisma as any).activityType.update({
      where: { id },
      data: {
        ...(input.name && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.icon !== undefined && { icon: input.icon?.trim() || null }),
      },
    });
  }

  /** Xóa loại hoạt động (không cho xóa loại system) */
  async remove(id: string) {
    const existing = await (this.prisma as any).activityType.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Không tìm thấy loại hoạt động');
    if (existing.isSystem) throw new ForbiddenException('Không thể xóa loại hoạt động hệ thống');

    return (this.prisma as any).activityType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Seed dữ liệu loại hoạt động mặc định */
  async seedDefaults() {
    const defaults = [
      { code: 'LAM_DAT', name: 'Làm đất', description: 'Cày, xới, lên luống', icon: 'shovel', isSystem: true },
      { code: 'GIEO_TRONG', name: 'Gieo trồng', description: 'Gieo hạt, trồng cây con', icon: 'sprout', isSystem: true },
      { code: 'BON_PHAN', name: 'Bón phân', description: 'Bón phân hữu cơ, NPK, vi sinh', icon: 'leaf', isSystem: true },
      { code: 'TUOI_NUOC', name: 'Tưới nước', description: 'Tưới nước bằng tay, nhỏ giọt, phun mưa', icon: 'droplet', isSystem: true },
      { code: 'PHUN_THUOC', name: 'Phun thuốc', description: 'Phun thuốc BVTV, thuốc trừ sâu', icon: 'flask', isSystem: true },
      { code: 'CAT_TIA', name: 'Cắt tỉa', description: 'Cắt tỉa cành, tạo tán', icon: 'scissors', isSystem: true },
      { code: 'LAM_CO', name: 'Làm cỏ', description: 'Dọn cỏ dại, vệ sinh vườn', icon: 'grass', isSystem: true },
      { code: 'XOI_GOC', name: 'Xới gốc', description: 'Xới tơi đất quanh gốc cây', icon: 'pickaxe', isSystem: true },
      { code: 'BOM_NUOC', name: 'Bơm nước', description: 'Bơm nước vào ruộng, ao', icon: 'pump', isSystem: true },
      { code: 'KIEM_TRA', name: 'Kiểm tra', description: 'Kiểm tra sâu bệnh, tình trạng cây', icon: 'search', isSystem: true },
      { code: 'THU_HOACH', name: 'Thu hoạch', description: 'Thu hoạch nông sản', icon: 'harvest', isSystem: true },
      { code: 'PHOI_SAY', name: 'Phơi/Sấy', description: 'Phơi nắng, sấy khô nông sản', icon: 'sun', isSystem: true },
      { code: 'DONG_GOI', name: 'Đóng gói', description: 'Đóng gói, phân loại sản phẩm', icon: 'package', isSystem: true },
      { code: 'VAN_CHUYEN', name: 'Vận chuyển', description: 'Vận chuyển nông sản, vật tư', icon: 'truck', isSystem: true },
      { code: 'BAO_TRI', name: 'Bảo trì', description: 'Bảo trì máy móc, thiết bị', icon: 'wrench', isSystem: true },
      { code: 'KHAC', name: 'Khác', description: 'Hoạt động khác', icon: 'more', isSystem: true },
    ];

    const created: any[] = [];
    for (const at of defaults) {
      const existing = await (this.prisma as any).activityType.findFirst({
        where: { code: at.code, farmId: null, deletedAt: null },
      });
      if (!existing) {
        const record = await (this.prisma as any).activityType.create({
          data: { ...at, farmId: null },
        });
        created.push(record);
      } else {
        created.push(existing);
      }
    }
    return { message: `Đã khởi tạo ${created.length} loại hoạt động`, activityTypes: created };
  }
}
