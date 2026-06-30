import { Schema, model, Document, Types } from "mongoose";

interface IReview {
    user: Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
}

interface ICar extends Document {
    owner: Types.ObjectId;
    images: [String];
    brand: string;
    model: string;
    price: number;
    location: String;
    year: number;
    carRegistrationNumber: string;
    colors: string[];
    fuelType: string;
    capacity: number;
    engineOutput: number;
    maxSpeed: number;
    advanceFeatures: string[];
    singleChargeRange?: number;
    reviews: IReview[];
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    purpose: 'rent' | 'sale';
    status: 'pending' | 'approved' | 'rejected' | 'restricted'; // حالة السيارة
    adminNote?: string; // ملاحظة الأدمن
    approvedAt?: Date;
    approvedBy?: Types.ObjectId;
}

const CarSchema: Schema = new Schema({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: [String],
    brand: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 1,
    },
    location: {
        type: String,
        required: true,
    },
    year: {
        type: Number,
        required: true,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    carRegistrationNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    colors: {
        type: [String],
        required: true,
        validate: {
            validator: (colors: string[]) => colors.length > 0,
            message: 'At least one color must be specified'
        }
    },
    fuelType: {
        type: String,
        required: true,
        enum: ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'LPG'],
        default: 'Gasoline'
    },
    purpose: {
        type: String,
        required: true,
        enum: ['rent', 'sale'],
        default: 'rent'
    },
    capacity: {
        type: Number,
        required: true,
        min: 1,
        max: 20
    },
    engineOutput: {
        type: Number,
        required: true,
        min: 50,
        max: 1500
    },
    maxSpeed: {
        type: Number,
        required: true,
        min: 80,
        max: 400
    },
    advanceFeatures: {
        type: [String],
        default: []
    },
    singleChargeRange: {
        type: Number,
        min: 0,
        max: 1000,
        validate: {
            validator: function (this: ICar, value: number) {
                return this.fuelType !== 'Electric' || value !== undefined;
            },
            message: 'Single charge range is required for electric vehicles'
        }
    },
    reviews: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    // حقول جديدة لإدارة الموافقة
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'restricted'],
        default: 'pending'
    },
    adminNote: {
        type: String,
        trim: true,
        maxlength: 500
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for average rating
CarSchema.virtual('averageRating').get(function (this: ICar) {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / this.reviews.length;
});

// Indexes
CarSchema.index({ brand: 1, model: 1 });
CarSchema.index({ carRegistrationNumber: 1 }, { unique: true });
CarSchema.index({ status: 1 });
CarSchema.index({ owner: 1, status: 1 });

const Car = model<ICar>('Car', CarSchema);

export default Car;