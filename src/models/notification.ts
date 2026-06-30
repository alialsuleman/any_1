import { Document, Schema, model } from 'mongoose';

export interface INotification extends Document {
    userId: string;
    msg: string;
    read: boolean;
    date: Date;
}

export interface NotificationInput {
    userId: string;
    msg: string;
    read?: boolean;
}

export interface NotificationDocument extends NotificationInput {
    _id: string;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
    userId: {
        type: String,
        required: [true, 'User ID is required'],
        index: true
    },
    msg: {
        type: String,
        required: [true, 'Message is required'],
        trim: true
    },
    read: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});


const Notification = model<INotification>('Notification', notificationSchema);

export default Notification;