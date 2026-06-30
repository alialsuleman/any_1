import { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';

import { isValidObjectId } from 'mongoose';
import Car from '../models/Car';
import { Buy } from '../models/Buy';
import Notification from '../models/notification';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});


interface CarRequest {
    owner: string;
    brand: string;
    model: string;
    price: number;
    location: string;
    year: number;
    carRegistrationNumber: string;
    colors: string | string[];
    fuelType: string;
    capacity: number;
    engineOutput: number;
    maxSpeed: number;
    advanceFeatures?: string[];
    singleChargeRange?: number;
    reviews?: Array<{
        user: string;
        rating: number;
        comment?: string;
    }>;
    description?: string;
}
export const addCar = async (req: Request, res: Response) => {
    try {
        const ownerId = res.locals.userId;

        if (!isValidObjectId(ownerId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid owner ID format'
            });
        }
        console.log(req.body);


        const images = Array.isArray(req.files)
            ? req.files.map((file: Express.Multer.File) => (file))
            : [];

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );
        console.log(imagesUrl);

        const carData = {
            owner: ownerId,
            brand: req.body.brand,
            model: req.body.model,
            price: req.body.price,
            location: req.body.location,
            year: req.body.year,
            carRegistrationNumber: req.body.carRegistrationNumber,
            colors: Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors],
            fuelType: req.body.fuelType,
            capacity: req.body.capacity,
            engineOutput: req.body.engineOutput,
            maxSpeed: req.body.maxSpeed,
            advanceFeatures: req.body.advanceFeatures || [],
            singleChargeRange: req.body.singleChargeRange,
            description: req.body.description,
            reviews: [],
            images: imagesUrl,
            purpose: req.body.purpose
        };

        if (carData.fuelType === 'Electric' && !carData.singleChargeRange) {
            return res.status(400).json({
                success: false,
                message: 'Single charge range is required for electric vehicles'
            });
        }

        const newCar = new Car(carData);
        await newCar.save();

        const responseCar = newCar.toObject();
        delete responseCar.__v;
        delete responseCar.reviews;

        res.status(201).json({
            success: true,
            message: 'Car added successfully with images',
            data: responseCar
        });

    } catch (error: any) {

        // if (req.files) {
        //     req.files.forEach((file: Express.Multer.File) => {
        //         require('fs').unlinkSync(file.path);
        //     });
        // }

        if (error.code === 11000 && error.keyPattern?.carRegistrationNumber) {
            return res.status(400).json({
                success: false,
                message: 'Car registration number already exists'
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        if (error.message === 'Only image files are allowed!') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add car',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


export const deleteCar = async (req: Request, res: Response) => {
    try {


        const ownerId = res.locals.userId;



        const carId = req.body._id;
        if (!isValidObjectId(carId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }


        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }


        if (car.owner.toString() !== ownerId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only delete your own cars'
            });
        }


        await Car.deleteOne({ _id: carId });


        res.status(200).json({
            success: true,
            message: 'Car deleted successfully',
            deletedCarId: carId
        });

    } catch (error: any) {

        res.status(500).json({
            success: false,
            message: 'Failed to delete car'

        });
    }
};






interface ReviewRequest {
    carId: string;
    rating: number;
    comment?: string;
}

export const addReview = async (req: Request<{ id: string }, {}, ReviewRequest>, res: Response) => {
    try {

        const carId = req.body.carId;
        const userId = res.locals.userId;
        if (!isValidObjectId(carId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }


        if (req.body.rating < 1 || req.body.rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }


        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }


        const existingReview = car.reviews.find(
            review => review.user.toString() === userId
        );

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this car'
            });
        }


        const newReview = {
            user: userId,
            rating: req.body.rating,
            comment: req.body.comment || '',
            createdAt: new Date()
        };


        car.reviews.push(newReview);
        await car.save();



        const response = {
            success: true,
            message: 'Review added successfully'
        };

        res.status(201).json(response);

    } catch (error: any) {

        res.status(500).json({
            success: false,
            message: 'Failed to add review'
        });
    }
};



export const getCarById = async (req: Request, res: Response) => {
    try {

        const carId = req.body.id;
        if (!isValidObjectId(carId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }


        const car = await Car.findById(carId)
            .populate('owner', 'name email')
            .populate('reviews.user', 'name')
            .lean();

        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }


        let averageRating = 0;
        if (car.reviews && car.reviews.length > 0) {
            const sum = car.reviews.reduce((acc, review) => acc + review.rating, 0);
            averageRating = parseFloat((sum / car.reviews.length).toFixed(1));
        }


        const responseData = {
            ...car,
            averageRating,
            reviewCount: car.reviews?.length || 0
        };


        delete responseData.__v;



        res.status(200).json({
            success: true,
            data: responseData
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch car details',

        });
    }
};



interface CarListing {
    _id: string;
    brand: string;
    model: string;
    price: number;
    location: string;
    year: number;
    capacity: number;

}



export const purchaseCar = async (req: Request, res: Response) => {
    const { carId } = req.body;
    const buyerId = res.locals.userId;
    try {
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({ message: 'Car not found' });
        }

        const newPurchase = new Buy({
            car: carId,
            buyer: buyerId
        });

        await newPurchase.save();

        await Car.findByIdAndUpdate(carId, { status: 'sold' });

        res.status(201).json({
            success: true,
            data: newPurchase
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error });
    }
};
export const getSoldCars = async (req: Request, res: Response) => {

    const sellerId = res.locals.userId;
    try {
        const purchases = await Buy.find()
            .populate({
                path: 'car',
                match: { owner: sellerId }
            })
            .populate('buyer', 'name email');


        const filteredPurchases = purchases.filter(purchase => purchase.car !== null);

        res.status(200).json({
            success: true,
            data: filteredPurchases
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error });
    }
};

export const getUserPurchases = async (req: Request, res: Response) => {
    const userId = res.locals.userId;

    try {
        const userPurchases = await Buy.find({ buyer: userId })
            .populate('car', 'brand model priceAtPurchase');

        res.status(200).json({
            success: true,
            data: userPurchases
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
export const getOwnerCars = async (req: Request, res: Response) => {
    const ownerId = res.locals.userId;

    try {
        const Cars = await Car.find({
            owner: ownerId,
        });

        res.status(200).json({
            success: true,
            data: Cars
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

export const approveCar = async (req: Request, res: Response) => {
    try {
        const adminId = res.locals.userId;
        const { id } = req.params;
        const { adminNote } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }

        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // التحقق من أن السيارة في حالة انتظار
        if (car.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Car is already ${car.status}. Only pending cars can be approved.`
            });
        }

        // تحديث حالة السيارة
        car.status = 'approved';
        car.approvedAt = new Date();
        car.approvedBy = adminId;
        if (adminNote) {
            car.adminNote = adminNote;
        }

        await car.save();

        // إرسال إشعار لصاحب السيارة
        await Notification.create({
            userId: car.owner,
            msg: `Your car (${car.brand} ${car.model}) has been approved and is now visible to buyers.`,
            read: false
        });

        res.status(200).json({
            success: true,
            message: 'Car approved successfully',
            data: car
        });

    } catch (error: any) {
        console.error('Approve car error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve car'
        });
    }
};

/**
 * رفض سيارة (للأدمن)
 */
export const rejectCar = async (req: Request, res: Response) => {
    try {
        const adminId = res.locals.userId;
        const { id } = req.params;
        const { adminNote } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }

        if (!adminNote) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for rejection'
            });
        }

        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        if (car.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Car is already ${car.status}. Only pending cars can be rejected.`
            });
        }

        car.status = 'rejected';
        car.adminNote = adminNote;
        car.approvedBy = adminId;
        car.approvedAt = new Date();

        await car.save();

        // إرسال إشعار لصاحب السيارة
        await Notification.create({
            userId: car.owner,
            msg: `Your car (${car.brand} ${car.model}) has been rejected. Reason: ${adminNote}`,
            read: false
        });

        res.status(200).json({
            success: true,
            message: 'Car rejected successfully',
            data: car
        });

    } catch (error: any) {
        console.error('Reject car error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject car'
        });
    }
};

/**
 * تقييد سيارة (للأدمن) - إخفاء السيارة
 */
export const restrictCar = async (req: Request, res: Response) => {
    try {
        const adminId = res.locals.userId;
        const { id } = req.params;
        const { adminNote } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }

        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        car.status = 'restricted';
        car.adminNote = adminNote || 'Car has been restricted';
        car.approvedBy = adminId;
        car.approvedAt = new Date();

        await car.save();

        // إرسال إشعار لصاحب السيارة
        await Notification.create({
            userId: car.owner,
            msg: `Your car (${car.brand} ${car.model}) has been restricted. Reason: ${car.adminNote}`,
            read: false
        });

        res.status(200).json({
            success: true,
            message: 'Car restricted successfully',
            data: car
        });

    } catch (error: any) {
        console.error('Restrict car error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restrict car'
        });
    }
};

/**
 * إزالة التقييد عن سيارة
 */
export const unrestrictCar = async (req: Request, res: Response) => {
    try {
        const adminId = res.locals.userId;
        const { id } = req.params;
        const { adminNote } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }

        const car = await Car.findById(id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        if (car.status !== 'restricted') {
            return res.status(400).json({
                success: false,
                message: 'Car is not restricted'
            });
        }

        car.status = 'approved';
        car.adminNote = adminNote || 'Restriction removed';
        car.approvedBy = adminId;
        car.approvedAt = new Date();

        await car.save();

        // إرسال إشعار لصاحب السيارة
        await Notification.create({
            userId: car.owner,
            msg: `Your car (${car.brand} ${car.model}) is no longer restricted.`,
            read: false
        });

        res.status(200).json({
            success: true,
            message: 'Car unrestricted successfully',
            data: car
        });

    } catch (error: any) {
        console.error('Unrestrict car error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unrestrict car'
        });
    }
};

/**
 * عرض السيارات المعلقة (في انتظار الموافقة)
 */
export const getPendingCars = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const [cars, total] = await Promise.all([
            Car.find({ status: 'pending' })
                .populate('owner', 'name email phoneNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Car.countDocuments({ status: 'pending' })
        ]);

        res.status(200).json({
            success: true,
            data: cars,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        console.error('Get pending cars error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending cars'
        });
    }
};

// ==================== تعديل دوال العرض الحالية ====================

/**
 * تعديل دالة عرض السيارات للبيع - فقط السيارات الموافق عليها
 */
export const getCarForSaleListings = async (req: Request, res: Response) => {
    try {
        const filter: any = {};
        filter.purpose = 'sale';
        filter.status = 'approved'; // فقط الموافق عليها

        if (req.body.brand) {
            filter.brand = req.body.brand;
        }

        const cars = await Car.find(filter)
            .select('images brand model price location year capacity reviews')
            .lean();

        const listings = cars.map(car => ({
            _id: car._id,
            brand: car.brand,
            images: car.images || [],
            model: car.model,
            price: car.price,
            location: car.location as string,
            year: car.year,
            capacity: car.capacity
        }));

        res.status(200).json({
            success: true,
            count: listings.length,
            data: listings
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch car listings'
        });
    }
};

/**
 * تعديل دالة عرض السيارات للإيجار - فقط السيارات الموافق عليها
 */
export const getRentalCarListings = async (req: Request, res: Response) => {
    try {
        const filter: any = {};
        filter.purpose = 'rent';
        filter.status = 'approved'; // فقط الموافق عليها

        if (req.body.brand) {
            filter.brand = req.body.brand;
        }

        const cars = await Car.find(filter)
            .select('images brand model price location year capacity reviews')
            .lean();

        const listings = cars.map(car => ({
            _id: car._id,
            brand: car.brand,
            images: car.images || [],
            model: car.model,
            price: car.price,
            location: car.location as string,
            year: car.year,
            capacity: car.capacity
        }));

        res.status(200).json({
            success: true,
            count: listings.length,
            data: listings
        });

    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch car listings'
        });
    }
};


/**
 * مقارنة بين سيارتين
 * @route POST /api/car/compare
 * @access Public
 */
export const compareCars = async (req: Request, res: Response) => {
    try {
        const { car1Id, car2Id } = req.body;

        // التحقق من وجود المعرفين
        if (!car1Id || !car2Id) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both car1Id and car2Id'
            });
        }

        // التحقق من صحة المعرفين
        if (!isValidObjectId(car1Id) || !isValidObjectId(car2Id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }

        // جلب السيارتين
        const [car1, car2] = await Promise.all([
            Car.findById(car1Id)
                .populate('owner', 'name email phoneNumber')
                .lean(),
            Car.findById(car2Id)
                .populate('owner', 'name email phoneNumber')
                .lean()
        ]);

        // التحقق من وجود السيارتين
        if (!car1) {
            return res.status(404).json({
                success: false,
                message: `Car with ID ${car1Id} not found`
            });
        }

        if (!car2) {
            return res.status(404).json({
                success: false,
                message: `Car with ID ${car2Id} not found`
            });
        }

        // التحقق من أن السيارتين موافَق عليهما (ظاهرتين للجميع)
        if (car1.status !== 'approved' || car2.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'One or both cars are not available for comparison'
            });
        }

        // حساب متوسط التقييمات
        const getAverageRating = (reviews: any[]) => {
            if (!reviews || reviews.length === 0) return 0;
            const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
            return parseFloat((sum / reviews.length).toFixed(1));
        };

        // تجهيز بيانات المقارنة
        const comparisonData = {
            car1: {
                id: car1._id,
                brand: car1.brand,
                model: car1.model,
                year: car1.year,
                price: car1.price,
                location: car1.location,
                images: car1.images || [],
                fuelType: car1.fuelType,
                capacity: car1.capacity,
                engineOutput: car1.engineOutput,
                maxSpeed: car1.maxSpeed,
                colors: car1.colors,
                advanceFeatures: car1.advanceFeatures || [],
                singleChargeRange: car1.singleChargeRange || null,
                purpose: car1.purpose,
                description: car1.description || '',
                averageRating: getAverageRating(car1.reviews),
                reviewCount: car1.reviews?.length || 0,
                owner: {
                    name: (car1.owner as any)?.name || 'Unknown',
                    email: (car1.owner as any)?.email || 'Unknown'
                }
            },
            car2: {
                id: car2._id,
                brand: car2.brand,
                model: car2.model,
                year: car2.year,
                price: car2.price,
                location: car2.location,
                images: car2.images || [],
                fuelType: car2.fuelType,
                capacity: car2.capacity,
                engineOutput: car2.engineOutput,
                maxSpeed: car2.maxSpeed,
                colors: car2.colors,
                advanceFeatures: car2.advanceFeatures || [],
                singleChargeRange: car2.singleChargeRange || null,
                purpose: car2.purpose,
                description: car2.description || '',
                averageRating: getAverageRating(car2.reviews),
                reviewCount: car2.reviews?.length || 0,
                owner: {
                    name: (car2.owner as any)?.name || 'Unknown',
                    email: (car2.owner as any)?.email || 'Unknown'
                }
            },
            // مقارنة سريعة بين السيارتين
            comparison: {
                priceDifference: Math.abs(car1.price - car2.price),
                yearDifference: Math.abs(car1.year - car2.year),
                engineOutputDifference: Math.abs(car1.engineOutput - car2.engineOutput),
                maxSpeedDifference: Math.abs(car1.maxSpeed - car2.maxSpeed),
                capacityDifference: Math.abs(car1.capacity - car2.capacity),
                betterPrice: car1.price < car2.price ? 'Car 1' : car1.price > car2.price ? 'Car 2' : 'Equal',
                betterEngine: car1.engineOutput > car2.engineOutput ? 'Car 1' : car1.engineOutput < car2.engineOutput ? 'Car 2' : 'Equal',
                betterSpeed: car1.maxSpeed > car2.maxSpeed ? 'Car 1' : car1.maxSpeed < car2.maxSpeed ? 'Car 2' : 'Equal',
                newerYear: car1.year > car2.year ? 'Car 1' : car1.year < car2.year ? 'Car 2' : 'Equal',
                betterRating: (car1.reviews?.length || 0) > 0 && (car2.reviews?.length || 0) > 0
                    ? getAverageRating(car1.reviews) > getAverageRating(car2.reviews) ? 'Car 1' :
                        getAverageRating(car1.reviews) < getAverageRating(car2.reviews) ? 'Car 2' : 'Equal'
                    : 'Not enough reviews'
            }
        };

        res.status(200).json({
            success: true,
            data: comparisonData
        });

    } catch (error: any) {
        console.error('Compare cars error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to compare cars',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
/*

 "brand": "merc",
  "model": "Model 9",
  "price" : 23  ,
  "location":"homs" ,
  "year": 2023,
  "carRegistrationNumber": "TESLA9asd58",
  "colors": ["White", "Black"],
  "fuelType": "Electric",
  "capacity": 5,
  "engineOutput": 450,
  "maxSpeed": 261,
  "advanceFeatures": ["Autopilot", "Premium Interior"],
  "singleChargeRange": 502,
  "description": "Performance edition with dual motors"


*/