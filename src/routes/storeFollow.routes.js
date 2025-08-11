import { Router } from 'express';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { allowedRole } from '../middleware/allowRole.js';
import {
  followStoreController,
  unfollowStoreController,
  getFollowedStoresController
} from '../controllers/storeFollowController.js';

export const storeFollowRouter = Router();

// Follow a store
storeFollowRouter.post('/stores/:storeId/follow', verifyToken, allowedRole("customer"), followStoreController);

// Unfollow a store
storeFollowRouter.delete('/stores/:storeId/unfollow', verifyToken, allowedRole("customer"), unfollowStoreController);

// Get all followed stores
storeFollowRouter.get('/stores/followed', verifyToken, allowedRole("customer"), getFollowedStoresController);
