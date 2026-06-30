import express from 'express';
import { verify } from '../middleware/verify-token';
import { verifyAdmin } from '../middleware/verify-admin';
import {
    restrictUser,
    unrestrictUser,
    getAllUsers,
    getUserById,
    getRestrictedUsers
} from '../controllers/user.admin.controller';

const router = express.Router();

// جميع المسارات تتطلب أدمن
router.use(verify, verifyAdmin);

// عرض جميع المستخدمين
router.get('/users', getAllUsers);

// عرض المستخدمين المقيدين
router.get('/users/restricted', getRestrictedUsers);

// عرض مستخدم معين
router.get('/users/:id', getUserById);

// تقييد مستخدم (مع تقييد جميع سياراته)
router.put('/users/:id/restrict', restrictUser);

// إزالة التقييد عن مستخدم (مع إعادة سياراته للانتظار)
router.put('/users/:id/unrestrict', unrestrictUser);

export default router;