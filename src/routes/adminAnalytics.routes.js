import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRole } from '../middleware/role.middleware.js';
import {
  getSalesReportController,
  getTopProductsController,
  getTopSellersController,
  getRevenueReportController
} from '../controllers/adminAnalyticsController.js';

export const adminAnalyticsRouter = Router();

// Sales report
adminAnalyticsRouter.get('/analytics/sales', verifyToken, allowedRole("admin"), getSalesReportController);

// Top products
adminAnalyticsRouter.get('/analytics/top-products', verifyToken, allowedRole("admin"), getTopProductsController);

// Top sellers
adminAnalyticsRouter.get('/analytics/top-sellers', verifyToken, allowedRole("admin"), getTopSellersController);

// Revenue report
adminAnalyticsRouter.get('/analytics/revenue', verifyToken, allowedRole("admin"), getRevenueReportController);
