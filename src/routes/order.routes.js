import { Router } from "express";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import { allowedRole } from "../middleware/allowRole.js";
import {
    createOrderController,
    getUserOrdersController,
    getAllOrdersController,
    updateOrderStatusController,
    cancelOrderController
} from "../controllers/order.controllers.js";

export const orderRouter = Router();

orderRouter.post("/", verifyToken, createOrderController);
orderRouter.get("/my-orders", verifyToken, getUserOrdersController);
orderRouter.get("/", verifyToken, allowedRole("admin"), getAllOrdersController);
orderRouter.put("/:id/status", verifyToken, allowedRole("admin"), updateOrderStatusController);
orderRouter.delete("/:id", verifyToken, cancelOrderController);
