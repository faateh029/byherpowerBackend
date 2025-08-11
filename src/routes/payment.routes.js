import { Router } from "express";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import {
    initiatePaymentController,
    verifyPaymentController,
    getPaymentStatusController
} from "../controllers/payment.controllers.js";

export const paymentRouter = Router();

paymentRouter.post("/initiate", verifyToken, initiatePaymentController);
paymentRouter.post("/verify", verifyToken, verifyPaymentController);
paymentRouter.get("/status/:paymentId", verifyToken, getPaymentStatusController);
