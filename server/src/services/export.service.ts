import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export interface AnalysisReport {
  id: string;
  created_at: Date;
  status: string;
  anomaly_detected: boolean | null;
  issued_by: { username: string };
  before_image?: { file_path: string } | null;
}

export class ExportService {
  /**
   * Generates an Excel report and saves it to the reports directory.
   */
  static async generateExcelReport(
    analyses: AnalysisReport[]
  ): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Detections Report');

    worksheet.columns = [
      { header: 'Analysis ID', key: 'id', width: 35 },
      { header: 'Created At', key: 'date', width: 25 },
      { header: 'Inspector Name', key: 'inspector', width: 20 },
      { header: 'Current Status', key: 'status', width: 15 },
      { header: 'Anomaly Detected', key: 'anomaly', width: 18 },
      { header: 'Before Image Path', key: 'path', width: 45 },
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
        path: analysis.before_image?.file_path || 'N/A',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `report_${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);
    return fileName;
  }

  /**
   * Generates a PDF report and saves it to the reports directory.
   */
  static async generatePdfReport(analyses: AnalysisReport[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `report_${Date.now()}.pdf`;
      const reportsDir = path.join(process.cwd(), 'reports');
      const filePath = path.join(reportsDir, fileName);

      if (!fs.existsSync(reportsDir))
        fs.mkdirSync(reportsDir, { recursive: true });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- PDF Content Design ---

      // Title Section
      doc
        .fillColor('#203764')
        .fontSize(22)
        .text('Construction Detection Official Report', { align: 'center' });
      doc.moveDown(0.5);
      doc
        .fillColor('#444444')
        .fontSize(10)
        .text(`Generated at: ${new Date().toLocaleString('en-US')}`, {
          align: 'right',
        });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#CCCCCC').stroke();
      doc.moveDown(2);

      // Data Rows
      analyses.forEach((item, index) => {
        // Entry Header
        doc
          .fillColor('#203764')
          .fontSize(14)
          .text(`Record #${index + 1}`, { underline: true });
        doc.moveDown(0.5);

        // Details
        doc.fillColor('black').fontSize(10);
        doc.text(`ID: ${item.id}`);
        doc.text(`Created: ${item.created_at.toLocaleString('en-GB')}`);
        doc.text(`Inspector: ${item.issued_by?.username || 'Unknown'}`);
        doc.text(`Current Status: ${item.status}`);

        // Dynamic Anomaly Styling
        const anomalyStatus =
          item.anomaly_detected === null
            ? 'PENDING'
            : item.anomaly_detected
              ? 'YES'
              : 'NO';
        const anomalyColor = item.anomaly_detected
          ? '#FF0000'
          : item.anomaly_detected === false
            ? '#008000'
            : '#808080';

        doc
          .text('Anomaly Detected: ', { continued: true })
          .fillColor(anomalyColor)
          .text(anomalyStatus);

        doc.moveDown(1);

        // --- הוספת התמונה ל-PDF כאן ---
        if (item.before_image?.file_path) {
          try {
            const fullPath = path.join(
              process.cwd(),
              item.before_image.file_path
            );
            if (fs.existsSync(fullPath)) {
              doc.image(fullPath, { width: 200 }); // הוספת התמונה לדו"ח
              doc.moveDown();
            }
          } catch (err) {
            console.warn(`Could not load image for PDF: ${item.id}`, err);
          }
        }
        // ------------------------------

        doc.moveDown(0.5);
        doc
          .moveTo(50, doc.y)
          .lineTo(550, doc.y)
          .strokeColor('#EEEEEE')
          .stroke();
        doc.moveDown(1.5);

        // Page break logic
        if (doc.y > 650) doc.addPage();
      });

      // Footer
      doc
        .fontSize(8)
        .fillColor('#AAAAAA')
        .text('End of Report - Illegal Construction Detection System', 0, 750, {
          align: 'center',
          width: 600,
        });

      doc.end();

      stream.on('finish', () => resolve(fileName));
      stream.on('error', (err) => reject(err));
    });
  }
}
