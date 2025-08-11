const productSchema = new mongoose.Schema({
  name: { 
     type: String, 
     required: true 
      }  ,
  description: {
     type: String 
    },
  price: { 
    type: Number, 
    required: true 
         },
  stock: { 
    type: Number, 
    required: true 
         } ,
  store: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Store", required: true 
},
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category", required: true 
            },
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Review" 
           }]
}, { 
    timestamps: true 
   });

export default mongoose.model("Product", productSchema);
