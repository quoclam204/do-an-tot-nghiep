/**
 * exportReport.js
 * Xuất báo cáo kinh tế nông hộ ra file Word, PDF, Excel
 * với số liệu trực quan dạng bảng biểu thay vì chụp ảnh màn hình.
 */

// ===================== HELPERS =====================
const fmtMoney = (v) => `${Number(v || 0).toLocaleString('vi-VN')} đ`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');
const today = () => new Date().toLocaleDateString('vi-VN');

const ACTIVITY_LABELS = {
  BON_PHAN: 'Bón phân',
  PHUN_THUOC: 'Phun thuốc BVTV',
  CAT_TIA: 'Cắt tỉa cành',
  LAM_CO: 'Làm cỏ',
  TUOI_NUOC: 'Tưới nước',
  THU_HOACH: 'Thu hoạch',
};

// Helper loại bỏ dấu tiếng Việt an toàn cho font mặc định (Helvetica) của jsPDF
const stripVN = (str) => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const fmtMoneyPDF = (v) => `${Number(v || 0).toLocaleString('vi-VN')} VND`;

// ===================== PDF EXPORT =====================
export async function exportToPDF({ financials, logs, materialUsage, seasonSummary, filterInfo, capexAnalysis }) {
  const { default: jsPDF } = await import('jspdf');
  const autotableModule = await import('jspdf-autotable');
  const autoTable = autotableModule.default || autotableModule.autoTable || autotableModule;
  if (typeof autotableModule.applyPlugin === 'function') {
    autotableModule.applyPlugin(jsPDF);
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  let y = 15;

  doc.setFont('helvetica');

  // === HEADER ===
  doc.setFillColor(16, 124, 16); // ms-green
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DalatAgri - Bao cao kinh te nong ho', pageW / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ngay xuat: ${today()} | ${stripVN(filterInfo) || 'Tat ca trang trai & mua vu'}`, pageW / 2, 20, { align: 'center' });

  y = 36;

  // === TỔNG QUAN KPI ===
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('I. TONG QUAN CHI PHI & DOANH THU', 14, y);
  y += 2;

  const totalExpense = Number(financials?.totalExpense || 0);
  const totalRevenue = Number(financials?.totalRevenue || 0);
  const netProfit = Number(financials?.netProfit || 0);
  const roi = financials?.roiPercentage || 0;

  autoTable(doc, {
    startY: y,
    head: [['Chi tieu', 'Gia tri', 'Ghi chu']],
    body: [
      ['Tong chi phi dau tu', fmtMoneyPDF(totalExpense), `Vat tu: ${fmtMoneyPDF(financials?.totalMaterialCost)} | Nhan cong: ${fmtMoneyPDF(financials?.totalLaborCost)}`],
      ['Tong doanh thu', fmtMoneyPDF(totalRevenue), `San luong: ${(financials?.totalHarvestQty || 0).toLocaleString()} kg`],
      ['Loi nhuan rong', fmtMoneyPDF(netProfit), `ROI: ${roi}%`],
      ['Tong luot ghi nhat ky', String(financials?.logsCount || (logs?.length || 0)), `Cham soc: ${financials?.careLogsCount || 0} | Thu hoach: ${financials?.harvestLogsCount || 0}`],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [16, 124, 16], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 246] },
    margin: { left: 14, right: 14 },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // === CƠ CẤU CHI PHÍ ===
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('II. CO CAU CHI PHI', 14, y);
  y += 2;

  const matCost = Number(financials?.totalMaterialCost || 0);
  const labCost = Number(financials?.totalLaborCost || 0);
  const othCost = Number(financials?.totalOtherCosts || 0);
  const total = matCost + labCost + othCost;
  const pct = (v) => total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';

  autoTable(doc, {
    startY: y,
    head: [['Loai chi phi', 'So tien', 'Ty le (%)']],
    body: [
      ['Vat tu (Phan, thuoc BVTV)', fmtMoneyPDF(matCost), pct(matCost)],
      ['Nhan cong lao dong', fmtMoneyPDF(labCost), pct(labCost)],
      ['Chi phi khac', fmtMoneyPDF(othCost), pct(othCost)],
      ['TONG CONG', fmtMoneyPDF(total), '100%'],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.row.index === 3) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [220, 252, 231];
      }
    },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  // === VẬT TƯ TIÊU THỤ ===
  if (materialUsage && materialUsage.length > 0) {
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('III. TONG HOP VAT TU TIEU THU', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['STT', 'Ten vat tu', 'Loai', 'Tong luong dung', 'Tong chi phi', 'So lan SD']],
      body: materialUsage.map((item, idx) => [
        idx + 1,
        stripVN(item.name),
        item.type === 'PHAN_BON' ? 'Phan bon' : item.type === 'THUOC_BVTV' ? 'Thuoc BVTV' : stripVN(item.type),
        `${Number(item.totalQty || 0).toLocaleString()} ${stripVN(item.unit)}`,
        fmtMoneyPDF(item.totalCost),
        `${item.count} lan`,
      ]),
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { cellWidth: 12 } },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }

  // === LỊCH SỬ HOẠT ĐỘNG ===
  if (logs && logs.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`IV. LICH SU HOAT DONG CANH TAC (${logs.length} luot)`, 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Ngay', 'Mua vu', 'Hoat dong', 'Chi phi', 'Doanh thu', 'Ghi chu']],
      body: logs.map((log) => [
        fmtDate(log.activityDate),
        stripVN(log.cropCycle?.name || '—'),
        stripVN(ACTIVITY_LABELS[log.activityType] || log.activityType),
        (log.cost || 0) > 0 ? fmtMoneyPDF(log.cost) : '—',
        (log.revenue || 0) > 0 ? fmtMoneyPDF(log.revenue) : '—',
        log.notes ? (stripVN(log.notes).length > 50 ? stripVN(log.notes).slice(0, 50) + '...' : stripVN(log.notes)) : '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
      columnStyles: { 0: { cellWidth: 22 }, 5: { cellWidth: 40 } },
    });
  }

  // === V. KHẤU HAO KIẾN THIẾT CƠ BẢN (CapEx) & MÃ SỐ VÙNG TRỒNG (PUC) ===
  if (capexAnalysis && capexAnalysis.plotDetails && capexAnalysis.plotDetails.length > 0) {
    if (y > 200) { doc.addPage(); y = 15; }
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('V. KHAU HAO KIEN THIET CO BAN (CapEx) & MA VUNG TRONG (PUC)', 14, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [['Lo / Thua', 'Cay trong', 'Ma PUC', 'Von CapEx', 'Khau hao/nam', 'Da khau hao', 'Gia tri con lai']],
      body: capexAnalysis.plotDetails.map((item) => {
        const p = item.plot || {};
        const c = item.capex || {};
        return [
          stripVN(p.name || 'Lo dat'),
          stripVN(c.cropName || 'Cay dai ngay'),
          c.pucCode || 'Chua cap',
          fmtMoneyPDF(c.initialCost),
          fmtMoneyPDF(c.annualDepreciation),
          `${c.percentDepreciated || 0}%`,
          fmtMoneyPDF(c.remainingValue),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [16, 124, 16], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      margin: { left: 14, right: 14 },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 10;
  }

  // === FOOTER ===
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`DalatAgri | Trang ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
  }

  doc.save(`BaoCao_DalatAgri_${new Date().toISOString().slice(0, 10)}.pdf`);
}


// ===================== EXCEL EXPORT =====================
export async function exportToExcel({ financials, logs, materialUsage, seasonSummary, filterInfo, capexAnalysis }) {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();

  // --- Sheet 1: Tổng quan KPI ---
  const kpiData = [
    ['BÁO CÁO KINH TẾ NÔNG HỘ - DalatAgri'],
    [`Ngày xuất: ${today()}`, filterInfo || 'Tất cả trang trại & mùa vụ'],
    [],
    ['CHỈ TIÊU', 'GIÁ TRỊ (VNĐ)', 'CHI TIẾT'],
    ['Tổng chi phí đầu tư', Number(financials?.totalExpense || 0), `Vật tư: ${fmtMoney(financials?.totalMaterialCost)} | Nhân công: ${fmtMoney(financials?.totalLaborCost)}`],
    ['Tổng doanh thu', Number(financials?.totalRevenue || 0), `Sản lượng: ${(financials?.totalHarvestQty || 0).toLocaleString()} kg`],
    ['Lợi nhuận ròng', Number(financials?.netProfit || 0), `ROI: ${financials?.roiPercentage || 0}%`],
    ['Tổng lượt ghi nhật ký', Number(financials?.logsCount || logs?.length || 0), `Chăm sóc: ${financials?.careLogsCount || 0} | Thu hoạch: ${financials?.harvestLogsCount || 0}`],
    [],
    ['CƠ CẤU CHI PHÍ', 'SỐ TIỀN (VNĐ)', 'TỶ LỆ (%)'],
    ['Vật tư (Phân, thuốc BVTV)', Number(financials?.totalMaterialCost || 0), ''],
    ['Nhân công lao động', Number(financials?.totalLaborCost || 0), ''],
    ['Chi phí khác', Number(financials?.totalOtherCosts || 0), ''],
  ];

  // Tính tỷ lệ %
  const totalCost = Number(financials?.totalMaterialCost || 0) + Number(financials?.totalLaborCost || 0) + Number(financials?.totalOtherCosts || 0);
  if (totalCost > 0) {
    kpiData[10][2] = `${Math.round((Number(financials?.totalMaterialCost || 0) / totalCost) * 100)}%`;
    kpiData[11][2] = `${Math.round((Number(financials?.totalLaborCost || 0) / totalCost) * 100)}%`;
    kpiData[12][2] = `${Math.round((Number(financials?.totalOtherCosts || 0) / totalCost) * 100)}%`;
  }

  const wsKPI = XLSX.utils.aoa_to_sheet(kpiData);
  wsKPI['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 50 }];
  // Merge tiêu đề
  wsKPI['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  XLSX.utils.book_append_sheet(wb, wsKPI, 'Tổng quan');

  // --- Sheet 2: Vật tư tiêu thụ ---
  if (materialUsage && materialUsage.length > 0) {
    const matHeaders = ['STT', 'Tên vật tư', 'Loại', 'Tổng lượng dùng', 'Đơn vị', 'Tổng chi phí (VNĐ)', 'Số lần sử dụng'];
    const matRows = materialUsage.map((item, idx) => [
      idx + 1,
      item.name,
      item.type === 'PHAN_BON' ? 'Phân bón' : item.type === 'THUOC_BVTV' ? 'Thuốc BVTV' : item.type,
      item.totalQty,
      item.unit,
      item.totalCost,
      item.count,
    ]);

    const matData = [
      ['TỔNG HỢP VẬT TƯ TIÊU THỤ'],
      [],
      matHeaders,
      ...matRows,
      [],
      ['', '', '', '', 'TỔNG CỘNG', materialUsage.reduce((s, i) => s + i.totalCost, 0), ''],
    ];

    const wsMat = XLSX.utils.aoa_to_sheet(matData);
    wsMat['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 15 }, { wch: 16 }, { wch: 10 }, { wch: 20 }, { wch: 16 }];
    wsMat['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
    XLSX.utils.book_append_sheet(wb, wsMat, 'Vật tư');
  }

  // --- Sheet 3: Lịch sử hoạt động ---
  if (logs && logs.length > 0) {
    const logHeaders = ['STT', 'Ngày', 'Mùa vụ', 'Cây trồng', 'Hoạt động', 'Chi phí (VNĐ)', 'Doanh thu (VNĐ)', 'Ghi chú'];
    const logRows = logs.map((log, idx) => [
      idx + 1,
      fmtDate(log.activityDate),
      log.cropCycle?.name || '—',
      log.cropCycle?.crop?.name || '—',
      ACTIVITY_LABELS[log.activityType] || log.activityType,
      Number(log.cost || 0),
      Number(log.revenue || 0),
      log.notes || '',
    ]);

    const logData = [
      ['LỊCH SỬ HOẠT ĐỘNG CANH TÁC'],
      [],
      logHeaders,
      ...logRows,
      [],
      ['', '', '', '', 'TỔNG CỘNG',
        logs.reduce((s, l) => s + Number(l.cost || 0), 0),
        logs.reduce((s, l) => s + Number(l.revenue || 0), 0),
        '',
      ],
    ];

    const wsLog = XLSX.utils.aoa_to_sheet(logData);
    wsLog['!cols'] = [{ wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
    wsLog['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
    XLSX.utils.book_append_sheet(wb, wsLog, 'Lịch sử canh tác');
  }

  // --- Sheet 4: Khấu hao CapEx & Mã số vùng trồng (PUC) ---
  if (capexAnalysis && capexAnalysis.plotDetails && capexAnalysis.plotDetails.length > 0) {
    const capexHeaders = [
      'STT',
      'Tên Lô / Thửa đất',
      'Diện tích (ha)',
      'Cây trồng',
      'Mã số vùng trồng (PUC)',
      'Thị trường mục tiêu',
      'Năm trồng',
      'Vốn đầu tư ban đầu (CapEx - VNĐ)',
      'Chu kỳ khấu hao (năm)',
      'Số năm đã vận hành',
      'Khấu hao hàng năm (VNĐ)',
      'Đã khấu hao (VNĐ)',
      'Tỷ lệ khấu hao (%)',
      'Giá trị còn lại (VNĐ)',
    ];

    const capexRows = capexAnalysis.plotDetails.map((item, idx) => {
      const p = item.plot || {};
      const c = item.capex || {};
      return [
        idx + 1,
        p.name || `Lô ${idx + 1}`,
        Number(p.area || 1),
        c.cropName || 'Cây dài ngày',
        c.pucCode || 'Chưa cấp',
        c.targetMarket || 'Nội địa',
        c.plantingYear || 2022,
        Number(c.initialCost || 0),
        Number(c.lifespanYears || 15),
        Number(c.yearsActive || 0),
        Number(c.annualDepreciation || 0),
        Number(c.accumulatedDepreciation || 0),
        `${c.percentDepreciated || 0}%`,
        Number(c.remainingValue || 0),
      ];
    });

    const capexData = [
      ['PHÂN TÍCH KHẤU HAO KIẾN THIẾT CƠ BẢN (CapEx) & MÃ SỐ VÙNG TRỒNG (PUC)'],
      [`Tổng vốn CapEx: ${fmtMoney(capexAnalysis.totalCapEx)} | Khấu hao năm: ${fmtMoney(capexAnalysis.totalAnnualDepreciation)} | Thời gian hoàn vốn: ${capexAnalysis.payback?.years > 0 ? `${capexAnalysis.payback.years} năm` : 'Đang tính toán'}`],
      [],
      capexHeaders,
      ...capexRows,
      [],
      [
        '',
        'TỔNG CỘNG',
        '',
        '',
        '',
        '',
        '',
        capexAnalysis.totalCapEx || 0,
        '',
        '',
        capexAnalysis.totalAnnualDepreciation || 0,
        capexAnalysis.totalAccumulatedDepreciation || 0,
        '',
        (capexAnalysis.totalCapEx || 0) - (capexAnalysis.totalAccumulatedDepreciation || 0),
      ],
    ];

    const wsCapex = XLSX.utils.aoa_to_sheet(capexData);
    wsCapex['!cols'] = [
      { wch: 6 },
      { wch: 26 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 12 },
      { wch: 24 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 },
    ];
    wsCapex['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    ];
    XLSX.utils.book_append_sheet(wb, wsCapex, 'Khấu hao CapEx & PUC');
  }

  XLSX.writeFile(wb, `BaoCao_DalatAgri_${new Date().toISOString().slice(0, 10)}.xlsx`);
}


// ===================== WORD (DOCX) EXPORT =====================
export async function exportToWord({ financials, logs, materialUsage, seasonSummary, filterInfo, capexAnalysis }) {
  const docx = await import('docx');
  const { saveAs } = await import('file-saver');

  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
    Header, Footer, PageNumber, NumberFormat,
  } = docx;

  const totalExpense = Number(financials?.totalExpense || 0);
  const totalRevenue = Number(financials?.totalRevenue || 0);
  const netProfit = Number(financials?.netProfit || 0);
  const roi = financials?.roiPercentage || 0;

  // Helper: tạo cell với style
  const makeCell = (text, opts = {}) => {
    const { bold, color, bgColor, width, alignment } = opts;
    return new TableCell({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: String(text),
              bold: bold || false,
              color: color || '0F172A',
              size: 20, // 10pt
              font: 'Arial',
            }),
          ],
          alignment: alignment || AlignmentType.LEFT,
          spacing: { before: 40, after: 40 },
        }),
      ],
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      shading: bgColor ? { type: ShadingType.CLEAR, fill: bgColor } : undefined,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
    });
  };

  // Header row helper
  const makeHeaderRow = (cells) => {
    return new TableRow({
      children: cells.map((text) =>
        makeCell(text, { bold: true, color: 'FFFFFF', bgColor: '107C10' })
      ),
      tableHeader: true,
    });
  };

  // Data row helper
  const makeDataRow = (cells, isAlt = false) => {
    return new TableRow({
      children: cells.map((text) =>
        makeCell(text, { bgColor: isAlt ? 'F0FDF4' : 'FFFFFF' })
      ),
    });
  };

  const sections = [];

  // === TIÊU ĐỀ ===
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'BÁO CÁO KINH TẾ NÔNG HỘ',
          bold: true,
          size: 32, // 16pt
          color: '107C10',
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'DalatAgri - Hệ thống quản lý trang trại thông minh',
          size: 22,
          color: '64748B',
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Ngày xuất báo cáo: ${today()}`,
          size: 20,
          color: '475569',
          font: 'Arial',
        }),
        new TextRun({
          text: `    |    ${filterInfo || 'Tất cả trang trại & mùa vụ'}`,
          size: 20,
          color: '475569',
          font: 'Arial',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  );

  // Đường kẻ ngang
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: '━'.repeat(70), color: '107C10', size: 16 })],
      spacing: { after: 200 },
    }),
  );

  // === I. TỔNG QUAN ===
  sections.push(
    new Paragraph({
      text: 'I. TỔNG QUAN CHI PHÍ & DOANH THU',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 120 },
    }),
  );

  sections.push(
    new Table({
      rows: [
        makeHeaderRow(['Chỉ tiêu', 'Giá trị (VNĐ)', 'Chi tiết']),
        makeDataRow([
          'Tổng chi phí đầu tư',
          fmtMoney(totalExpense),
          `Vật tư: ${fmtMoney(financials?.totalMaterialCost)} | Nhân công: ${fmtMoney(financials?.totalLaborCost)}`,
        ]),
        makeDataRow([
          'Tổng doanh thu',
          fmtMoney(totalRevenue),
          `Sản lượng: ${(financials?.totalHarvestQty || 0).toLocaleString()} kg`,
        ], true),
        makeDataRow([
          'Lợi nhuận ròng',
          fmtMoney(netProfit),
          `ROI: ${roi}%`,
        ]),
        makeDataRow([
          'Tổng lượt ghi nhật ký',
          String(financials?.logsCount || logs?.length || 0),
          `Chăm sóc: ${financials?.careLogsCount || 0} lần | Thu hoạch: ${financials?.harvestLogsCount || 0} đợt`,
        ], true),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  );

  // === II. CƠ CẤU CHI PHÍ ===
  const matCost = Number(financials?.totalMaterialCost || 0);
  const labCost = Number(financials?.totalLaborCost || 0);
  const othCost = Number(financials?.totalOtherCosts || 0);
  const totalCost = matCost + labCost + othCost;
  const pctCalc = (v) => totalCost > 0 ? `${Math.round((v / totalCost) * 100)}%` : '0%';

  sections.push(
    new Paragraph({
      text: 'II. CƠ CẤU CHI PHÍ',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 120 },
    }),
    new Table({
      rows: [
        makeHeaderRow(['Loại chi phí', 'Số tiền (VNĐ)', 'Tỷ lệ (%)']),
        makeDataRow(['Vật tư (Phân, thuốc BVTV)', fmtMoney(matCost), pctCalc(matCost)]),
        makeDataRow(['Nhân công lao động', fmtMoney(labCost), pctCalc(labCost)], true),
        makeDataRow(['Chi phí khác', fmtMoney(othCost), pctCalc(othCost)]),
        new TableRow({
          children: [
            makeCell('TỔNG CỘNG', { bold: true, bgColor: 'DCFCE7' }),
            makeCell(fmtMoney(totalCost), { bold: true, bgColor: 'DCFCE7' }),
            makeCell('100%', { bold: true, bgColor: 'DCFCE7' }),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  );

  // === III. VẬT TƯ TIÊU THỤ ===
  if (materialUsage && materialUsage.length > 0) {
    sections.push(
      new Paragraph({
        text: `III. TỔNG HỢP VẬT TƯ TIÊU THỤ (${materialUsage.length} loại)`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      }),
      new Table({
        rows: [
          makeHeaderRow(['STT', 'Tên vật tư', 'Loại', 'Tổng lượng dùng', 'Tổng chi phí', 'Số lần SD']),
          ...materialUsage.map((item, idx) =>
            makeDataRow([
              String(idx + 1),
              item.name,
              item.type === 'PHAN_BON' ? 'Phân bón' : item.type === 'THUOC_BVTV' ? 'Thuốc BVTV' : item.type,
              `${item.totalQty.toLocaleString()} ${item.unit}`,
              fmtMoney(item.totalCost),
              `${item.count} lần`,
            ], idx % 2 === 1)
          ),
          new TableRow({
            children: [
              makeCell('', { bgColor: 'ECFDF5' }),
              makeCell('', { bgColor: 'ECFDF5' }),
              makeCell('', { bgColor: 'ECFDF5' }),
              makeCell('TỔNG CỘNG', { bold: true, bgColor: 'ECFDF5' }),
              makeCell(fmtMoney(materialUsage.reduce((s, i) => s + i.totalCost, 0)), { bold: true, bgColor: 'ECFDF5' }),
              makeCell('', { bgColor: 'ECFDF5' }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );
  }

  // === IV. LỊCH SỬ HOẠT ĐỘNG ===
  if (logs && logs.length > 0) {
    sections.push(
      new Paragraph({
        text: `IV. LỊCH SỬ HOẠT ĐỘNG CANH TÁC (${logs.length} lượt)`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      }),
      new Table({
        rows: [
          makeHeaderRow(['Ngày', 'Mùa vụ', 'Hoạt động', 'Chi phí', 'Doanh thu', 'Ghi chú']),
          ...logs.map((log, idx) =>
            makeDataRow([
              fmtDate(log.activityDate),
              log.cropCycle?.name || '—',
              ACTIVITY_LABELS[log.activityType] || log.activityType,
              (log.cost || 0) > 0 ? fmtMoney(log.cost) : '—',
              (log.revenue || 0) > 0 ? fmtMoney(log.revenue) : '—',
              log.notes ? (log.notes.length > 40 ? log.notes.slice(0, 40) + '...' : log.notes) : '—',
            ], idx % 2 === 1)
          ),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );
  }

  // === V. KHẤU HAO KIẾN THIẾT CƠ BẢN (CapEx) & MÃ SỐ VÙNG TRỒNG (PUC) ===
  if (capexAnalysis && capexAnalysis.plotDetails && capexAnalysis.plotDetails.length > 0) {
    sections.push(
      new Paragraph({
        text: `V. KHẤU HAO KIẾN THIẾT CƠ BẢN (CapEx) & MÃ SỐ VÙNG TRỒNG (PUC)`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 120 },
      }),
      new Table({
        rows: [
          makeHeaderRow(['Lô / Thửa', 'Cây trồng', 'Mã PUC', 'Vốn CapEx', 'Khấu hao/năm', 'Đã khấu hao (%)', 'Giá trị còn lại']),
          ...capexAnalysis.plotDetails.map((item, idx) => {
            const p = item.plot || {};
            const c = item.capex || {};
            return makeDataRow([
              p.name || `Lô ${idx + 1}`,
              c.cropName || 'Cây dài ngày',
              c.pucCode || 'Chưa cấp',
              fmtMoney(c.initialCost),
              fmtMoney(c.annualDepreciation),
              `${c.percentDepreciated || 0}%`,
              fmtMoney(c.remainingValue),
            ], idx % 2 === 1);
          }),
          new TableRow({
            children: [
              makeCell('TỔNG CỘNG', { bold: true, bgColor: 'ECFDF5' }),
              makeCell('', { bgColor: 'ECFDF5' }),
              makeCell('', { bgColor: 'ECFDF5' }),
              makeCell(fmtMoney(capexAnalysis.totalCapEx), { bold: true, bgColor: 'ECFDF5' }),
              makeCell(fmtMoney(capexAnalysis.totalAnnualDepreciation), { bold: true, bgColor: 'ECFDF5' }),
              makeCell('', { bgColor: 'ECFDF5' }),
              makeCell(fmtMoney((capexAnalysis.totalCapEx || 0) - (capexAnalysis.totalAccumulatedDepreciation || 0)), { bold: true, bgColor: 'ECFDF5' }),
            ],
          }),
        ],
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );
  }

  // === BUILD DOCUMENT ===
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'DalatAgri - Báo cáo kinh tế nông hộ', size: 16, color: '94A3B8', font: 'Arial' }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Trang ', size: 16, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '94A3B8' }),
                  new TextRun({ text: ' / ', size: 16, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '94A3B8' }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `BaoCao_DalatAgri_${new Date().toISOString().slice(0, 10)}.docx`);
}
