import express from 'express';
import { verify } from '../middleware/verify-token';
import { verifyAdmin } from '../middleware/verify-admin';
import upload from '../middleware/upload';
import {
    addCar,
    deleteCar,
    addReview,
    getCarById,
    getRentalCarListings,
    getCarForSaleListings,
    purchaseCar,
    getSoldCars,
    getUserPurchases,
    getOwnerCars,
    // دوال جديدة
    approveCar,
    rejectCar,
    restrictCar,
    unrestrictCar,
    getPendingCars,
    compareCars
} from '../controllers/car.controller';

const router = express.Router();

// ==================== مسارات المستخدم ====================
router.post('/', verify, upload.array('images', 10), addCar);
router.delete('/', verify, deleteCar);
router.post('/addreview', verify, addReview);
router.post('/purchase', verify, purchaseCar);
router.get('/getmysoldcars', verify, getSoldCars);
router.get('/getmypurchases', verify, getUserPurchases);
router.get('/my-cars', verify, getOwnerCars);

// ==================== مسارات عامة ====================
router.post('/details', getCarById);
router.get('/rental', getRentalCarListings);
router.get('/sale', getCarForSaleListings);

router.post('/compare', compareCars);

// ==================== مسارات الأدمن ====================
// إدارة السيارات المعلقة
router.get('/admin/pending', verify, verifyAdmin, getPendingCars);

// الموافقة على سيارة
router.put('/admin/:id/approve', verify, verifyAdmin, approveCar);

// رفض سيارة
router.put('/admin/:id/reject', verify, verifyAdmin, rejectCar);

// تقييد سيارة
router.put('/admin/:id/restrict', verify, verifyAdmin, restrictCar);

// إزالة التقييد عن سيارة
router.put('/admin/:id/unrestrict', verify, verifyAdmin, unrestrictCar);

export default router;