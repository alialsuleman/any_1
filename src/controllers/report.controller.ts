import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import Report from '../models/Report';
import Car from '../models/Car';
import { v2 as cloudinary } from 'cloudinary';
import Notification from '../models/notification';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});

// ==================== USER CONTROLLERS ====================

/**
 * Create a new report
 * @route POST /api/reports
 * @access Private (User)
 */
export const createReport = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const { category, subject, description, carId } = req.body;

        // Validate required fields
        if (!category || !subject || !description || !carId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide category, subject, description, and carId'
            });
        }

        // Validate car exists
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

        // Check if user already reported this car (optional - prevent duplicate reports)
        const existingReport = await Report.findOne({
            reportedCar: carId,
            reporter: userId,
            status: { $in: ['pending', 'reviewing'] }
        });

        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'You have already reported this car. Please wait for review.'
            });
        }

        // Handle attachments if any
        let attachments: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            const files = req.files as Express.Multer.File[];
            if (files.length > 3) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum 3 attachments allowed'
                });
            }

            attachments = await Promise.all(
                files.map(async (file) => {
                    const result = await cloudinary.uploader.upload(file.path, {
                        resource_type: 'image',
                        folder: 'reports'
                    });
                    return result.secure_url;
                })
            );
        }

        // Create report
        const report = new Report({
            category,
            subject,
            description,
            attachments,
            reportedCar: carId,
            reporter: userId,
            status: 'pending'
        });

        await report.save();

        const populatedReport = await Report.findById(report._id)
            .populate('reportedCar', 'brand model year price images')
            .populate('reporter', 'name email')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Report submitted successfully',
            data: populatedReport
        });

    } catch (error: any) {
        console.error('Create report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user's own reports
 * @route GET /api/reports/my-reports
 * @access Private (User)
 */
export const getUserReports = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const { page = 1, limit = 10, status } = req.query;

        const filter: any = { reporter: userId };
        if (status) {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reportedCar', 'brand model year price images')
                .populate('reporter', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Report.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: reports,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error: any) {
        console.error('Get user reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
};

/**
 * Get a specific report by ID (user can only view their own reports)
 * @route GET /api/reports/:id
 * @access Private (User)
 */
export const getUserReportById = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID format'
            });
        }

        const report = await Report.findOne({
            _id: id,
            reporter: userId
        })
            .populate('reportedCar', 'brand model year price images description location')
            .populate('reporter', 'name email')
            .populate('resolvedBy', 'name email')
            .lean();

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });

    } catch (error: any) {
        console.error('Get user report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report'
        });
    }
};

/**
 * Cancel a pending report (user can cancel their own pending reports)
 * @route DELETE /api/reports/:id
 * @access Private (User)
 */
export const cancelReport = async (req: Request, res: Response) => {
    try {
        const userId = res.locals.userId;
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID format'
            });
        }

        const report = await Report.findOne({
            _id: id,
            reporter: userId,
            status: 'pending'
        });

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found or cannot be cancelled'
            });
        }

        // Delete attachments from cloudinary if any
        if (report.attachments && report.attachments.length > 0) {
            await Promise.all(
                report.attachments.map(async (url) => {
                    try {
                        const publicId = url.split('/').pop()?.split('.')[0];
                        if (publicId) {
                            await cloudinary.uploader.destroy(`reports/${publicId}`);
                        }
                    } catch (err) {
                        console.error('Error deleting attachment:', err);
                    }
                })
            );
        }

        await Report.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Report cancelled successfully'
        });

    } catch (error: any) {
        console.error('Cancel report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel report'
        });
    }
};

// ==================== ADMIN CONTROLLERS ====================

/**
 * Get all reports (Admin only)
 * @route GET /api/reports/admin
 * @access Private (Admin)
 */
export const getAllReports = async (req: Request, res: Response) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            category,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter: any = {};
        if (status) filter.status = status;
        if (category) filter.category = category;

        const skip = (Number(page) - 1) * Number(limit);
        const sort: any = {};
        sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
        console.log(filter);
        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('reportedCar', 'brand model year price images owner')
                .populate('reporter', 'name email')
                .populate('resolvedBy', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Report.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: reports,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            },
            filters: {
                status: status || 'all',
                category: category || 'all'
            }
        });

    } catch (error: any) {
        console.error('Get all reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
};

/**
 * Get report by ID (Admin)
 * @route GET /api/reports/admin/:id
 * @access Private (Admin)
 */
export const getReportByIdAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID format'
            });
        }

        const report = await Report.findById(id)
            .populate('reportedCar', 'brand model year price images description location owner')
            .populate('reporter', 'name email phone')
            .populate('resolvedBy', 'name email')
            .lean();

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Get car owner details
        const car = await Car.findById(report.reportedCar._id)
            .populate('owner', 'name email phone')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                ...report,
                carOwner: car?.owner || null
            }
        });

    } catch (error: any) {
        console.error('Get report by ID admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report'
        });
    }
};

/**
 * Delete report (Admin)
 * @route DELETE /api/reports/admin/:id
 * @access Private (Admin)
 */
export const deleteReportAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID format'
            });
        }

        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // Delete attachments from cloudinary
        if (report.attachments && report.attachments.length > 0) {
            await Promise.all(
                report.attachments.map(async (url) => {
                    try {
                        const publicId = url.split('/').pop()?.split('.')[0];
                        if (publicId) {
                            await cloudinary.uploader.destroy(`reports/${publicId}`);
                        }
                    } catch (err) {
                        console.error('Error deleting attachment:', err);
                    }
                })
            );
        }

        await Report.deleteOne({ _id: id });

        res.status(200).json({
            success: true,
            message: 'Report deleted successfully'
        });

    } catch (error: any) {
        console.error('Delete report admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report'
        });
    }
};

/**
 * Get report statistics (Admin)
 * @route GET /api/reports/admin/stats
 * @access Private (Admin)
 */
export const getReportStats = async (req: Request, res: Response) => {
    try {
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const categoryStats = await Report.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalReports = await Report.countDocuments();
        const pendingReports = await Report.countDocuments({ status: 'pending' });
        const resolvedReports = await Report.countDocuments({ status: 'resolved' });
        const rejectedReports = await Report.countDocuments({ status: 'rejected' });

        res.status(200).json({
            success: true,
            data: {
                total: totalReports,
                byStatus: stats.reduce((acc: any, curr: any) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                byCategory: categoryStats,
                pending: pendingReports,
                resolved: resolvedReports,
                rejected: rejectedReports
            }
        });

    } catch (error: any) {
        console.error('Get report stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const adminId = res.locals.userId;
        const { id } = req.params;
        const { status, adminNotes, carAction } = req.body;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report ID format'
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const validStatuses = ['pending', 'reviewing', 'resolved', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const report = await Report.findById(id).populate('reportedCar');
        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        // تحديث التقرير
        report.status = status;
        if (adminNotes) {
            report.adminNotes = adminNotes;
        }

        if (status === 'resolved' || status === 'rejected') {
            report.resolvedBy = adminId;
            report.resolvedAt = new Date();
        }

        await report.save();

        // معالجة السيارة بناءً على الإجراء المطلوب
        if (carAction && report.reportedCar) {
            const car = await Car.findById(report.reportedCar);
            if (car) {
                if (carAction === 'restrict') {
                    car.status = 'restricted';
                    car.adminNote = `Restricted due to report #${report._id}`;
                } else if (carAction === 'approve') {
                    car.status = 'approved';
                    car.adminNote = `Approved after report #${report._id}`;
                } else if (carAction === 'reject') {
                    car.status = 'rejected';
                    car.adminNote = `Rejected due to report #${report._id}`;
                }
                await car.save();

                // إشعار لصاحب السيارة
                await Notification.create({
                    userId: car.owner,
                    msg: `Your car (${car.brand} ${car.model}) has been ${carAction}ed after a report review.`,
                    read: false
                });
            }
        }

        const updatedReport = await Report.findById(id)
            .populate('reportedCar', 'brand model year price status')
            .populate('reporter', 'name email')
            .populate('resolvedBy', 'name email')
            .lean();

        res.status(200).json({
            success: true,
            message: `Report ${status} successfully`,
            data: updatedReport
        });

    } catch (error: any) {
        console.error('Update report status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update report'
        });
    }
};
