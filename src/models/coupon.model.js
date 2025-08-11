import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"], // percentage: 10% off, fixed: Rs.500 off
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchaseAmount: {
      type: Number,
      default: 0, // Minimum order total before coupon applies
    },
    maxDiscountAmount: {
      type: Number, // For percentage coupons, limit max discount
    },
    usageLimit: {
      type: Number,
      default: 1, // How many times coupon can be used in total
    },
    usageCount: {
      type: Number,
      default: 0, // Increment each time used
    },
    perUserLimit: {
      type: Number,
      default: 1, // How many times a single user can use it
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    applicableStores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin or Seller who created it
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
