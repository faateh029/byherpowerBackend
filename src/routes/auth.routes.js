import { Router } from "express";
import { allowedRole } from "../middleware/role.middleware.js";
import { verifyToken } from "../middleware/auth.middleware.js";

import {
    signupController,
    loginController,
    logoutController,
    forgotPasswordController,
    resetPasswordController,
    changePasswordController
} from "../controllers/auth.controllers.js";

export const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);
authRouter.post("/logout", verifyToken, logoutController);
authRouter.post("/forgot-password", forgotPasswordController);
authRouter.post("/reset-password", resetPasswordController);
authRouter.post("/change-password", verifyToken, changePasswordController);
