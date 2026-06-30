import express from 'express';
import { verify } from '../middleware/verify-token';
import { verifyAdmin } from '../middleware/verify-admin';
import upload from '../middleware/upload';
import {
    // User controllers
    createReport,
    getUserReports,
    getUserReportById,
    cancelReport,
    // Admin controllers
    getAllReports,
    getReportByIdAdmin,
    updateReportStatus,
    deleteReportAdmin,
    getReportStats
} from '../controllers/report.controller';

const router = express.Router();

// ==================== USER ROUTES ====================
router.post(
    '/',
    verify,
    upload.array('attachments', 3),
    createReport
);

router.get(
    '/my-reports',
    verify,
    getUserReports
);



router.delete(
    '/:id',
    verify,
    cancelReport
);

// ==================== ADMIN ROUTES ====================
router.get(
    '/admin/stats',
    verify,
    verifyAdmin,
    getReportStats
);

router.get(
    '/admin',
    verify,
    verifyAdmin,
    getAllReports
);

router.get(
    '/admin/:id',
    verify,
    verifyAdmin,
    getReportByIdAdmin
);

router.put(
    '/admin/:id',
    verify,
    verifyAdmin,
    updateReportStatus
);

router.delete(
    '/admin/:id',
    verify,
    verifyAdmin,
    deleteReportAdmin
);

router.get(
    '/:id',
    verify,
    getUserReportById
);


export default router;