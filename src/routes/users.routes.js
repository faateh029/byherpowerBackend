import { Router } from "express";
import { allowedRoles } from "../middleware/role.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  updateProfileController,
  updatePasswordController,
  deactivateAccountController,
  addAddressController,
  updateAddressController,
  deleteAddressController,
  setDefaultAddressController,
  getMyProfileController
} from "../controllers/user.controllers.js";

export const userRouter = Router();

// Admin-only
userRouter.get("/", verifyToken, allowedRoles("admin"), getAllUsersController);
userRouter.delete("/:id", verifyToken, allowedRoles("admin"), deleteUserController);

// Authenticated user
userRouter.get("/me", verifyToken, getMyProfileController);
userRouter.put("/me", verifyToken, updateProfileController);
userRouter.put("/me/password", verifyToken, updatePasswordController);
userRouter.put("/me/deactivate", verifyToken, deactivateAccountController);

// Address management
userRouter.post("/me/addresses", verifyToken, addAddressController);
userRouter.put("/me/addresses/:addressId", verifyToken, updateAddressController);
userRouter.delete("/me/addresses/:addressId", verifyToken, deleteAddressController);
userRouter.put("/me/addresses/:addressId/default", verifyToken, setDefaultAddressController);

// Public
userRouter.get("/:id", verifyToken, getUserByIdController);
