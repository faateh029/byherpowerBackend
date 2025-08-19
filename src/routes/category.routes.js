import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRoles } from "../middleware/role.middleware.js";
import {
    createCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    updateCategoryController,
    deleteCategoryController
} from "../controllers/category.controllers.js";

export const categoryRouter = Router();

categoryRouter.post("/", verifyToken, allowedRoles("admin"), createCategoryController);
categoryRouter.get("/", getAllCategoriesController);
categoryRouter.get("/:id", getCategoryByIdController);
categoryRouter.put("/:id", verifyToken, allowedRoles("admin"), updateCategoryController);
categoryRouter.delete("/:id", verifyToken, allowedRoles("admin"), deleteCategoryController);
