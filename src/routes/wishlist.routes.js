import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRole } from '../middleware/role.middleware.js';
import {
  addWishlistItemController,
  removeWishlistItemController,
  getWishlistController
} from '../controllers/wishlistController.js';

export const wishlistRouter = Router();

// Add product to wishlist
wishlistRouter.post('/add', verifyToken, allowedRole("customer"), addWishlistItemController);

// Remove product from wishlist
wishlistRouter.delete('/remove/:productId', verifyToken, allowedRole("customer"), removeWishlistItemController);

// Get customer's wishlist
wishlistRouter.get('/', verifyToken, allowedRole("customer"), getWishlistController);
