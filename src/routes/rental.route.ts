import express from 'express';
import { verify } from '../middleware/verify-token';
import { completeRental, createRental, getCarRentals, getOwnerRentals, getUserRentals } from '../controllers/rental.controller';
import { asyncWrapper } from '../middleware/asyncWrapper';

const router = express.Router();

// Protected route - requires authentication
router.post('/add', verify, createRental);
router.get('/getUserRentals', verify, asyncWrapper(getUserRentals));
router.get('/getOwnerRentals', verify, asyncWrapper(getOwnerRentals));
router.post('/getCarRentalsForowner', verify, asyncWrapper(getCarRentals));
router.post('/completeRental', verify, asyncWrapper(completeRental));






export default router;


// getUserRentals
// getOwnerRentals
// getCarRentals
// completeRental