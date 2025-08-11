import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["customer", "seller", "admin"], default: "customer" },
  store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" }, // seller ka store
  cart: { type: mongoose.Schema.Types.ObjectId, ref: "Cart" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
