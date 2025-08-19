import { Router } from "express";
import { allowedRoles } from "../middleware/role.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    getAllUsersController,
    getUserByIdController,
    updateUserController,
    deleteUserController
} from "../controllers/user.controllers.js";

export const userRouter = Router();

userRouter.get("/", verifyToken, allowedRoles("admin"), getAllUsersController);
userRouter.get("/:id", verifyToken, getUserByIdController);
userRouter.put("/:id", verifyToken, updateUserController);
userRouter.delete("/:id", verifyToken, allowedRoles("admin"), deleteUserController);
