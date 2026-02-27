import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const createAnalysis = async (req: Request, res: Response) => {
    console.log('=== createAnalysis hit ===');
    console.log('req.files:', req.files);
    console.log('req.user:', req.user);

    try {
        const files = req.files as { [fieldnames: string]: Express.Multer.File[] };
        const beforeFile = files['beforeImage']?.[0];
        const afterFile = files['afterImage']?.[0];

        if (!beforeFile || !afterFile) {
            res.status(400).json({ error: 'Missing images. Both before and after images are required.' });
            return;
        }

        const inspectorId = req.user?.userId;
        if (!inspectorId) {
            res.status(401).json({ error: 'Unauthorized: Inspector ID not found' });
            return;
        }

        const analysis = await prisma.$transaction(async (tx) => {
            const beforeImg = await tx.image.create({
                data: {
                    file_path: beforeFile.path,
                    file_size_bytes: beforeFile.size,
                    mime_type: beforeFile.mimetype,
                    width: 0,
                    height: 0
                }
            });

            const afterImg = await tx.image.create({
                data: {
                    file_path: afterFile.path,
                    file_size_bytes: afterFile.size,
                    mime_type: afterFile.mimetype,
                    width: 0,
                    height: 0
                }
            });

            const newAnalysis = await tx.analysis.create({
                data: {
                    inspector_id: inspectorId,
                    before_image_id: beforeImg.id,
                    after_image_id: afterImg.id,
                    status: 'Pending'
                }
            });

            await tx.auditLog.create({
                data: {
                    user_id: inspectorId,
                    action: 'UPLOAD_IMAGES',
                    ip_address: req.ip || 'unknown',
                    status: 'Success',
                    details: `Inspector uploaded images for analysis. Files: ${beforeFile.originalname}, ${afterFile.originalname}`,
                    metadata: { analysisId: newAnalysis.id }
                }
            });

            return newAnalysis;
        });

        console.log(`
      📸 New Upload Success!
      -----------------------
      Inspector ID: ${inspectorId}
      Analysis ID:  ${analysis.id}
      Status:       ${analysis.status}
      Timestamp:    ${new Date().toLocaleString()}
      -----------------------
    `);

        res.status(201).json({
            message: 'Analysis created successfully and sent to processing',
            analysisId: analysis.id
        });

    } catch (error) {
        console.error('Error creating analysis:', error);
        res.status(500).json({ error: 'Internal server error during analysis creation' });
    }
};