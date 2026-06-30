import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = res.locals.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - Please login'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};