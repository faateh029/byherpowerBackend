import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  discountPrice: { // optional for sales/discounts
    type: Number,
    min: 0
  },
  stock: { 
    type: Number, 
    required: true,
    min: 0
  },
  images: [{ // product images
    type: String // store image URLs
  }],
  store: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Store", 
    required: true 
  },
  category: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category", 
    required: true 
  }],
  tags: [{ // for search optimization
    type: String,
    trim: true
  }],
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Review" 
  }],
  averageRating: { // to avoid calculating every time
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  isActive: { // hide/unhide product
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

export default mongoose.model("Product", productSchema);
