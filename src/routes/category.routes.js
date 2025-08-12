import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRole } from "../middleware/role.middleware.js";
import {
    createCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    updateCategoryController,
    deleteCategoryController
} from "../controllers/category.controllers.js";

export const categoryRouter = Router();

categoryRouter.post("/", verifyToken, allowedRole("admin"), createCategoryController);
categoryRouter.get("/", getAllCategoriesController);
categoryRouter.get("/:id", getCategoryByIdController);
categoryRouter.put("/:id", verifyToken, allowedRole("admin"), updateCategoryController);
categoryRouter.delete("/:id", verifyToken, allowedRole("admin"), deleteCategoryController);
