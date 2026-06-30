import { Schema, model, Document, Types } from "mongoose";

interface IRental extends Document {
    user: Types.ObjectId;   // Reference to User
    car: Types.ObjectId;    // Reference to Car
    owner: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    totalPrice: number;
    createdAt: Date;
    updatedAt: Date;
}

const RentalSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    car: {
        type: Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (this: IRental, value: Date) {
                return value >= new Date();
            },
            message: 'Start date must be in the future'
        }
    },
    endDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (this: IRental, value: Date) {
                // End date must be after start date
                return value >= this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true,  // Adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
RentalSchema.index({ user: 1 });
RentalSchema.index({ car: 1 });
RentalSchema.index({ startDate: 1, endDate: 1 });

// Virtual for rental duration in days
RentalSchema.virtual('durationDays').get(function (this: IRental) {
    return Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
});

const Rental = model<IRental>('Rental', RentalSchema);

export default Rental;