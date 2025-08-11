import { Router } from "express";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import { allowedRole } from "../middleware/allowRole.js";
import {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    updateProductController,
    deleteProductController
} from "../controllers/product.controllers.js";

export const productRouter = Router();

productRouter.post("/", verifyToken, allowedRole("seller"), createProductController);
productRouter.get("/", getAllProductsController);
productRouter.get("/:id", getProductByIdController);
productRouter.put("/:id", verifyToken, allowedRole("seller"), updateProductController);
productRouter.delete("/:id", verifyToken, allowedRole("seller"), deleteProductController);
