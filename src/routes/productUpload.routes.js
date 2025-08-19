import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { allowedRoles } from '../middleware/role.middleware.js';
import multer from 'multer';
import { uploadProductImageController } from '../controllers/productUploadController.js';

const upload = multer({ dest: 'uploads/products/' }); // You can customize storage

export const productUploadRouter = Router();

// Upload product image
productUploadRouter.post(
  '/products/:productId/upload-image',
  verifyToken,
  allowedRoles("seller"),
  upload.single('image'),
  uploadProductImageController
);
