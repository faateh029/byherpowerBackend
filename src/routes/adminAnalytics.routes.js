import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRoles } from '../middleware/role.middleware.js';
import {
  getSalesReportController,
  getTopProductsController,
  getTopSellersController,
  getRevenueReportController
} from '../controllers/adminAnalyticsController.js';

export const adminAnalyticsRouter = Router();

// Sales report
adminAnalyticsRouter.get('/analytics/sales', verifyToken, allowedRoles("admin"), getSalesReportController);

// Top products
adminAnalyticsRouter.get('/analytics/top-products', verifyToken, allowedRoles("admin"), getTopProductsController);

// Top sellers
adminAnalyticsRouter.get('/analytics/top-sellers', verifyToken, allowedRoles("admin"), getTopSellersController);

// Revenue report
adminAnalyticsRouter.get('/analytics/revenue', verifyToken, allowedRoles("admin"), getRevenueReportController);
