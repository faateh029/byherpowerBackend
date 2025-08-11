import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  role: { 
    type: String, 
    enum: ["customer", "seller", "admin"], 
    default: "customer" 
  },

  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }, // only if seller

  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },

  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // for wishlist feature

  followingStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }], // follow stores

  address: [
    {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      isDefault: { type: Boolean, default: false }
    }
  ], // multiple addresses for checkout

  phone: { type: String },

  isVerified: { type: Boolean, default: false }, // for email verification / OTP
  
}, { timestamps: true });

export default mongoose.model("User", userSchema);
