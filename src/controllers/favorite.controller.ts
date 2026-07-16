// controllers/favorite.controller.ts
import { Request, Response } from 'express';
import Favorite from '../models/Favorite';
import Car from '../models/Car';
import { Types } from 'mongoose';

// إضافة سيارة للمفضلة
export const addFavorite = async (req: Request, res: Response) => {
    try {
        const userId = req.userId; // من middleware verify
        const { carId } = req.body;

        if (!carId) {
            return res.status(400).json({
                success: false,
                message: 'Car ID is required'
            });
        }

        // التحقق من وجود السيارة
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // التحقق من حالة السيارة (فقط المapproved والمقيدة)
        if (car.status === 'pending' || car.status === 'rejected') {
            return res.status(400).json({
                success: false,
                message: 'Cannot add this car to favorites'
            });
        }

        // إضافة للمفضلة
        const favorite = new Favorite({
            user: userId,
            car: carId
        });

        await favorite.save();

        res.status(201).json({
            success: true,
            message: 'Car added to favorites successfully',
            data: favorite
        });

    } catch (error: any) {
        // خطأ التكرار
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Car already in favorites'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// حذف سيارة من المفضلة
export const removeFavorite = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { carId } = req.params;

        const favorite = await Favorite.findOneAndDelete({
            user: userId,
            car: carId
        });

        if (!favorite) {
            return res.status(404).json({
                success: false,
                message: 'Favorite not found'
            });
        }

        res.json({
            success: true,
            message: 'Car removed from favorites successfully'
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// الحصول على قائمة المفضلة للمستخدم
export const getFavorites = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { purpose } = req.query; // فلتر حسب purpose (rent أو sale)

        // بناء استعلام الفلتر
        let filter: any = { user: userId };

        if (purpose) {
            // أولاً نجلب السيارات المفضلة ثم نفلترها حسب الغرض
            const favorites = await Favorite.find({ user: userId })
                .populate({
                    path: 'car',
                    populate: [
                        { path: 'owner', select: 'name email' }
                    ]
                });

            let cars = favorites.map(fav => fav.car);

            // فلتر حسب الغرض
            if (purpose === 'rent' || purpose === 'sale') {
                cars = cars.filter((car: any) => car.purpose === purpose);
            }

            return res.json({
                success: true,
                count: cars.length,
                data: cars
            });
        }

        // جلب كل المفضلة مع بيانات السيارة والمالك
        const favorites = await Favorite.find(filter)
            .populate({
                path: 'car',
                populate: [
                    { path: 'owner', select: 'name email avatarFilename' }
                ]
            })
            .sort({ createdAt: -1 }); // الأحدث أولاً

        // استخراج السيارات فقط
        const cars = favorites.map(fav => fav.car);

        res.json({
            success: true,
            count: cars.length,
            data: cars
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// التحقق إذا كانت السيارة في المفضلة
export const checkFavorite = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { carId } = req.params;

        const favorite = await Favorite.findOne({
            user: userId,
            car: carId
        });

        res.json({
            success: true,
            isFavorite: !!favorite
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};