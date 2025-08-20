import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRoles } from "../middleware/role.middleware.js";
import {
  addWishlistItemController,
  removeWishlistItemController,
  getWishlistController,
  clearWishlistController
} from "../controllers/wishlistController.js";

export const wishlistRouter = Router();

// Customer only
wishlistRouter.post("/add", verifyToken, allowedRoles("customer"), addWishlistItemController);
wishlistRouter.delete("/remove/:productId", verifyToken, allowedRoles("customer"), removeWishlistItemController);
wishlistRouter.get("/", verifyToken, allowedRoles("customer"), getWishlistController);

// Extra
wishlistRouter.delete("/clear", verifyToken, allowedRoles("customer"), clearWishlistController);
