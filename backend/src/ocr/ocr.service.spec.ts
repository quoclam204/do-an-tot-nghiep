import { Test, TestingModule } from '@nestjs/testing';
import { OcrService } from './ocr.service';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';

// Mock toàn cục fetch để không gọi thật Gemini API trong unit test
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('OcrService (Quét hóa đơn vật tư nông nghiệp bằng AI Vision)', () => {
  let service: OcrService;

  beforeEach(async () => {
    mockFetch.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [OcrService],
    }).compile();

    service = module.get<OcrService>(OcrService);
  });

  // ================================================================
  // Validation đầu vào
  // ================================================================

  describe('Kiểm tra đầu vào (Input Validation)', () => {
    it('phải ném ServiceUnavailableException nếu GEMINI_API_KEY chưa cấu hình', async () => {
      delete process.env.GEMINI_API_KEY;

      await expect(
        service.scanReceipt('base64data', 'image/jpeg'),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('phải ném BadRequestException nếu không có base64 data', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      await expect(
        service.scanReceipt(undefined, 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });

    it('phải ném BadRequestException nếu mimeType không hợp lệ (không phải ảnh)', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      await expect(
        service.scanReceipt('aGVsbG8=', 'application/pdf'),
      ).rejects.toThrow(BadRequestException);
    });

    it('phải ném BadRequestException nếu mimeType là text/html (tấn công injection)', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';

      await expect(
        service.scanReceipt('aGVsbG8=', 'text/html'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ================================================================
  // Phân tích hóa đơn thành công
  // ================================================================

  describe('Phân tích hóa đơn thành công (Happy Path)', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'valid-test-key';
    });

    afterEach(() => {
      delete process.env.GEMINI_API_KEY;
    });

    it('phải trả về dữ liệu hóa đơn JSON khi Gemini phản hồi thành công', async () => {
      const mockGeminiResponse = {
        activityType: 'BON_PHAN',
        materialName: 'Phân NPK 20-20-15',
        quantity: 50,
        unit: 'kg',
        unitPrice: 20000,
        totalCost: 1000000,
        harvestQuantity: 0,
        harvestUnitPrice: 0,
        isHiredLabor: false,
        laborWorkers: 0,
        laborWagePerDay: 0,
        otherCosts: 0,
        items: [{ name: 'NPK 20-20-15', unit: 'kg', quantity: 50, unitPrice: 20000, total: 1000000 }],
        rawTextSummary: 'Hóa đơn mua phân bón từ Cty TNHH Vật Tư Lâm Đồng',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockGeminiResponse) }],
              },
            },
          ],
        }),
      } as any);

      const result = await service.scanReceipt('base64imagedata', 'image/jpeg');

      expect(result.activityType).toBe('BON_PHAN');
      expect(result.materialName).toBe('Phân NPK 20-20-15');
      expect(result.totalCost).toBe(1000000);
      expect(result.source).toBe('Gemini AI Vision');
    });

    it('phải chấp nhận ảnh PNG và WEBP ngoài JPEG', async () => {
      const mockData = { activityType: 'PHUN_THUOC', materialName: 'Thuốc Trừ Sâu', quantity: 1, unit: 'Chai', unitPrice: 50000, totalCost: 50000 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify(mockData) }] } }],
        }),
      } as any);

      const result = await service.scanReceipt('pngdata', 'image/png');
      expect(result.activityType).toBe('PHUN_THUOC');
    });
  });

  // ================================================================
  // Xử lý lỗi Gemini API
  // ================================================================

  describe('Xử lý lỗi từ Gemini API', () => {
    beforeEach(() => {
      process.env.GEMINI_API_KEY = 'valid-key';
    });

    afterEach(() => {
      delete process.env.GEMINI_API_KEY;
    });

    it('phải ném lỗi khi tất cả các model Gemini đều thất bại', async () => {
      // Tất cả các lần gọi đều trả về HTTP 500
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal Server Error' } }),
      } as any);

      await expect(
        service.scanReceipt('imgdata', 'image/jpeg'),
      ).rejects.toThrow();
    });

    it('phải ném lỗi khi Gemini trả về JSON rỗng (không có candidates)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({}), // Không có candidates
      } as any);

      await expect(
        service.scanReceipt('imgdata', 'image/jpeg'),
      ).rejects.toThrow();
    });
  });
});
