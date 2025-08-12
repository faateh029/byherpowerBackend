import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRole } from '../middleware/role.middleware.js';
import {
  createCouponController,
  getCouponsController,
  applyCouponController,
  deleteCouponController
} from '../controllers/couponController.js';

export const couponRouter = Router();

// Create coupon (Admin/Seller)
couponRouter.post('/create', verifyToken, allowedRole("admin", "seller"), createCouponController);

// Get available coupons
couponRouter.get('/', getCouponsController);

// Apply coupon at checkout
couponRouter.post('/apply', verifyToken, allowedRole("customer"), applyCouponController);

// Delete coupon
couponRouter.delete('/:couponId', verifyToken, allowedRole("admin", "seller"), deleteCouponController);
