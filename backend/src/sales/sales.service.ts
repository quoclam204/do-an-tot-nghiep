import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== PRODUCTS ====================

  /** Lấy danh sách sản phẩm theo nông hộ */
  async findProducts(farmId?: string) {
    const where: any = { deletedAt: null };
    if (farmId) where.farmId = farmId;
    return (this.prisma as any).product.findMany({
      where,
      include: { farm: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Tạo sản phẩm mới */
  async createProduct(input: {
    farmId: string;
    name: string;
    unit: string;
    price: number;
    stockQuantity?: number;
    description?: string;
  }) {
    if (!input.farmId) throw new BadRequestException('farmId là bắt buộc');
    if (!input.name?.trim()) throw new BadRequestException('Tên sản phẩm là bắt buộc');
    if (!input.unit?.trim()) throw new BadRequestException('Đơn vị tính là bắt buộc');
    if (!Number.isFinite(Number(input.price)) || Number(input.price) <= 0) {
      throw new BadRequestException('Giá bán phải lớn hơn 0');
    }

    return (this.prisma as any).product.create({
      data: {
        farmId: input.farmId,
        name: input.name.trim(),
        unit: input.unit.trim(),
        price: Number(input.price),
        stockQuantity: Number(input.stockQuantity || 0),
        description: input.description?.trim() || null,
      },
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  /** Cập nhật sản phẩm */
  async updateProduct(id: string, input: any) {
    const product = await (this.prisma as any).product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.unit !== undefined) data.unit = input.unit.trim();
    if (input.price !== undefined) {
      if (Number(input.price) <= 0) throw new BadRequestException('Giá bán phải lớn hơn 0');
      data.price = Number(input.price);
    }
    if (input.stockQuantity !== undefined) data.stockQuantity = Number(input.stockQuantity);
    if (input.description !== undefined) data.description = input.description?.trim() || null;

    return (this.prisma as any).product.update({
      where: { id },
      data,
      include: { farm: { select: { id: true, name: true } } },
    });
  }

  /** Xóa mềm sản phẩm */
  async deleteProduct(id: string) {
    const product = await (this.prisma as any).product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    return (this.prisma as any).product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ==================== INVOICES ====================

  /** Tạo mã hóa đơn tự sinh */
  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `HD-${dateStr}`;

    // Tìm hóa đơn cuối cùng trong ngày
    const lastInvoice = await (this.prisma as any).invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let seq = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${String(seq).padStart(3, '0')}`;
  }

  /** Lấy danh sách hóa đơn theo nông hộ */
  async findInvoices(farmId?: string) {
    const where: any = { deletedAt: null };
    if (farmId) where.farmId = farmId;
    return (this.prisma as any).invoice.findMany({
      where,
      include: {
        farm: { select: { id: true, name: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Xem chi tiết 1 hóa đơn */
  async findOneInvoice(id: string) {
    const invoice = await (this.prisma as any).invoice.findFirst({
      where: { id, deletedAt: null },
      include: {
        farm: { select: { id: true, name: true, location: true } },
        items: { include: { product: true } },
      },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    return invoice;
  }

  /** Tạo hóa đơn mới (kèm chi tiết) */
  async createInvoice(input: {
    farmId: string;
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    discount?: number;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
  }) {
    if (!input.farmId) throw new BadRequestException('farmId là bắt buộc');
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Hóa đơn phải có ít nhất 1 sản phẩm');
    }

    // Kiểm tra tồn kho + thu thập thông tin sản phẩm
    const itemsData: any[] = [];
    let totalAmount = 0;

    for (const item of input.items) {
      const product = await (this.prisma as any).product.findFirst({
        where: { id: item.productId, deletedAt: null },
      });
      if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm: ${item.productId}`);

      const qty = Number(item.quantity);
      if (qty <= 0) throw new BadRequestException(`Số lượng phải lớn hơn 0`);

      if (product.stockQuantity < qty) {
        throw new ConflictException(
          `Sản phẩm "${product.name}" chỉ còn ${product.stockQuantity} ${product.unit} trong kho, không đủ ${qty} ${product.unit}`,
        );
      }

      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : product.price;
      const subtotal = qty * unitPrice;
      totalAmount += subtotal;

      itemsData.push({
        productId: product.id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        subtotal,
      });
    }

    const discount = Number(input.discount || 0);
    const finalAmount = totalAmount - discount;
    const invoiceNumber = await this.generateInvoiceNumber();

    // Tạo hóa đơn + items trong transaction
    const result = await this.prisma.$transaction(async (tx: any) => {
      // 1. Tạo hóa đơn
      const invoice = await tx.invoice.create({
        data: {
          farmId: input.farmId,
          invoiceNumber,
          customerName: input.customerName?.trim() || null,
          customerPhone: input.customerPhone?.trim() || null,
          customerAddress: input.customerAddress?.trim() || null,
          totalAmount,
          discount,
          finalAmount,
          notes: input.notes?.trim() || null,
          status: 'COMPLETED',
          items: {
            create: itemsData,
          },
        },
        include: {
          items: { include: { product: true } },
          farm: { select: { id: true, name: true } },
        },
      });

      // 2. Trừ tồn kho
      for (const item of itemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      return invoice;
    });

    return result;
  }

  /** Hủy hóa đơn (hoàn lại tồn kho) */
  async cancelInvoice(id: string) {
    const invoice = await (this.prisma as any).invoice.findFirst({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');
    if (invoice.status === 'CANCELLED') throw new BadRequestException('Hóa đơn đã bị hủy trước đó');

    return this.prisma.$transaction(async (tx: any) => {
      // 1. Hoàn lại tồn kho
      for (const item of invoice.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }

      // 2. Cập nhật trạng thái hóa đơn
      return tx.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true } },
          farm: { select: { id: true, name: true } },
        },
      });
    });
  }

  /** Xóa mềm hóa đơn */
  async deleteInvoice(id: string) {
    const invoice = await (this.prisma as any).invoice.findFirst({ where: { id, deletedAt: null } });
    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');

    return (this.prisma as any).invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /** Thống kê doanh thu bán hàng */
  async getSalesStats(farmId: string) {
    const invoices = await (this.prisma as any).invoice.findMany({
      where: { farmId, deletedAt: null, status: 'COMPLETED' },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalInvoices = invoices.length;
    const productSales: Record<string, { name: string; unit: string; totalQty: number; totalRevenue: number }> = {};

    for (const inv of invoices) {
      totalRevenue += inv.finalAmount || 0;
      totalDiscount += inv.discount || 0;
      for (const item of inv.items) {
        const key = item.productId;
        if (!productSales[key]) {
          productSales[key] = {
            name: item.productName || item.product?.name || 'Sản phẩm',
            unit: item.product?.unit || '',
            totalQty: 0,
            totalRevenue: 0,
          };
        }
        productSales[key].totalQty += item.quantity;
        productSales[key].totalRevenue += item.subtotal;
      }
    }

    return {
      totalInvoices,
      totalRevenue,
      totalDiscount,
      productSales: Object.values(productSales),
    };
  }
}
