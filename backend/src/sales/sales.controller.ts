import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  // ==================== PRODUCTS ====================

  /** GET /sales/products?farmId=xxx */
  @Get('products')
  findProducts(@Query('farmId') farmId?: string) {
    return this.salesService.findProducts(farmId);
  }

  /** POST /sales/products */
  @Post('products')
  createProduct(@Body() body: any) {
    return this.salesService.createProduct(body);
  }

  /** PATCH /sales/products/:id */
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.salesService.updateProduct(id, body);
  }

  /** DELETE /sales/products/:id */
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.salesService.deleteProduct(id);
  }

  // ==================== INVOICES ====================

  /** GET /sales/invoices?farmId=xxx */
  @Get('invoices')
  findInvoices(@Query('farmId') farmId?: string) {
    return this.salesService.findInvoices(farmId);
  }

  /** GET /sales/invoices/:id */
  @Get('invoices/:id')
  findOneInvoice(@Param('id') id: string) {
    return this.salesService.findOneInvoice(id);
  }

  /** POST /sales/invoices */
  @Post('invoices')
  createInvoice(@Body() body: any) {
    return this.salesService.createInvoice(body);
  }

  /** PATCH /sales/invoices/:id/cancel */
  @Patch('invoices/:id/cancel')
  cancelInvoice(@Param('id') id: string) {
    return this.salesService.cancelInvoice(id);
  }

  /** DELETE /sales/invoices/:id */
  @Delete('invoices/:id')
  deleteInvoice(@Param('id') id: string) {
    return this.salesService.deleteInvoice(id);
  }

  /** GET /sales/stats?farmId=xxx */
  @Get('stats')
  getSalesStats(@Query('farmId') farmId: string) {
    return this.salesService.getSalesStats(farmId);
  }
}
