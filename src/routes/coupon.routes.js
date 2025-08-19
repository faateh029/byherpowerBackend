import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRoles } from '../middleware/role.middleware.js';
import {
  createCouponController,
  getCouponsController,
  applyCouponController,
  deleteCouponController
} from '../controllers/couponController.js';

export const couponRouter = Router();

// Create coupon (Admin/Seller)
couponRouter.post('/create', verifyToken, allowedRoles("admin", "seller"), createCouponController);

// Get available coupons
couponRouter.get('/', getCouponsController);

// Apply coupon at checkout
couponRouter.post('/apply', verifyToken, allowedRoles("customer"), applyCouponController);

// Delete coupon
couponRouter.delete('/:couponId', verifyToken, allowedRoles("admin", "seller"), deleteCouponController);
