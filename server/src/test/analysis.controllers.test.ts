/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

const mockTransaction = jest.fn<(cb: (tx: any) => Promise<any>) => Promise<any>>();
const mockAnalysisCreate = jest.fn<() => Promise<any>>();
const mockAnalysisFindMany = jest.fn<() => Promise<any[]>>();
const mockAnalysisFindUnique = jest.fn<() => Promise<any>>();
const mockAnalysisCount = jest.fn<() => Promise<number>>();
const mockImageCreate = jest.fn<() => Promise<any>>();
const mockAuditLogCreate = jest.fn<() => Promise<any>>();
const mockJimpRead = jest.fn<() => Promise<any>>();
const mockExportExcel = jest.fn<() => Promise<string>>();
const mockExportPdf = jest.fn<() => Promise<string>>();
const mockRequestAIInference = jest.fn<() => Promise<any>>();
const mockCreateAnnotatedResultImage = jest.fn<() => Promise<any>>();
const mockEmitAnalysisUpdated = jest.fn<() => void>();

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    $transaction: mockTransaction,
    analysis: {
      create: mockAnalysisCreate,
      findMany: mockAnalysisFindMany,
      findUnique: mockAnalysisFindUnique,
      count: mockAnalysisCount,
    },
    image: { create: mockImageCreate },
    auditLog: { create: mockAuditLogCreate },
  },
}));

jest.unstable_mockModule('jimp', () => ({
  Jimp: { read: mockJimpRead },
}));

jest.unstable_mockModule('../services/export.service.js', () => ({
  ExportService: {
    generateExcelReport: mockExportExcel,
    generatePdfReport: mockExportPdf,
  },
}));

jest.unstable_mockModule('../services/ai-inference.service.js', () => ({
  requestAIInference: mockRequestAIInference,
}));

jest.unstable_mockModule('../services/image-annotator.service.js', () => ({
  createAnnotatedResultImage: mockCreateAnnotatedResultImage,
}));

jest.unstable_mockModule('../services/socket.service.js', () => ({
  emitAnalysisUpdated: mockEmitAnalysisUpdated,
}));

const { AnalysisController } = await import('../controllers/analysis.controller.js');
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('AnalysisController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis() as unknown as Response['status'],
      json: jest.fn() as unknown as Response['json'],
      get: jest.fn().mockReturnValue('localhost:3000') as any,
    };
    (res as any).protocol = 'http';
  });

  describe('createAnalysis', () => {
    it('should return 201 and create analysis when files are valid', async () => {
      req = {
        body: { location_address: 'Main St 1, Lod' },
        files: {
          beforeImage: [{ path: 'path/to/before.jpg', size: 100, mimetype: 'image/jpeg', originalname: 'b.jpg' }],
          afterImage: [{ path: 'path/to/after.jpg', size: 120, mimetype: 'image/jpeg', originalname: 'a.jpg' }],
        } as any,
        user: { userId: 'user-123', role: 'Inspector' },
        ip: '127.0.0.1',
      };

      mockJimpRead.mockResolvedValue({ bitmap: { width: 800, height: 600 } } as unknown);

      mockRequestAIInference.mockResolvedValue({
        anomalyDetected: false,
        coordinates: null,
      });

      mockCreateAnnotatedResultImage.mockResolvedValue({
        filePath: 'path/to/result.jpg',
        fileSizeBytes: 100,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      });

      mockTransaction.mockImplementation(async (callback: any) => {
        const tx = {
          image: { create: mockImageCreate.mockResolvedValue({ id: 'img-id' }) },
          analysis: {
            create: mockAnalysisCreate.mockResolvedValue({ id: 'analysis-id', status: 'Pending' }),
            update: jest.fn<() => Promise<any>>().mockResolvedValue({ id: 'analysis-id' }),
          },
          auditLog: { create: mockAuditLogCreate.mockResolvedValue({}) },
        };
        return callback(tx);
      });

      await AnalysisController.createAnalysis(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        analysisId: 'analysis-id',
        location_address: 'Main St 1, Lod',
      }));
    });

    it('should return 400 if images are missing', async () => {
      req = { files: {}, body: {} };
      await AnalysisController.createAnalysis(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAnalysisById', () => {
    it('should return 403 if Inspector tries to access another inspector analysis', async () => {
      req = {
        params: { id: 'analys-999' },
        user: { userId: 'inspector-me', role: 'Inspector' },
      };

      mockAnalysisFindUnique.mockResolvedValue({
        id: 'analys-999',
        inspector_id: 'someone-else',
      } as unknown);

      await AnalysisController.getAnalysisById(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
    });

    it('should return 200 for Admin even if not their analysis', async () => {
      req = {
        params: { id: 'analys-999' },
        user: { userId: 'admin-id', role: 'Admin' },
      };

      mockAnalysisFindUnique.mockResolvedValue({
        id: 'analys-999',
        inspector_id: 'someone-else',
      } as unknown);

      await AnalysisController.getAnalysisById(req as any, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});