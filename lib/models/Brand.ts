import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrand extends Document {
  name: string;
  slug: string;
}

const BrandSchema: Schema<IBrand> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const Brand: Model<IBrand> = mongoose.models.Brand || mongoose.model<IBrand>("Brand", BrandSchema);
