import User from "../models/user.model.js";
import Product from "../models/product.model.js"; // Assuming you have a Product model
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Add item to wishlist
 * @route POST /api/wishlist/add
 * @access Private (Customer only)
 */
export const addWishlistItemController = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const userId = req.user._id;

  // Validation
  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Validate productId format
  if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  try {
    // Check if product exists and is active
    const product = await Product.findById(productId).select("name price images isActive seller stock");
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (!product.isActive) {
      throw new ApiError(400, "Cannot add inactive product to wishlist");
    }

    // Prevent adding out of stock products (optional business rule)
    if (product.stock !== undefined && product.stock <= 0) {
      throw new ApiError(400, "Cannot add out of stock product to wishlist");
    }

    // Get user and check wishlist
    const user = await User.findById(userId).select("wishlist");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if product already in wishlist
    const isAlreadyInWishlist = user.wishlist.some(
      wishlistProductId => wishlistProductId.toString() === productId
    );

    if (isAlreadyInWishlist) {
      throw new ApiError(409, "Product is already in your wishlist");
    }

    // Check wishlist limit (max 100 items)
    if (user.wishlist.length >= 100) {
      throw new ApiError(400, "Wishlist is full. Maximum 100 items allowed");
    }

    // Add product to wishlist
    user.wishlist.push(productId);
    await user.save();

    // Optional: Update product's wishlist count (if you have this field in Product model)
    await Product.findByIdAndUpdate(productId, {
      $inc: { wishlistCount: 1 }
    });

    return res.status(200).json(
      new ApiResponse(200, {
        productId,
        productName: product.name,
        productPrice: product.price,
        productImage: product.images?.[0] || null,
        totalWishlistItems: user.wishlist.length,
        addedAt: new Date()
      }, "Product added to wishlist successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error adding product to wishlist", error);
  }
});

/**
 * Remove item from wishlist
 * @route DELETE /api/wishlist/remove/:productId
 * @access Private (Customer only)
 */
export const removeWishlistItemController = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  // Validate productId format
  if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  try {
    // Get user
    const user = await User.findById(userId).select("wishlist");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if product is in wishlist
    const wishlistIndex = user.wishlist.findIndex(
      wishlistProductId => wishlistProductId.toString() === productId
    );

    if (wishlistIndex === -1) {
      throw new ApiError(404, "Product not found in wishlist");
    }

    // Remove product from wishlist
    user.wishlist.splice(wishlistIndex, 1);
    await user.save();

    // Optional: Update product's wishlist count (if you have this field in Product model)
    await Product.findByIdAndUpdate(productId, {
      $inc: { wishlistCount: -1 }
    });

    // Get product info for response (optional)
    const product = await Product.findById(productId).select("name price");

    return res.status(200).json(
      new ApiResponse(200, {
        productId,
        productName: product?.name || "Unknown Product",
        totalWishlistItems: user.wishlist.length,
        removedAt: new Date()
      }, "Product removed from wishlist successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error removing product from wishlist", error);
  }
});

/**
 * Get user's wishlist
 * @route GET /api/wishlist
 * @access Private (Customer only)
 */
export const getWishlistController = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "addedAt",
    sortOrder = "desc",
    category = "all",
    priceMin,
    priceMax,
    availability = "all"
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    // Get user with wishlist
    const user = await User.findById(userId).select("wishlist");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, {
          wishlist: [],
          pagination: {
            currentPage: pageNumber,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: limitNumber
          },
          filters: { search, sortBy, sortOrder, category, priceMin, priceMax, availability },
          summary: {
            totalItems: 0,
            totalValue: 0,
            availableItems: 0,
            outOfStockItems: 0,
            categories: []
          }
        }, "Wishlist is empty")
      );
    }

    // Build filter for products
    const productFilter = {
      _id: { $in: user.wishlist }
    };

    if (search) {
      productFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } }
      ];
    }

    if (category !== "all") {
      productFilter.category = category;
    }

    if (priceMin || priceMax) {
      productFilter.price = {};
      if (priceMin) productFilter.price.$gte = parseFloat(priceMin);
      if (priceMax) productFilter.price.$lte = parseFloat(priceMax);
    }

    if (availability !== "all") {
      if (availability === "available") {
        productFilter.isActive = true;
        productFilter.stock = { $gt: 0 };
      } else if (availability === "out_of_stock") {
        productFilter.$or = [
          { isActive: false },
          { stock: { $lte: 0 } }
        ];
      }
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy === "addedAt") {
      // Sort by the order in user's wishlist array (most recently added first)
      // This is approximate - for exact order, you'd need to store timestamps
      sortOptions._id = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    // Get products with pagination
    const [products, totalProducts] = await Promise.all([
      Product.find(productFilter)
        .select("name description price images category brand isActive stock discount seller createdAt")
        .populate("seller", "name storeName")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Product.countDocuments(productFilter)
    ]);

    const totalPages = Math.ceil(totalProducts / limitNumber);

    // Enrich product data and calculate summary
    let totalValue = 0;
    let availableItems = 0;
    let outOfStockItems = 0;
    const categories = new Set();

    const enrichedWishlist = products.map(product => {
      const finalPrice = product.discount 
        ? product.price - (product.price * product.discount / 100)
        : product.price;
      
      const isAvailable = product.isActive && (product.stock > 0);
      const addedAtIndex = user.wishlist.findIndex(id => id.toString() === product._id.toString());
      
      if (isAvailable) {
        availableItems++;
        totalValue += finalPrice;
      } else {
        outOfStockItems++;
      }
      
      if (product.category) categories.add(product.category);

      return {
        ...product,
        finalPrice,
        originalPrice: product.price,
        savings: product.discount ? (product.price * product.discount / 100) : 0,
        isAvailable,
        addedAtIndex, // Position in wishlist (0 = most recently added)
        inWishlist: true,
        stockStatus: product.stock > 0 ? 'in_stock' : 'out_of_stock'
      };
    });

    // Calculate summary statistics
    const summary = {
      totalItems: user.wishlist.length,
      displayedItems: products.length,
      totalValue: Math.round(totalValue * 100) / 100,
      availableItems,
      outOfStockItems,
      categories: Array.from(categories),
      averagePrice: availableItems > 0 ? Math.round((totalValue / availableItems) * 100) / 100 : 0
    };

    return res.status(200).json(
      new ApiResponse(200, {
        wishlist: enrichedWishlist,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: totalProducts,
          totalWishlistItems: user.wishlist.length,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
          limit: limitNumber
        },
        filters: { search, sortBy, sortOrder, category, priceMin, priceMax, availability },
        summary
      }, "Wishlist retrieved successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error retrieving wishlist", error);
  }
});

/**
 * Clear entire wishlist
 * @route DELETE /api/wishlist/clear
 * @access Private (Customer only)
 */
export const clearWishlistController = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { confirm } = req.body;

  // Require confirmation to prevent accidental clearing
  if (confirm !== "CLEAR_WISHLIST") {
    throw new ApiError(400, "Please confirm by sending 'CLEAR_WISHLIST' in the request body");
  }

  try {
    // Get user
    const user = await User.findById(userId).select("wishlist");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      throw new ApiError(400, "Wishlist is already empty");
    }

    const itemsRemoved = user.wishlist.length;
    const removedItems = [...user.wishlist]; // Store for potential logging/analytics

    // Clear wishlist
    user.wishlist = [];
    await user.save();

    // Optional: Update products' wishlist counts (bulk operation)
    await Product.updateMany(
      { _id: { $in: removedItems } },
      { $inc: { wishlistCount: -1 } }
    );

    return res.status(200).json(
      new ApiResponse(200, {
        itemsRemoved,
        clearedAt: new Date(),
        totalWishlistItems: 0
      }, `Wishlist cleared successfully. ${itemsRemoved} items removed`)
    );

  } catch (error) {
    throw new ApiError(500, "Error clearing wishlist", error);
  }
});

/**
 * Check if product is in wishlist (Bonus utility)
 * @route GET /api/wishlist/check/:productId
 * @access Private (Customer only)
 */
export const checkWishlistItemController = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  // Validate productId format
  if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid product ID format");
  }

  try {
    // Get user wishlist
    const user = await User.findById(userId).select("wishlist");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isInWishlist = user.wishlist.some(
      wishlistProductId => wishlistProductId.toString() === productId
    );

    // Get product info
    const product = await Product.findById(productId).select("name price isActive");

    return res.status(200).json(
      new ApiResponse(200, {
        productId,
        productName: product?.name || "Unknown Product",
        isInWishlist,
        totalWishlistItems: user.wishlist.length,
        productExists: !!product,
        productActive: product?.isActive || false
      }, "Wishlist status checked successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error checking wishlist status", error);
  }
});

/**
 * Get wishlist summary/statistics (Bonus)
 * @route GET /api/wishlist/stats
 * @access Private (Customer only)
 */
export const getWishlistStatsController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId)
      .select("wishlist")
      .populate({
        path: "wishlist",
        select: "name price category isActive stock discount createdAt",
        match: { isActive: true }
      });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const wishlistItems = user.wishlist || [];

    // Calculate statistics
    const stats = {
      totalItems: wishlistItems.length,
      totalOriginalValue: 0,
      totalCurrentValue: 0,
      totalSavings: 0,
      availableItems: 0,
      outOfStockItems: 0,
      categoriesCount: 0,
      averagePrice: 0,
      categoryBreakdown: {},
      priceRanges: {
        under50: 0,
        "50to100": 0,
        "100to500": 0,
        above500: 0
      },
      oldestItem: null,
      newestItem: null,
      mostExpensive: null,
      cheapest: null
    };

    if (wishlistItems.length > 0) {
      const categories = new Set();
      let totalOriginal = 0;
      let totalCurrent = 0;
      let totalSavings = 0;
      let prices = [];

      wishlistItems.forEach(item => {
        const originalPrice = item.price || 0;
        const currentPrice = item.discount 
          ? originalPrice - (originalPrice * item.discount / 100)
          : originalPrice;
        const savings = originalPrice - currentPrice;

        totalOriginal += originalPrice;
        totalCurrent += currentPrice;
        totalSavings += savings;
        prices.push(currentPrice);

        // Availability
        if (item.isActive && item.stock > 0) {
          stats.availableItems++;
        } else {
          stats.outOfStockItems++;
        }

        // Categories
        if (item.category) {
          categories.add(item.category);
          stats.categoryBreakdown[item.category] = (stats.categoryBreakdown[item.category] || 0) + 1;
        }

        // Price ranges
        if (currentPrice < 50) stats.priceRanges.under50++;
        else if (currentPrice < 100) stats.priceRanges["50to100"]++;
        else if (currentPrice < 500) stats.priceRanges["100to500"]++;
        else stats.priceRanges.above500++;
      });

      stats.totalOriginalValue = Math.round(totalOriginal * 100) / 100;
      stats.totalCurrentValue = Math.round(totalCurrent * 100) / 100;
      stats.totalSavings = Math.round(totalSavings * 100) / 100;
      stats.categoriesCount = categories.size;
      stats.averagePrice = Math.round((totalCurrent / wishlistItems.length) * 100) / 100;

      // Find extreme items
      const sortedByPrice = [...wishlistItems].sort((a, b) => a.price - b.price);
      const sortedByDate = [...wishlistItems].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      stats.cheapest = sortedByPrice[0] ? {
        id: sortedByPrice[0]._id,
        name: sortedByPrice[0].name,
        price: sortedByPrice[0].price
      } : null;

      stats.mostExpensive = sortedByPrice[sortedByPrice.length - 1] ? {
        id: sortedByPrice[sortedByPrice.length - 1]._id,
        name: sortedByPrice[sortedByPrice.length - 1].name,
        price: sortedByPrice[sortedByPrice.length - 1].price
      } : null;

      stats.oldestItem = sortedByDate[0] ? {
        id: sortedByDate[0]._id,
        name: sortedByDate[0].name,
        addedDate: sortedByDate[0].createdAt
      } : null;

      stats.newestItem = sortedByDate[sortedByDate.length - 1] ? {
        id: sortedByDate[sortedByDate.length - 1]._id,
        name: sortedByDate[sortedByDate.length - 1].name,
        addedDate: sortedByDate[sortedByDate.length - 1].createdAt
      } : null;
    }

    return res.status(200).json(
      new ApiResponse(200, stats, "Wishlist statistics retrieved successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error retrieving wishlist statistics", error);
  }
});