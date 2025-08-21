// ===== Example Product Model (if you don't have one) =====
// models/product.model.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    category: { type: String, trim: true },
    brand: { type: String, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    discount: { type: Number, min: 0, max: 100, default: 0 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    wishlistCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({ name: "text", description: "text" });
productSchema.index({ seller: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("Product", productSchema);