import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRoles } from "../middleware/role.middleware.js";
import {
    createProductController,
    getAllProductsController,
    getProductByIdController,
    updateProductController,
    deleteProductController
} from "../controllers/product.controllers.js";

export const productRouter = Router();

productRouter.post("/", verifyToken, allowedRoles("seller"), createProductController);
productRouter.get("/", getAllProductsController);
productRouter.get("/:id", getProductByIdController);
productRouter.put("/:id", verifyToken, allowedRoles("seller"), updateProductController);
productRouter.delete("/:id", verifyToken, allowedRoles("seller"), deleteProductController);
