import { Schema, model, type HydratedDocument } from "mongoose";

export interface IProduct {
  name: string;
  description?: string;
  price: number;
  category?: string;
  inStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [120, "Product name cannot exceed 120 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"]
    },
    category: {
      type: String,
      trim: true,
      maxlength: [80, "Category cannot exceed 80 characters"]
    },
    inStock: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

productSchema.index({ name: "text" });
productSchema.index({ category: 1, inStock: 1, price: 1 });

export const Product = model<IProduct>("Product", productSchema);
