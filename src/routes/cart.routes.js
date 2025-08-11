import { Router } from "express";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import {
    addToCartController,
    getCartController,
    updateCartItemController,
    removeCartItemController,
    clearCartController
} from "../controllers/cart.controllers.js";

export const cartRouter = Router();

cartRouter.post("/add", verifyToken, addToCartController);
cartRouter.get("/", verifyToken, getCartController);
cartRouter.put("/update/:productId", verifyToken, updateCartItemController);
cartRouter.delete("/remove/:productId", verifyToken, removeCartItemController);
cartRouter.delete("/clear", verifyToken, clearCartController);
