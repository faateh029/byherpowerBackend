import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRole } from '../middleware/role.middleware.js';
import {
  followStoreController,
  unfollowStoreController,
  getFollowedStoresController
} from '../controllers/storeFollowController.js';

export const storeFollowRouter = Router();

// Follow a store
storeFollowRouter.post('/:storeId/follow', verifyToken, allowedRole("customer"), followStoreController);

// Unfollow a store
storeFollowRouter.delete('/:storeId/unfollow', verifyToken, allowedRole("customer"), unfollowStoreController);

// Get all followed stores
storeFollowRouter.get('/followed', verifyToken, allowedRole("customer"), getFollowedStoresController);
