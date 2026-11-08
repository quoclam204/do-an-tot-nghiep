import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';

const RECEIPT_PROMPT = `Bạn là chuyên gia phân tích hóa đơn vật tư nông nghiệp Việt Nam (phân bón, thuốc BVTV, giống cây, phiếu thu hoạch).
Hãy phân tích hình ảnh hóa đơn/phiếu này và trả về kết quả định dạng JSON THUẦN TÚY (không bọc trong markdown).

Cấu trúc JSON yêu cầu:
{
  "activityType": "PHUN_THUOC" | "BON_PHAN" | "THU_HOACH" | "LAM_CO" | "TUOI_NUOC",
  "materialName": "Tên vật tư chính hoặc tóm tắt các sản phẩm chính",
  "quantity": 0, "unit": "Chai", "unitPrice": 0, "totalCost": 0,
  "harvestQuantity": 0, "harvestUnitPrice": 0, "isHiredLabor": false,
  "laborWorkers": 0, "laborWagePerDay": 0, "otherCosts": 0,
  "items": [{"name": "Tên sản phẩm", "unit": "Đơn vị tính", "quantity": 0, "unitPrice": 0, "total": 0}],
  "rawTextSummary": "Tóm tắt ngắn gọn"
}

Phân loại thuốc trừ sâu, trừ bệnh, diệt rầy, bọ trĩ, nấm, thuốc trừ cỏ là PHUN_THUOC.
Phân NPK, đạm, lân, kali, phân hữu cơ, vôi là BON_PHAN.
Phiếu cân lúa, cà phê, sầu riêng, rau củ thu hoạch là THU_HOACH.
Lấy chính xác tổng tiền thanh toán và các mặt hàng trong ảnh.`;

@Injectable()
export class OcrService {
  async scanReceipt(base64Data?: string, mimeType?: string) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('OCR AI chưa được cấu hình trên máy chủ.');
    }
    if (!base64Data || !/^image\/(jpeg|png|webp|heic|heif)$/i.test(mimeType || '')) {
      throw new BadRequestException('Ảnh hóa đơn không hợp lệ.');
    }

    const models = ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let lastMessage = 'Không thể phân tích hóa đơn bằng Gemini.';

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: RECEIPT_PROMPT }, { inlineData: { mimeType, data: base64Data } }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
            }),
          },
        );

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          lastMessage = payload.error?.message || `Gemini trả về HTTP ${response.status}.`;
          continue;
        }

        const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          lastMessage = 'Gemini không trả về dữ liệu nhận dạng.';
          continue;
        }
        const jsonText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return { ...JSON.parse(jsonText), source: 'Gemini AI Vision' };
      } catch (error) {
        lastMessage = error instanceof Error ? error.message : lastMessage;
      }
    }

    throw new InternalServerErrorException(lastMessage);
  }
}
