import { Request, Response } from 'express';
import Rental from '../models/rental';
import Car from '../models/Car';
import { isValidObjectId } from 'mongoose';
import { createNotification } from './notification.controller';

interface RentalRequest {
    carId: string;
    startDate: Date;
    endDate: Date;
}

export const createRental = async (req: Request<{}, {}, RentalRequest>, res: Response) => {
    try {
        if (!isValidObjectId(req.body.carId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car ID format'
            });
        }

        const { carId, startDate, endDate } = req.body;
        const userId = res.locals.userId;

        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();

        if (start < today) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be in the future'
            });
        }

        if (end < start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }


        const ok = await isCarAvailable(carId, startDate, endDate);
        console.log(ok);
        if (!ok) {
            return res.status(409).json({
                success: false,
                message: 'Car is already rented for the selected dates'
            });
        }


        const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = durationDays * car.price;


        const newRental = new Rental({
            user: userId,
            owner: car.owner,
            car: carId,
            startDate: start,
            endDate: end,
            totalPrice,
            status: 'pending'
        });

        await newRental.save();

        // 7. Prepare response
        const response = {
            success: true,
            message: 'Rental created successfully',
            data: {
                rentalId: newRental._id,
                car: car.brand + ' ' + car.model,
                startDate: newRental.startDate,
                endDate: newRental.endDate,
                durationDays,
                totalPrice: newRental.totalPrice,
                status: newRental.status
            }
        };

        createNotification({
            userId: userId,
            msg: `The vehicle -${car.brand} ${car.model} - reservation process was completed successfully.`
        })
        createNotification({
            userId: car.owner.toString(),
            msg: `your vehicle -${car.brand} ${car.model} - reservation process was completed successfully.`
        })

        res.status(201).json(
            response
        );

    } catch (error: any) {

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }


        res.status(500).json({
            success: false,
            message: 'Failed to create rental'

        });
    }
};




export const isCarAvailable = async (carId: string, startDate2: Date, endDate2: Date): Promise<boolean> => {

    const conditions: any = {
        car: carId,
        // $or: [
        //     { startDate: { $gte: startDate2, $lte: endDate2 } },
        //     { endDate: { $gte: startDate2, $lte: endDate2 } },
        //     { startDate: { $lte: startDate2 }, endDate: { $gte: endDate2 } },
        // ]
    };

    const existingRental = await Rental.find(conditions);
    let x = false;
    for (let elment of existingRental) {
        //console.log(new Date(startDate2), endDate2, new Date(elment.startDate), elment.endDate);
        // console.log(new Date(startDate2).toISOString() === new Date(elment.startDate).toISOString());
        if (
            new Date(elment.startDate).toISOString() >= new Date(startDate2).toISOString() &&
            new Date(elment.startDate).toISOString() <= new Date(endDate2).toISOString())
            x = true;
        if (
            new Date(elment.endDate).toISOString() >= new Date(startDate2).toISOString() &&
            new Date(elment.endDate).toISOString() <= new Date(endDate2).toISOString())
            x = true;

        if (
            new Date(startDate2).toISOString() >= new Date(elment.startDate).toISOString() &&
            new Date(startDate2).toISOString() <= new Date(elment.endDate).toISOString())
            x = true;
        if (new Date(endDate2).toISOString() >= new Date(elment.startDate).toISOString() &&
            new Date(endDate2).toISOString() <= new Date(elment.endDate).toISOString())
            x = true;

    }
    console.log(existingRental);
    return !x;
};



interface AvailableCarFilter {
    startDate: Date;
    endDate: Date;
}


export const getAvailableCars = async (req: Request<{}, {}, AvailableCarFilter>, res: Response) => {
    try {

        const { startDate, endDate } = req.body;
        const allCars = await Car.find({ purpose: "rent" }).select('_id').lean();

        const availableCars: string[] = [];

        for (const car of allCars) {
            const isAvailable = await isCarAvailable(car._id, startDate, endDate);

            if (isAvailable) {
                availableCars.push(car._id);
            }
        }

        res.status(200).send({
            success: true,
            message: '....',
            count: availableCars.length,
            availableCars
        });

    } catch (error) {
        console.error('Error finding available cars:', error);
        throw new Error('Failed to retrieve available cars');
    }
};

export const getUserRentals = async (req: Request, res: Response) => {


    const userId = res.locals.userId;
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }

    const rentals = await Rental.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        count: rentals.length,
        data: rentals
    });


};
export const getOwnerRentals = async (req: Request, res: Response) => {

    const ownerId = res.locals.userId;
    if (!ownerId) {
        return res.status(400).json({
            success: false,
            message: 'Owner ID is required'
        });
    }

    const rentals = await Rental.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        count: rentals.length,
        data: rentals
    });


};
export const getCarRentals = async (req: Request, res: Response) => {

    const carId = req.body.carId;
    const ownerId = res.locals.userId;;
    if (!carId) {
        return res.status(400).json({
            success: false,
            message: 'CarId ID is required'
        });
    }

    const rentals = await Rental.find({ car: carId, owner: ownerId })
        .sort({ createdAt: -1 })
        .lean();

    res.status(200).json({
        success: true,
        count: rentals.length,
        data: rentals
    });


};


export const completeRental = async (req: Request, res: Response) => {

    const { rentalId } = req.body;

    if (!isValidObjectId(rentalId)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid rental ID'
        });
    }


    const updatedRental = await Rental.findByIdAndUpdate(
        rentalId,
        {
            $set: {
                status: 'completed',
                updatedAt: new Date()
            }
        },
        { new: true }
    );

    if (updatedRental) {
        createNotification({
            userId: updatedRental.user.toString(),
            msg: `The payment process for reserving the vehicle  -${updatedRental.car} - has been completed.`
        })
        createNotification({
            userId: updatedRental.owner.toString(),
            msg: `The payment process for reserving your vehicle  -$${updatedRental.car}- has been completed.`
        })

    }


    res.status(200).json({
        success: true,
        message: 'Rental marked as completed',
        data: updatedRental
    });


};
