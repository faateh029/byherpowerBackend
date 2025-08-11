import { Router } from 'express';
import { verifyToken } from '../middleware/jwtMiddleware.js';
import { allowedRole } from '../middleware/allowRole.js';
import {
  getSalesReportController,
  getTopProductsController,
  getTopSellersController,
  getRevenueReportController
} from '../controllers/adminAnalyticsController.js';

export const adminAnalyticsRouter = Router();

// Sales report
adminAnalyticsRouter.get('/admin/analytics/sales', verifyToken, allowedRole("admin"), getSalesReportController);

// Top products
adminAnalyticsRouter.get('/admin/analytics/top-products', verifyToken, allowedRole("admin"), getTopProductsController);

// Top sellers
adminAnalyticsRouter.get('/admin/analytics/top-sellers', verifyToken, allowedRole("admin"), getTopSellersController);

// Revenue report
adminAnalyticsRouter.get('/admin/analytics/revenue', verifyToken, allowedRole("admin"), getRevenueReportController);
