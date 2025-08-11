import express from "express";
import dotenv from "dotenv";
import  errorHandler from "./middleware/error.middleware.js";
import connectDB from "./config/db.js";
import requestLogger from "./middleware/requestLogger.middleware.js";
dotenv.config();
connectDB();
const app = express();
app.use(express.json());
app.use(requestLogger);
app.get("/", (req, res) => {
    res.send("Server is running");
});
app.use(errorHandler);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
