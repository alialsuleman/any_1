import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import Notification from '../models/notification';
import User from '../models/User';
import Car from '../models/Car';



/**
 * عرض جميع المستخدمين
 * @route GET /api/admin/users
 * @access Admin only
 */
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, role, isRestricted } = req.query;

        const filter: any = {};

        // فلتر حسب الدور
        if (role) {
            filter.role = role;
        }

        // فلتر حسب التقييد
        if (isRestricted === 'true') {
            filter.isRestricted = true;
        } else if (isRestricted === 'false') {
            filter.isRestricted = false;
        }

        // بحث باسم أو بريد
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -cardNumber -cvc') // إخفاء البيانات الحساسة
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

/**
 * عرض بيانات مستخدم معين
 * @route GET /api/admin/users/:id
 * @access Admin only
 */
export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(id)
            .select('-password -cardNumber -cvc') // إخفاء البيانات الحساسة
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error: any) {
        console.error('Get user by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
};

/**
 * عرض المستخدمين المقيدين فقط
 * @route GET /api/admin/users/restricted
 * @access Admin only
 */
export const getRestrictedUsers = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        const [users, total] = await Promise.all([
            User.find({ isRestricted: true })
                .select('-password -cardNumber -cvc')
                .sort({ restrictedAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments({ isRestricted: true })
        ]);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        console.error('Get restricted users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch restricted users'
        });
    }
};

export const restrictUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot restrict an admin user'
            });
        }

        // تحديث حالة المستخدم
        user.isRestricted = true;
        user.restrictedAt = new Date();
        user.restrictedReason = reason || 'No reason provided';
        await user.save();

        // تقييد جميع سيارات المستخدم
        await Car.updateMany(
            { owner: id, status: { $in: ['approved', 'pending'] } },
            {
                status: 'restricted',
                adminNote: `User restricted: ${user.restrictedReason}`
            }
        );

        // إرسال إشعار للمستخدم
        await Notification.create({
            userId: user._id,
            msg: `Your account has been restricted. Reason: ${user.restrictedReason}. All your cars have been hidden.`,
            read: false
        });

        res.status(200).json({
            success: true,
            message: 'User and all their cars restricted successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isRestricted: user.isRestricted,
                restrictedReason: user.restrictedReason
            }
        });

    } catch (error: any) {
        console.error('Restrict user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restrict user'
        });
    }
};

/**
 * إزالة التقييد عن مستخدم مع إزالة التقييد عن سياراته
 */
export const unrestrictUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID format'
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // تحديث حالة المستخدم
        user.isRestricted = false;
        user.restrictedAt = undefined;
        user.restrictedReason = undefined;
        await user.save();

        // إزالة التقييد عن سيارات المستخدم (إعادتها لحالة pending ليتم مراجعتها)
        await Car.updateMany(
            { owner: id, status: 'restricted' },
            {
                status: 'pending',
                adminNote: 'Restriction removed by admin'
            }
        );

        // إرسال إشعار للمستخدم
        await Notification.create({
            userId: user._id,
            msg: `Your account restriction has been removed. Your cars are now pending admin approval.`,
            read: false
        });

        res.status(200).json({
            success: true,
            message: 'User and all their cars unrestricted successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isRestricted: user.isRestricted
            }
        });

    } catch (error: any) {
        console.error('Unrestrict user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unrestrict user'
        });
    }
};
