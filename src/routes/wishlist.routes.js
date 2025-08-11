import { Router } from 'express';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { allowedRole } from '../middleware/allowRole.js';
import {
  addWishlistItemController,
  removeWishlistItemController,
  getWishlistController
} from '../controllers/wishlistController.js';

export const wishlistRouter = Router();

// Add product to wishlist
wishlistRouter.post('/wishlist/add', verifyToken, allowedRole("customer"), addWishlistItemController);

// Remove product from wishlist
wishlistRouter.delete('/wishlist/remove/:productId', verifyToken, allowedRole("customer"), removeWishlistItemController);

// Get customer's wishlist
wishlistRouter.get('/wishlist', verifyToken, allowedRole("customer"), getWishlistController);
