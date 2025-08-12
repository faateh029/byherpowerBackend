import express from "express";
import dotenv from "dotenv";
import{authRouter} from './routes/auth.routes.js';
import  errorHandler from "./middleware/error.middleware.js";
import connectDB from "./config/db.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
import { cartRouter } from "./routes/cart.routes.js";
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(requestLogger);
app.use("/auth", authRouter);
app.use('/cart' , cartRouter);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
