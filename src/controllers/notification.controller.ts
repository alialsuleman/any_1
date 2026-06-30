
import { Request, Response } from 'express';
import Rental from '../models/rental';
import Car from '../models/Car';
import { isValidObjectId } from 'mongoose';
import Notification, { INotification, NotificationInput } from '../models/notification';




export const createNotification = async (notificationData: NotificationInput): Promise<INotification> => {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
}


export const getUserNotifications = async (req: Request, res: Response) => {
    const userId = res.locals.userId;
    const notifications = await Notification.find({ userId }).sort({ date: -1 });
    const response = {
        success: true,
        notifications
    };


    res.status(200).json(response);
    for (let x of notifications) {
        markAsRead(x._id);
    }

}
async function markAsRead(notificationId: string) {

    const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
    );

}