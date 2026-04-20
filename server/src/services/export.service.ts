import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

interface ImageInfo {
  file_path: string;
}

export interface AnalysisReport {
  id: string;
  created_at: Date;
  status: string;
  anomaly_detected: boolean | null;
  issued_by: { username: string };
  before_image?: ImageInfo | null;
  after_image?: ImageInfo | null;
  result_image?: ImageInfo | null;
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
        anomaly: analysis.anomaly_detected === null ? 'PENDING' : analysis.anomaly_detected ? 'YES' : 'NO',
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
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `report_${Date.now()}.pdf`;
      const reportsDir = path.join(process.cwd(), 'reports');
      const filePath = path.join(reportsDir, fileName);

      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fillColor('#203764').fontSize(22).text('Construction Detection Official Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fillColor('#444444').fontSize(10).text(`Generated at: ${new Date().toLocaleString('en-US')}`, { align: 'right' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
      doc.moveDown(2);

      const addImageToDoc = (imageObj: ImageInfo | null | undefined, label: string) => {
        if (imageObj?.file_path) {
          try {
            const fullPath = path.join(process.cwd(), imageObj.file_path);
            if (fs.existsSync(fullPath)) {
              doc.fillColor('#64748b').fontSize(10).text(label);
              doc.image(fullPath, { width: 200 });
              doc.moveDown(1);
            }
          } catch (err) {
            console.warn(`Could not add image: ${label}`, err);
          }
        }
      };

      analyses.forEach((item, index) => {
        if (index > 0) doc.addPage();

        doc.fillColor('#203764').fontSize(14).text(`Record #${index + 1}`, { underline: true });
        doc.moveDown(0.5);

        doc.fillColor('black').fontSize(10);
        doc.text(`ID: ${item.id}`);
        doc.text(`Created: ${item.created_at.toLocaleString('en-GB')}`);
        doc.text(`Inspector: ${item.issued_by?.username || 'Unknown'}`);
        doc.text(`Current Status: ${item.status}`);

        const anomalyStatus = item.anomaly_detected === null ? 'PENDING' : item.anomaly_detected ? 'YES' : 'NO';
        const anomalyColor = item.anomaly_detected ? '#FF0000' : '#008000';

        doc.text('Anomaly Detected: ', { continued: true }).fillColor(anomalyColor).text(anomalyStatus);
        doc.moveDown(2);

        addImageToDoc(item.before_image, "1. Before Construction:");
        addImageToDoc(item.after_image, "2. After Construction:");
        doc.fillColor('#2563eb');
        addImageToDoc(item.result_image, "3. AI Analysis Result (Annotated):");

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#EEEEEE').stroke();
      });

      doc.fontSize(8).fillColor('#AAAAAA').text('End of Report - Illegal Construction Detection System', 0, 750, { align: 'center', width: 600 });

      doc.end();
      stream.on('finish', () => resolve(fileName));
      stream.on('error', (err) => reject(err));
    });
  }
}