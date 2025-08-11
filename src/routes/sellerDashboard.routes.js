import { Router } from 'express';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { allowedRole } from '../middleware/allowRole.js';
import {
  getSellerSalesSummaryController,
  getSellerInventoryStatsController
} from '../controllers/sellerDashboardController.js';

export const sellerDashboardRouter = Router();

// Seller sales summary
sellerDashboardRouter.get('/seller/dashboard/sales-summary', verifyToken, allowedRole("seller"), getSellerSalesSummaryController);

// Seller inventory stats
sellerDashboardRouter.get('/seller/dashboard/inventory', verifyToken, allowedRole("seller"), getSellerInventoryStatsController);
