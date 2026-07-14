import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { Jimp } from 'jimp';
import type { AnalysisStatus } from '../generated/prisma/client.js';

interface ImageInfo {
  file_path: string;
}

export interface AnalysisReport {
  id: string;
  created_at: Date;
  status: AnalysisStatus;
  anomaly_detected: boolean | null;
  issued_by: { username: string };
  before_image: ImageInfo;
  after_image: ImageInfo;
  result_image: ImageInfo | null;
}

type PdfDoc = InstanceType<typeof PDFDocument>;

function pageBottomY(doc: PdfDoc): number {
  return doc.page.height - doc.page.margins.bottom;
}

function pageInnerWidth(doc: PdfDoc): number {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

/** Start a new page if fewer than `minHeight` pts remain above the bottom margin. */
function ensureVerticalSpace(doc: PdfDoc, minHeight: number): void {
  if (doc.y + minHeight > pageBottomY(doc)) {
    doc.addPage();
  }
}

const IMAGE_TAIL_GAP = 14;

async function addImageToDoc(
  doc: PdfDoc,
  imageObj: ImageInfo | null | undefined,
  label: string,
  labelColor = '#64748b',
): Promise<void> {
  if (!imageObj?.file_path) return;

  const fullPath = path.join(process.cwd(), imageObj.file_path);
  if (!fs.existsSync(fullPath)) return;

  let iw = 800;
  let ih = 600;
  try {
    const img = await Jimp.read(fullPath);
    iw = Math.max(1, img.bitmap.width);
    ih = Math.max(1, img.bitmap.height);
  } catch {
    console.warn(`Could not read image dimensions: ${label}`);
  }

  const marginLeft = doc.page.margins.left;
  const maxW = pageInnerWidth(doc);
  const bottom = pageBottomY(doc);
  const labelBlock = 18;

  ensureVerticalSpace(doc, labelBlock + 48);
  doc.fillColor(labelColor).fontSize(10).text(label);

  let availableH = bottom - doc.y - IMAGE_TAIL_GAP;
  if (availableH < 72) {
    doc.addPage();
    availableH = bottom - doc.y - IMAGE_TAIL_GAP;
  }

  let scale = Math.min(maxW / iw, availableH / ih, 1);
  let drawW = Math.max(1, Math.floor(iw * scale));
  let drawH = Math.max(1, Math.floor(ih * scale));

  if (doc.y + drawH > bottom - IMAGE_TAIL_GAP) {
    scale *= (bottom - doc.y - IMAGE_TAIL_GAP) / drawH;
    drawW = Math.max(1, Math.floor(iw * scale));
    drawH = Math.max(1, Math.floor(ih * scale));
  }

  if (drawH > availableH || drawW > maxW) {
    doc.addPage();
    const fullH = bottom - doc.page.margins.top - IMAGE_TAIL_GAP;
    const scale2 = Math.min(maxW / iw, fullH / ih, 1);
    drawW = Math.max(1, Math.floor(iw * scale2));
    drawH = Math.max(1, Math.floor(ih * scale2));
  }

  try {
    const x = marginLeft + Math.max(0, (maxW - drawW) / 2);
    const y = doc.y;
    doc.image(fullPath, x, y, { width: drawW, height: drawH });
    doc.y = y + drawH + IMAGE_TAIL_GAP;
    doc.x = marginLeft;
  } catch (err) {
    console.warn(`Could not embed image: ${label}`, err);
  }
}

export class ExportService {
  static async generateExcelReport(analyses: AnalysisReport[]): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detections Report');

    worksheet.columns = [
      { header: 'Analysis ID', key: 'id', width: 35 },
      { header: 'Created At', key: 'date', width: 25 },
      { header: 'Inspector Name', key: 'inspector', width: 20 },
      { header: 'Current Status', key: 'status', width: 15 },
      { header: 'Anomaly Detected', key: 'anomaly', width: 18 },
      { header: 'Before Image Path', key: 'beforePath', width: 45 },
      { header: 'After Image Path', key: 'afterPath', width: 45 },
      { header: 'Result Image Path', key: 'resultPath', width: 45 },
    ];

    analyses.forEach((analysis) => {
      worksheet.addRow({
        id: analysis.id,
        date: analysis.created_at.toLocaleString('en-US'),
        inspector: analysis.issued_by?.username || 'Unknown',
        status: analysis.status,
        anomaly:
          analysis.anomaly_detected === null
            ? 'PENDING'
            : analysis.anomaly_detected
              ? 'YES'
              : 'NO',
        beforePath: analysis.before_image?.file_path || 'N/A',
        afterPath: analysis.after_image?.file_path || 'N/A',
        resultPath: analysis.result_image?.file_path || 'N/A',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `report_${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }

  static async generatePdfReport(analyses: AnalysisReport[]): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `report_${Date.now()}.pdf`;
    const reportsDir = path.join(process.cwd(), 'reports');
    const filePath = path.join(reportsDir, fileName);

    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc
      .fillColor('#203764')
      .fontSize(22)
      .text('Construction Detection Official Report', { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fillColor('#444444')
      .fontSize(10)
      .text(`Generated at: ${new Date().toLocaleString('en-US')}`, { align: 'right' });
    doc.moveDown();
    const lineY = doc.y;
    doc
      .moveTo(doc.page.margins.left, lineY)
      .lineTo(doc.page.width - doc.page.margins.right, lineY)
      .strokeColor('#CCCCCC')
      .stroke();
    doc.moveDown(2);

    if (analyses.length > 0) {
      doc.addPage();
    }

    for (let index = 0; index < analyses.length; index++) {
      const item = analyses[index];
      if (index > 0) doc.addPage();

      doc.fillColor('#203764').fontSize(14).text(`Record #${index + 1}`, { underline: true });
      doc.moveDown(0.5);

      doc.fillColor('black').fontSize(10);
      const textBlock = 5 * 14 + 40;
      ensureVerticalSpace(doc, textBlock);

      doc.text(`ID: ${item.id}`);
      doc.text(`Created: ${item.created_at.toLocaleString('en-GB')}`);
      doc.text(`Inspector: ${item.issued_by?.username || 'Unknown'}`);
      doc.text(`Current Status: ${item.status}`);

      const anomalyStatus =
        item.anomaly_detected === null
          ? 'PENDING'
          : item.anomaly_detected
            ? 'YES'
            : 'NO';
      const anomalyColor = item.anomaly_detected ? '#FF0000' : '#008000';

      doc
        .text('Anomaly Detected: ', { continued: true })
        .fillColor(anomalyColor)
        .text(anomalyStatus);
      doc.moveDown(2);

      await addImageToDoc(doc, item.before_image, '1. Before Construction:');
      await addImageToDoc(doc, item.after_image, '2. After Construction:');
      await addImageToDoc(
        doc,
        item.result_image,
        '3. AI Analysis Result (Annotated):',
        '#2563eb',
      );

      doc.moveDown();
      ensureVerticalSpace(doc, 20);
      doc
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor('#EEEEEE')
        .stroke();
    }

    doc.moveDown(1);
    ensureVerticalSpace(doc, 28);
    doc
      .fontSize(8)
      .fillColor('#AAAAAA')
      .text('End of Report — Illegal Construction Detection System', {
        align: 'center',
      });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return fileName;
  }
}
