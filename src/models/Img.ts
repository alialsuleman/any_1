

import { Document } from 'mongoose';
import { Schema, model } from 'mongoose';



export interface IImage extends Document {
  path: string;
  filename: string;
  cardId: string;
  createdAt?: Date;
  updatedAt?: Date;
}



const imageSchema = new Schema<IImage>(
  {
    path: {
      type: String,
      required: true,
      trim: true
    },
    filename: {
      type: String,
      required: true,
      trim: true
    },
    cardId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);


export const ImageModel = model<IImage>('Image', imageSchema);