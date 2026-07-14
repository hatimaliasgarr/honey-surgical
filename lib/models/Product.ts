import mongoose, { Schema, Document, Model } from "mongoose";
import { IBrand } from "./Brand";
import { ICategory } from "./Category";

export interface IProductImage {
  id: string; // Cloudinary public_id or similar
  url: string;
  alt: string;
  sortOrder: number;
}

export interface IProductSpecification {
  label: string;
  value: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  sku: string;
  brand: mongoose.Types.ObjectId | IBrand;
  category: mongoose.Types.ObjectId | ICategory;
  price: number | null;
  shortDescription: string;
  description: string;
  specifications: IProductSpecification[];
  features: string[];
  keywords: string[];
  status: "draft" | "active" | "archived";
  images: IProductImage[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    id: { type: String, required: true },
    url: { type: String, required: true },
    alt: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSpecificationSchema = new Schema<IProductSpecification>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema: Schema<IProduct> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    sku: { type: String, required: true, unique: true, index: true },
    brand: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    price: { type: Number, default: null },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    specifications: [ProductSpecificationSchema],
    features: [{ type: String }],
    keywords: [{ type: String }],
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    images: [ProductImageSchema],
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for common queries
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ name: "text", shortDescription: "text", keywords: "text" }); // Text index for search

export const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
