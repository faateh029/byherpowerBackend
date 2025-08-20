import mongoose from "mongoose";

const connectDB = async()=>{
    const conn = await mongoose.connect("mongodb://127.0.0.1:27017/byherpower", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));
}
export default connectDB ; 

// const connectDB = async () => {
//   try {
//     const conn = await mongoose.connect(process.env.MONGO_URL);

//     console.log(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`MongoDB Connection Error: ${error.message}`);
//     process.exit(1); 
//   }
// };

