// routes/favorite.routes.ts
import express from 'express';
import { verify } from '../middleware/verify-token';
import {
    addFavorite,
    removeFavorite,
    getFavorites,
    checkFavorite
} from '../controllers/favorite.controller';

const router = express.Router();

// جميع المسارات تحتاج توثيق
router.use(verify);

// إضافة سيارة للمفضلة
router.post('/', addFavorite);

// حذف سيارة من المفضلة
router.delete('/:carId', removeFavorite);

// جلب قائمة المفضلة (مع فلتر اختياري)
router.get('/', getFavorites);

// التحقق من حالة المفضلة لسيارة معينة
router.get('/check/:carId', checkFavorite);

export default router;