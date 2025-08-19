import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRoles } from '../middleware/role.middleware.js';
import {
  followStoreController,
  unfollowStoreController,
  getFollowedStoresController
} from '../controllers/storeFollowController.js';

export const storeFollowRouter = Router();

// Follow a store
storeFollowRouter.post('/:storeId/follow', verifyToken, allowedRoles("customer"), followStoreController);

// Unfollow a store
storeFollowRouter.delete('/:storeId/unfollow', verifyToken, allowedRoles("customer"), unfollowStoreController);

// Get all followed stores
storeFollowRouter.get('/followed', verifyToken, allowedRoles("customer"), getFollowedStoresController);
