import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: mongoose.Types.ObjectId | null;
  sortOrder: number;
}

const CategorySchema: Schema<ICategory> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
