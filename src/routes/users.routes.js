import { Router } from "express";
import { allowedRole } from "../middleware/role.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
    getAllUsersController,
    getUserByIdController,
    updateUserController,
    deleteUserController
} from "../controllers/user.controllers.js";

export const userRouter = Router();

userRouter.get("/", verifyToken, allowedRole("admin"), getAllUsersController);
userRouter.get("/:id", verifyToken, getUserByIdController);
userRouter.put("/:id", verifyToken, updateUserController);
userRouter.delete("/:id", verifyToken, allowedRole("admin"), deleteUserController);
