const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
}, { timestamps: true });

export default mongoose.model("Store", storeSchema);
