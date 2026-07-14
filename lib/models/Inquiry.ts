import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInquiry extends Document {
  customerName: string;
  email: string;
  phone: string;
  productId: mongoose.Types.ObjectId | null;
  productName: string | null;
  message: string;
  status: "new" | "contacted" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema: Schema<IInquiry> = new Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    productName: { type: String, default: null },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
  },
  { timestamps: true }
);

export const Inquiry: Model<IInquiry> = mongoose.models.Inquiry || mongoose.model<IInquiry>("Inquiry", InquirySchema);
