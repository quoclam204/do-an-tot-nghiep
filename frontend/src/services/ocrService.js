/**
 * Dịch vụ OCR & AI Bóc tách Hóa đơn Nông nghiệp (DalatAgri)
 * Hỗ trợ 2 phương thức:
 * 1. Google Gemini AI Vision (Độ chính xác cao nhất với hóa đơn tiếng Việt)
 * 2. Tesseract.js (Chạy OCR cục bộ trên trình duyệt qua CDN, không cần API Key)
 */

// Helper: Tải script Tesseract.js từ CDN nếu chưa có
export const loadTesseractScript = () => {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      return resolve(window.Tesseract);
    }
    const existingScript = document.getElementById('tesseract-cdn-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Tesseract));
      existingScript.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'tesseract-cdn-script';
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => resolve(window.Tesseract);
    script.onerror = (err) => reject(new Error('Không thể tải thư viện Tesseract OCR từ CDN: ' + err.message));
    document.head.appendChild(script);
  });
};

// Chuyển file ảnh thành Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * 1. Quét hóa đơn qua Google Gemini AI Vision
 */
export const scanWithGemini = async (file, apiKey, onProgress) => {
  if (onProgress) onProgress(20, 'Đang mã hóa hình ảnh hóa đơn...');
  const base64Data = await fileToBase64(file);

  if (onProgress) onProgress(45, 'AI Gemini đang phân tích hóa đơn và bóc tách các mặt hàng...');

  const prompt = `Bạn là chuyên gia phân tích hóa đơn vật tư nông nghiệp Việt Nam (phân bón, thuốc BVTV, giống cây, phiếu thu hoạch).
Hãy phân tích hình ảnh hóa đơn/phiếu này và trả về kết quả định dạng JSON THUẦN TÚY (không bọc trong \`\`\`json hoặc bất kỳ ký tự nào khác ngoài JSON hợp lệ).

Cấu trúc JSON yêu cầu:
{
  "activityType": "PHUN_THUOC" | "BON_PHAN" | "THU_HOACH" | "LAM_CO" | "TUOI_NUOC",
  "materialName": "Tên vật tư chính hoặc tóm tắt các sản phẩm chính",
  "quantity": số_lượng_tổng_các_món (số),
  "unit": "Chai" | "Gói" | "Bao 50kg" | "Bao" | "kg" | "Lít",
  "unitPrice": đơn_giá_nếu_có (số),
  "totalCost": tổng_tiền_thanh_toán_của_hóa_đơn_VNĐ (số nguyên, bỏ dấu chấm phẩy),
  "harvestQuantity": 0,
  "harvestUnitPrice": 0,
  "isHiredLabor": false,
  "laborWorkers": 0,
  "laborWagePerDay": 0,
  "otherCosts": 0,
  "items": [
    {
      "name": "Tên sản phẩm",
      "unit": "Đơn vị tính",
      "quantity": số_lượng,
      "unitPrice": đơn_giá,
      "total": thành_tiền
    }
  ],
  "rawTextSummary": "Tóm tắt ngắn gọn các sản phẩm và số tiền"
}

Quy tắc phân loại activityType:
- Nếu hóa đơn có các mặt hàng như thuốc trừ sâu, trừ bệnh, diệt rầy, bọ trĩ, xịt lá, nấm, thuốc trừ cỏ -> activityType = "PHUN_THUOC"
- Nếu hóa đơn là phân NPK, đạm, lân, kali, phân hữu cơ, vôi -> activityType = "BON_PHAN"
- Nếu là phiếu cân lúa, cà phê, sầu riêng, rau củ thu hoạch -> activityType = "THU_HOACH"
- Lấy chính xác Tổng tiền (Tổng thanh toán / Cần thanh toán / Thành tiền).`;

  // Thử các model Gemini phổ biến (ưu tiên 2.0-flash, 1.5-flash)
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-latest'];
  let lastError = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: file.type || 'image/jpeg',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (onProgress) onProgress(85, 'Đang chuẩn hóa kết quả nhận diện...');
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Làm sạch text để parse JSON
      const cleanJsonStr = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleanJsonStr);
      if (onProgress) onProgress(100, 'Bóc tách hóa đơn hoàn tất!');
      return {
        ...parsed,
        source: 'Gemini AI Vision',
      };
    } catch (err) {
      lastError = err;
      console.warn(`Lỗi với model ${model}:`, err.message);
    }
  }

  throw lastError || new Error('Không thể phân tích hóa đơn bằng Gemini AI.');
};

/**
 * 2. Phân tích ngữ nghĩa văn bản hóa đơn bóc tách được (Parser thông minh)
 */
export const parseReceiptText = (rawText) => {
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const fullLower = rawText.toLowerCase();

  // Xác định loại hoạt động
  let activityType = 'PHUN_THUOC';
  if (
    fullLower.includes('phân') ||
    fullLower.includes('npk') ||
    fullLower.includes('đạm') ||
    fullLower.includes('lân') ||
    fullLower.includes('kali') ||
    fullLower.includes('đầu trâu') ||
    fullLower.includes('hữu cơ')
  ) {
    activityType = 'BON_PHAN';
  } else if (
    fullLower.includes('thu hoạch') ||
    fullLower.includes('phiếu thu hoạch') ||
    fullLower.includes('phiếu cân') ||
    fullLower.includes('trái tươi') ||
    fullLower.includes('cà phê tươi')
  ) {
    activityType = 'THU_HOACH';
  }

  // Tìm tổng tiền
  let totalCost = 0;
  // Tìm các dòng chứa "tổng cộng", "tổng tiền", "thành tiền", "còn nợ", "tiền thanh toán"
  const moneyRegex = /(\d{1,3}(?:[.,]\d{3})+|\b\d{4,9}\b)/g;
  
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    if (
      lineLower.includes('tổng') ||
      lineLower.includes('thành tiền') ||
      lineLower.includes('cộng') ||
      lineLower.includes('cần thu') ||
      lineLower.includes('còn lại') ||
      lineLower.includes('thanh toán')
    ) {
      const matches = line.match(moneyRegex);
      if (matches && matches.length > 0) {
        // Lấy số cuối cùng trong dòng tổng
        const rawNumStr = matches[matches.length - 1].replace(/[.,]/g, '');
        const val = parseInt(rawNumStr, 10);
        if (val > 1000) {
          totalCost = val;
          break;
        }
      }
    }
  }

  // Nếu chưa tìm thấy tổng tiền qua từ khóa, tìm số lớn nhất hợp lý trong tài liệu
  if (!totalCost) {
    const allMatches = rawText.match(moneyRegex) || [];
    const numbers = allMatches
      .map((m) => parseInt(m.replace(/[.,]/g, ''), 10))
      .filter((n) => n >= 10000 && n <= 500000000); // 10k đến 500tr
    if (numbers.length > 0) {
      totalCost = Math.max(...numbers);
    }
  }

  // Tìm danh sách mặt hàng
  const items = [];
  const itemKeywordsRegex = /(chai|gói|bao|can|hộp|lít|kg|cử|viên|lọ|ống|bịch)/i;

  lines.forEach((line) => {
    // Nếu dòng có vẻ là mặt hàng (có tên hoặc đơn vị tính + số tiền)
    const matchesMoney = line.match(moneyRegex);
    const hasUnit = itemKeywordsRegex.test(line);

    if (hasUnit || (matchesMoney && matchesMoney.length >= 2)) {
      // Loại bỏ các dòng tiêu đề hoặc tổng
      const lineLower = line.toLowerCase();
      if (
        lineLower.includes('tổng') ||
        lineLower.includes('hóa đơn') ||
        lineLower.includes('công ty') ||
        lineLower.includes('ngày') ||
        lineLower.includes('khách hàng') ||
        lineLower.includes('nhân viên')
      ) {
        return;
      }

      // Làm sạch tên
      let cleanName = line
        .replace(moneyRegex, '')
        .replace(/^\d+[\s.-]+/, '') // bỏ số thứ tự ở đầu ví dụ "1.", "2 "
        .replace(itemKeywordsRegex, '')
        .replace(/[:|]/g, '')
        .trim();

      if (cleanName.length >= 2 && cleanName.length <= 50) {
        const itemTotal = matchesMoney
          ? parseInt(matchesMoney[matchesMoney.length - 1].replace(/[.,]/g, ''), 10)
          : 0;
        
        const unitMatch = line.match(itemKeywordsRegex);
        items.push({
          name: cleanName,
          unit: unitMatch ? unitMatch[0].toUpperCase() : 'Chai',
          quantity: 1,
          unitPrice: itemTotal,
          total: itemTotal,
        });
      }
    }
  });

  // Tên vật tư đại diện
  let materialName = 'Vật tư nông nghiệp';
  if (items.length > 0) {
    // Lấy 1-3 tên mặt hàng đầu tiên
    materialName = items.slice(0, 3).map((it) => it.name).join(', ');
    if (items.length > 3) {
      materialName += ` (+${items.length - 3} món)`;
    }
  } else if (activityType === 'PHUN_THUOC') {
    materialName = 'Thuốc bảo vệ thực vật';
  } else if (activityType === 'BON_PHAN') {
    materialName = 'Phân bón nông nghiệp';
  }

  const totalQuantity = items.length > 0 ? items.length : 1;
  const unit = items[0]?.unit || (activityType === 'PHUN_THUOC' ? 'Chai' : 'Bao 50kg');

  return {
    activityType,
    materialName,
    quantity: totalQuantity,
    unit,
    unitPrice: totalCost && totalQuantity ? Math.round(totalCost / totalQuantity) : 0,
    totalCost: totalCost || 0,
    harvestQuantity: activityType === 'THU_HOACH' ? totalQuantity : 0,
    harvestUnitPrice: 0,
    isHiredLabor: false,
    laborWorkers: 0,
    laborWagePerDay: 0,
    otherCosts: 0,
    items,
    notes: items.length > 0
      ? `Hóa đơn gồm ${items.length} món: ${items.map((i) => `${i.name} (${i.total ? i.total.toLocaleString() + 'đ' : ''})`).join(', ')}`
      : 'Hóa đơn quét OCR tự động từ camera/tài liệu của nông dân.',
    rawTextSummary: rawText.slice(0, 500),
    source: 'Tesseract OCR (Cục bộ)',
  };
};

/**
 * 3. Quét qua Tesseract.js (Chạy ngay trong trình duyệt không cần backend)
 */
export const scanWithTesseract = async (file, onProgress) => {
  if (onProgress) onProgress(10, 'Đang tải bộ máy OCR Tesseract...');
  const Tesseract = await loadTesseractScript();

  if (onProgress) onProgress(25, 'Khởi tạo Worker nhận diện tiếng Việt...');
  const worker = await Tesseract.createWorker('vie+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const pct = Math.round(30 + m.progress * 60);
        if (onProgress) onProgress(pct, `Đang nhận diện chữ OCR: ${Math.round(m.progress * 100)}%...`);
      }
    },
  });

  if (onProgress) onProgress(90, 'Đang phân tích cấu trúc hóa đơn & trích xuất số liệu...');
  const ret = await worker.recognize(file);
  await worker.terminate();

  const rawText = ret.data.text || '';
  const parsed = parseReceiptText(rawText);
  if (onProgress) onProgress(100, 'Hoàn thành bóc tách hóa đơn!');

  return {
    ...parsed,
    rawOcrText: rawText,
  };
};
