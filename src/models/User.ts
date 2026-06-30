import { Schema, model, Document } from "mongoose"

export interface IUser extends Document {
    name: string;
    email: string;
    phoneNumber: string;
    divingLicenseNumber: string;
    password: string;
    avatarFilename: string;
    gender: 'male' | 'female';
    role: 'user' | 'trader' | 'admin';
    isRestricted: boolean; // حقل جديد للتقييد
    restrictedAt?: Date; // تاريخ التقييد
    restrictedReason?: string; // سبب التقييد

    cardFullName?: string;
    cardEmail?: string;
    cardNumber?: string;
    expiryDate?: string;
    cvc?: string;
    country?: string;
    zipCode?: string;

    date: Date;
}

const UserSchema: Schema = new Schema({
    name: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    email: {
        type: String,
        required: true,
        max: 255,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    divingLicenseNumber: {
        type: String,
        required: true
    },
    avatarFilename: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
        max: 1024,
        min: 6
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        default: 'male'
    },
    role: {
        type: String,
        enum: ['user', 'trader', 'admin'],
        default: 'user'
    },
    isRestricted: {
        type: Boolean,
        default: false
    },
    restrictedAt: {
        type: Date
    },
    restrictedReason: {
        type: String,
        max: 500
    },
    cardFullName: {
        type: String,
        required: false
    },
    cardEmail: {
        type: String,
        required: false
    },
    cardNumber: {
        type: String,
        required: false
    },
    expiryDate: {
        type: String,
        required: false
    },
    cvc: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    zipCode: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now()
    }
})

const User = model<IUser>('User', UserSchema)
export default User;