import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { allowedRoles } from "../middleware/role.middleware.js";
import {
  followStoreController,
  unfollowStoreController,
  getFollowedStoresController,
  isFollowingStoreController
} from "../controllers/storeFollowController.js";

export const storeFollowRouter = Router();

// Customer only
storeFollowRouter.post("/:storeId/follow", verifyToken, allowedRoles("customer"), followStoreController);
storeFollowRouter.delete("/:storeId/unfollow", verifyToken, allowedRoles("customer"), unfollowStoreController);
storeFollowRouter.get("/followed", verifyToken, allowedRoles("customer"), getFollowedStoresController);

// Extra
storeFollowRouter.get("/:storeId/is-following", verifyToken, allowedRoles("customer"), isFollowingStoreController);
