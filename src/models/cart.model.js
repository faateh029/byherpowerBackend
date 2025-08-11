import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtAdd: { type: Number, required: true }, // snapshot price
    variant: { type: String }, // e.g., size: M, color: Red
  }],
  appliedCoupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" }, // optional
}, { timestamps: true });

export default mongoose.model("Cart", cartSchema);

