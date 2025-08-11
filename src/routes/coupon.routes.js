import { Router } from 'express';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { allowedRole } from '../middleware/allowRole.js';
import {
  createCouponController,
  getCouponsController,
  applyCouponController,
  deleteCouponController
} from '../controllers/couponController.js';

export const couponRouter = Router();

// Create coupon (Admin/Seller)
couponRouter.post('/coupons/create', verifyToken, allowedRole("admin", "seller"), createCouponController);

// Get available coupons
couponRouter.get('/coupons', getCouponsController);

// Apply coupon at checkout
couponRouter.post('/coupons/apply', verifyToken, allowedRole("customer"), applyCouponController);

// Delete coupon
couponRouter.delete('/coupons/:couponId', verifyToken, allowedRole("admin", "seller"), deleteCouponController);
