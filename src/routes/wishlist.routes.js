import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRoles } from '../middleware/role.middleware.js';
import {
  addWishlistItemController,
  removeWishlistItemController,
  getWishlistController
} from '../controllers/wishlistController.js';

export const wishlistRouter = Router();

// Add product to wishlist
wishlistRouter.post('/add', verifyToken, allowedRoles("customer"), addWishlistItemController);

// Remove product from wishlist
wishlistRouter.delete('/remove/:productId', verifyToken, allowedRoles("customer"), removeWishlistItemController);

// Get customer's wishlist
wishlistRouter.get('/', verifyToken, allowedRoles("customer"), getWishlistController);
