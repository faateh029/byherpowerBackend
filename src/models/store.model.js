// ===== Example Store Model (if you don't have one) =====
// models/store.model.js
import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    storeName: { type: String, required: true, trim: true, unique: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    isActive: { type: Boolean, default: true, index: true },
    followersCount: { type: Number, default: 0 },
    productsCount: { type: Number, default: 0 },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },
    contact: {
      email: String,
      phone: String,
      website: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

storeSchema.index({ storeName: "text", description: "text" });
storeSchema.index({ owner: 1 });
storeSchema.index({ category: 1, isActive: 1 });

export default mongoose.model("Store", storeSchema);