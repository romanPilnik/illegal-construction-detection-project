import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { ExportService } from '../services/export.service.js';
import { exportAnalysesSchema } from '../validation/analysis.validation.js';
import type { AnalysisReport } from '../services/export.service.ts';


/**
 * Controller for handling data export operations.
 * Now returns a download link instead of raw binary data.
 */
export const exportAnalyses = async (req: Request, res: Response) => {
  try {
    // 1. Validate the request body using Zod
    const parsed = exportAnalysesSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { format, start_date, end_date } = parsed.data.body;

    // 2. Fetch data from Prisma
    const analyses = await prisma.analysis.findMany({
      where: {
        created_at: {
          ...(start_date && { gte: new Date(start_date) }),
          ...(end_date && { lte: new Date(end_date) }),
        },
      },
      include: {
        issued_by: { select: { username: true } },
        before_image: { select: { file_path: true } }, // Optimized to fetch only needed fields
      },
      orderBy: { created_at: 'desc' },
    });

    // 3. Handle Excel Export
    if (format === 'EXCEL') {
      // Call the service that saves the file and returns the filename
      const fileName = await ExportService.generateExcelReport(
        analyses as unknown as AnalysisReport[]);

      // Construct the full URL for the client
      const protocol = req.protocol; // http or https
      const host = req.get('host');  // e.g., localhost:5001
      const downloadUrl = `${protocol}://${host}/reports/${fileName}`;

      console.log(`[Export] Link generated: ${downloadUrl}`);

      // Return JSON with the link instead of the binary buffer
      return res.status(200).json({
        message: 'Report generated successfully',
        downloadUrl: downloadUrl,
        format: 'EXCEL',
        recordCount: analyses.length
      });
    }

    // 4. Placeholder for PDF
    if (format === 'PDF') {
      const fileName = await ExportService.generatePdfReport(
        analyses as unknown as AnalysisReport[]
      );
      const protocol = req.protocol;
      const host = req.get('host');
      const downloadUrl = `${protocol}://${host}/reports/${fileName}`;

      console.log(`[Export] PDF link successfully generated: ${downloadUrl}`);

      return res.status(200).json({
        message: 'PDF report generated successfully.',
        downloadUrl: downloadUrl,
        format: 'PDF',
        recordCount: analyses.length
      });
    }

    return res.status(400).json({ error: 'Unsupported format' });

  } catch (error) {
    console.error('Export Controller Error:', error);
    return res.status(500).json({ error: 'Failed to process export request.' });
  }
};