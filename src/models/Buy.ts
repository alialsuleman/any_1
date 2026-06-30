import { Schema, model, Document, Types } from 'mongoose';

export interface IBuy extends Document {
    car: Types.ObjectId;   // Reference to the Car
    buyer: Types.ObjectId; // Reference to the User who bought the car
    purchaseDate: Date;
}

const BuySchema = new Schema<IBuy>({
    car: { type: Schema.Types.ObjectId, ref: 'Car', required: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    purchaseDate: { type: Date, default: Date.now },

});

export const Buy = model<IBuy>('Buy', BuySchema);