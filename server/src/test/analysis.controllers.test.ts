/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import type { Request, Response } from 'express';

const mockTransaction = jest.fn<(cb: (tx: any) => Promise<any>) => Promise<any>>();
const mockAnalysisCreate = jest.fn<() => Promise<any>>();
const mockAnalysisFindMany = jest.fn<() => Promise<any[]>>();
const mockAnalysisFindUnique = jest.fn<() => Promise<any>>();
const mockAnalysisCount = jest.fn<() => Promise<number>>();
const mockAnalysisUpdate = jest.fn<() => Promise<any>>();
const mockImageCreate = jest.fn<() => Promise<any>>();
const mockAuditLogCreate = jest.fn<() => Promise<any>>();
const mockAuditLogFindFirst = jest.fn<() => Promise<any>>();
const mockJimpRead = jest.fn<() => Promise<any>>();
const mockExportExcel = jest.fn<() => Promise<string>>();
const mockExportPdf = jest.fn<() => Promise<string>>();
const mockRequestAIInference = jest.fn<() => Promise<any>>();
const mockCreateAnnotatedResultImage = jest.fn<() => Promise<any>>();
const mockEmitAnalysisUpdated = jest.fn<() => void>();
const mockUploadImageAsset = jest.fn<() => Promise<any>>();
const mockSendAnalysisCompleteEmail = jest.fn<() => Promise<void>>();
const mockUserFindUnique = jest.fn<() => Promise<any>>();

jest.unstable_mockModule('../lib/prisma.js', () => ({
  prisma: {
    $transaction: mockTransaction,
    analysis: {
      create: mockAnalysisCreate,
      findMany: mockAnalysisFindMany,
      findUnique: mockAnalysisFindUnique,
      count: mockAnalysisCount,
      update: mockAnalysisUpdate,
    },
    image: { create: mockImageCreate },
    auditLog: {
      create: mockAuditLogCreate,
      findFirst: mockAuditLogFindFirst,
    },
    user: { findUnique: mockUserFindUnique },
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

jest.unstable_mockModule('../services/asset-storage.service.js', () => ({
  uploadImageAsset: mockUploadImageAsset,
}));

jest.unstable_mockModule('../services/email.service.js', () => ({
  sendAnalysisCompleteEmail: mockSendAnalysisCompleteEmail,
}));

const { AnalysisController, processAnalysisInBackground } = await import(
  '../controllers/analysis.controller.js'
);
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
        body: {
          request_title: 'Roof extension check',
        },
        files: {
          beforeImage: [{ buffer: Buffer.from('before-image'), size: 100, mimetype: 'image/jpeg', originalname: 'b.jpg' }],
          afterImage: [{ buffer: Buffer.from('after-image'), size: 120, mimetype: 'image/jpeg', originalname: 'a.jpg' }],
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
        buffer: Buffer.from('result-image'),
        fileName: 'result.jpg',
        fileSizeBytes: 12,
        mimeType: 'image/jpeg',
        width: 800,
        height: 600,
      });
      mockUploadImageAsset.mockResolvedValue({
        filePath: 'https://example.s3.amazonaws.com/uploads/result/result.jpg',
        fileSizeBytes: 12,
        mimeType: 'image/jpeg',
      });

      mockTransaction.mockImplementation(async (callback: any) => {
        const tx = {
          image: { create: mockImageCreate.mockResolvedValue({ id: 'img-id' }) },
          analysis: {
            create: mockAnalysisCreate.mockResolvedValue({
              id: 'analysis-id',
              status: 'Pending',
              request_title: 'Roof extension check',
            }),
            update: jest.fn<() => Promise<any>>().mockResolvedValue({
              id: 'analysis-id',
              request_title: 'Roof extension check',
            }),
          },
          auditLog: { create: mockAuditLogCreate.mockResolvedValue({}) },
        };
        return callback(tx);
      });

      mockUserFindUnique.mockResolvedValue({
        email: 'inspector@test.com',
        username: 'inspector',
      });

      await AnalysisController.createAnalysis(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        analysisId: 'analysis-id',
        request_title: 'Roof extension check',
        data: { id: 'analysis-id' },
      }));
      expect(mockAnalysisCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          request_title: 'Roof extension check',
        }),
      });
    });

    it('should return 400 if images are missing', async () => {
      req = { files: {}, body: {} };
      await AnalysisController.createAnalysis(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when an uploaded file cannot be decoded as an image', async () => {
      req = {
        body: { request_title: 'Invalid image' },
        files: {
          beforeImage: [
            {
              buffer: Buffer.from('not-an-image'),
              mimetype: 'image/jpeg',
              originalname: 'before.jpg',
            },
          ],
          afterImage: [
            {
              buffer: Buffer.from('not-an-image'),
              mimetype: 'image/jpeg',
              originalname: 'after.jpg',
            },
          ],
        } as any,
        user: { userId: 'user-123', role: 'Inspector' },
      };
      mockJimpRead.mockRejectedValue(new Error('decode failed'));

      await AnalysisController.createAnalysis(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'One or both uploaded files are not valid supported images.',
      });
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
      expect(res.json).toHaveBeenCalledWith({
        data: expect.not.objectContaining({
          inspector_id: expect.anything(),
        }),
      });
    });

    it('returns the sanitized recorded reason for a failed analysis', async () => {
      req = {
        params: { id: 'analysis-id' },
        user: { userId: 'admin-id', role: 'Admin' },
      };
      mockAnalysisFindUnique.mockResolvedValue({
        id: 'analysis-id',
        inspector_id: 'inspector-id',
        status: 'Failed',
        created_at: new Date(),
        request_title: 'Inspection',
        anomaly_detected: null,
      });
      mockAuditLogFindFirst.mockResolvedValue({
        metadata: {
          analysisId: 'analysis-id',
          publicReason: 'Analysis timed out while processing. Please try again.',
        },
      });

      await AnalysisController.getAnalysisById(req as any, res as Response);

      expect(res.json).toHaveBeenCalledWith({
        data: expect.objectContaining({
          failure_reason:
            'Analysis timed out while processing. Please try again.',
        }),
      });
    });
  });

  describe('getAnalyses', () => {
    it('selects only the fields used by the list client', async () => {
      req = {
        query: { page: 1, limit: 10, time_zone: 'Asia/Jerusalem' } as any,
        user: { userId: 'admin-id', role: 'Admin' },
      };
      mockAnalysisCount.mockResolvedValue(1);
      mockAnalysisFindMany.mockResolvedValue([
        {
          id: 'analysis-id',
          status: 'Completed',
          created_at: new Date(),
          anomaly_detected: false,
        },
      ]);

      await AnalysisController.getAnalyses(req as Request, res as Response);

      expect(mockAnalysisFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            status: true,
            created_at: true,
            request_title: true,
            anomaly_detected: true,
          },
        })
      );
    });
  });

  describe('background processing error isolation', () => {
    const payload = {
      analysisId: 'analysis-id',
      inspectorId: 'inspector-id',
      beforeImageBuffer: Buffer.from('before'),
      beforeImageName: 'before.jpg',
      afterImageBuffer: Buffer.from('after'),
      afterImageName: 'after.jpg',
      requesterIp: '127.0.0.1',
    };

    const arrangeSuccessfulProcessing = () => {
      mockEmitAnalysisUpdated.mockImplementation(() => undefined);
      mockRequestAIInference.mockResolvedValue({
        anomalyDetected: false,
        coordinates: null,
      });
      mockCreateAnnotatedResultImage.mockResolvedValue({
        buffer: Buffer.from('result'),
        fileName: 'result.jpg',
        mimeType: 'image/jpeg',
        width: 10,
        height: 10,
      });
      mockUploadImageAsset.mockResolvedValue({
        filePath: 'uploads/result.jpg',
        fileSizeBytes: 6,
        mimeType: 'image/jpeg',
      });
      mockAnalysisUpdate.mockResolvedValue({
        id: 'analysis-id',
        request_title: 'Inspection',
      });
      mockTransaction.mockImplementation(async (callback: any) =>
        callback({
          image: {
            create: mockImageCreate.mockResolvedValue({ id: 'result-image' }),
          },
          analysis: { update: mockAnalysisUpdate },
        })
      );
      mockUserFindUnique.mockResolvedValue(null);
    };

    it('keeps a completed result when its audit write fails', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      arrangeSuccessfulProcessing();
      mockAuditLogCreate.mockRejectedValue(new Error('audit unavailable'));

      await processAnalysisInBackground(payload);

      expect(mockAnalysisUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Completed' }),
        })
      );
      expect(mockAnalysisUpdate).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Failed' }),
        })
      );
      consoleError.mockRestore();
    });

    it('keeps a completed result when its socket notification fails', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      arrangeSuccessfulProcessing();
      mockAuditLogCreate.mockResolvedValue({});
      mockEmitAnalysisUpdated.mockImplementation(() => {
        throw new Error('socket unavailable');
      });

      await expect(processAnalysisInBackground(payload)).resolves.toBeUndefined();

      expect(mockAnalysisUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Completed' }),
        })
      );
      consoleError.mockRestore();
    });

    it('persists failure even when failure auditing is unavailable', async () => {
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockRequestAIInference.mockRejectedValue(
        new Error('AI service request timed out after 100ms')
      );
      mockAnalysisUpdate.mockResolvedValue({ id: 'analysis-id' });
      mockAuditLogCreate.mockRejectedValue(new Error('audit unavailable'));

      await expect(processAnalysisInBackground(payload)).resolves.toBeUndefined();

      expect(mockAnalysisUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'Failed' }),
        })
      );
      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            publicReason: expect.stringContaining('timed out'),
          }),
        }),
      });
      consoleError.mockRestore();
    });
  });

  describe('exportByDateRange', () => {
    it('exports completed analyses only', async () => {
      req = {
        body: {
          format: 'PDF',
          start_date: '2026-07-14',
          end_date: '2026-07-14',
          time_zone: 'Asia/Jerusalem',
        },
        user: { userId: 'admin-id', role: 'Admin' },
        protocol: 'http',
        get: jest.fn().mockReturnValue('localhost:5001') as any,
      };
      mockAnalysisFindMany.mockResolvedValue([
        { id: 'analysis-id', status: 'Completed' },
      ]);
      mockExportPdf.mockResolvedValue('report.pdf');

      await AnalysisController.exportByDateRange(
        req as Request,
        res as Response
      );

      expect(mockAnalysisFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'Completed' }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns a business error when no completed analyses match', async () => {
      req = {
        body: { format: 'EXCEL', time_zone: 'Asia/Jerusalem' },
        user: { userId: 'admin-id', role: 'Admin' },
      };
      mockAnalysisFindMany.mockResolvedValue([]);

      await AnalysisController.exportByDateRange(
        req as Request,
        res as Response
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No completed analyses match the selected date range',
      });
      expect(mockExportExcel).not.toHaveBeenCalled();
    });
  });
});
