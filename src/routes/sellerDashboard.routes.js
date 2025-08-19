import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRoles } from '../middleware/role.middleware.js';
import {
  getSellerSalesSummaryController,
  getSellerInventoryStatsController
} from '../controllers/sellerDashboardController.js';

export const sellerDashboardRouter = Router();

// Seller sales summary
sellerDashboardRouter.get('/sales-summary', verifyToken, allowedRoles("seller"), getSellerSalesSummaryController);

// Seller inventory stats
sellerDashboardRouter.get('/inventory', verifyToken, allowedRoles("seller"), getSellerInventoryStatsController);
