import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true
  },
  items: [{
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true 
    },
    quantity: { 
      type: Number,
      required: true,
      min: 1
    },
    priceAtPurchase: { // capture price when order placed
      type: Number,
      required: true,
      min: 0
    }
  }],
  shippingAddress: { // saved separately in order to avoid changes from user profile later
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: { // e.g. 'Credit Card', 'Cash on Delivery', 'PayPal'
    type: String,
    required: true
  },
  paymentStatus: { // pending, paid, failed, refunded
    type: String,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending"
  },
  coupon: { // applied coupon if any
    type: mongoose.Schema.Types.ObjectId,
    ref: "Coupon",
    default: null
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  taxAmount: { // optional, for tax calculation
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: { // shipping fee
    type: Number,
    default: 0,
    min: 0
  },
  status: { 
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
    default: "pending"
  },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  returnedAt: { type: Date },
  notes: { type: String } // optional order notes from customer
}, 
{ timestamps: true });

export default mongoose.model("Order", orderSchema);
