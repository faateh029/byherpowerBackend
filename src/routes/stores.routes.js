import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRoles } from "../middleware/role.middleware.js";
import {
    createStoreController,
    getAllStoresController,
    getStoreByIdController,
    updateStoreController,
    deleteStoreController
} from "../controllers/store.controllers.js";

export const storeRouter = Router();

storeRouter.post("/", verifyToken, allowedRoles("seller"), createStoreController);
storeRouter.get("/", getAllStoresController);
storeRouter.get("/:id", getStoreByIdController);
storeRouter.put("/:id", verifyToken, allowedRoles("seller"), updateStoreController);
storeRouter.delete("/:id", verifyToken, allowedRoles("seller"), deleteStoreController);
