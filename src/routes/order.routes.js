import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRoles } from "../middleware/role.middleware.js";
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
orderRouter.get("/", verifyToken, allowedRoles("admin"), getAllOrdersController);
orderRouter.put("/:id/status", verifyToken, allowedRoles("admin"), updateOrderStatusController);
orderRouter.delete("/:id", verifyToken, cancelOrderController);
