import { Router } from "express";
import { verifyToken } from "../middleware/jwtMiddleware.js";
import {
    createReviewController,
    getReviewsByProductController,
    updateReviewController,
    deleteReviewController
} from "../controllers/review.controllers.js";

export const reviewRouter = Router();

reviewRouter.post("/", verifyToken, createReviewController);
reviewRouter.get("/:productId", getReviewsByProductController);
reviewRouter.put("/:id", verifyToken, updateReviewController);
reviewRouter.delete("/:id", verifyToken, deleteReviewController);
