import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OcrService } from './ocr.service';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('receipt')
  scanReceipt(@Body() body: { base64Data?: string; mimeType?: string }) {
    return this.ocrService.scanReceipt(body.base64Data, body.mimeType);
  }
}
