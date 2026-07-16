import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductTemplateSpecification {
  label: string;
  value: string;
}

export interface IProductTemplate extends Document {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  specifications: IProductTemplateSpecification[];
  features: string[];
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductTemplateSpecificationSchema = new Schema<IProductTemplateSpecification>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ProductTemplateSchema: Schema<IProductTemplate> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    specifications: [ProductTemplateSpecificationSchema],
    features: [{ type: String }],
    keywords: [{ type: String }],
  },
  { timestamps: true }
);

export const ProductTemplate: Model<IProductTemplate> =
  mongoose.models.ProductTemplate ||
  mongoose.model<IProductTemplate>("ProductTemplate", ProductTemplateSchema);
