import express from 'express';
import { verify } from '../middleware/verify-token';
import { asyncWrapper } from '../middleware/asyncWrapper';
import { getSoldCars, getUserPurchases, purchaseCar } from '../controllers/car.controller';

const router = express.Router();



// Protected route - requires authentication

router.post('/purchaseCar', verify, asyncWrapper(purchaseCar));
router.get('/getmysoldcars', verify, asyncWrapper(getSoldCars));
router.get('/getmypurchases', verify, asyncWrapper(getUserPurchases));


export default router;


// getUserRentals
// getOwnerRentals
// getCarRentals
// completeRental