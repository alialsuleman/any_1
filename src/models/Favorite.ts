// models/favorite.model.ts
import { Schema, model, Document, Types } from "mongoose";

interface IFavorite extends Document {
    user: Types.ObjectId;
    car: Types.ObjectId;
    createdAt: Date;
}

const FavoriteSchema: Schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    car: {
        type: Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// منع التكرار (مستخدم + سيارة)
FavoriteSchema.index({ user: 1, car: 1 }, { unique: true });

const Favorite = model<IFavorite>('Favorite', FavoriteSchema);

export default Favorite;