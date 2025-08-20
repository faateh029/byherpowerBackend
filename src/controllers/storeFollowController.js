import User from "../models/user.model.js";
import Store from "../models/store.model.js"; // Assuming you have a Store model
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Follow a store
 * @route POST /api/store-follow/:storeId/follow
 * @access Private (Customer only)
 */
export const followStoreController = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user._id;

  // Validate storeId format
  if (!storeId || !storeId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid store ID format");
  }

  try {
    // Check if store exists and is active
    const store = await Store.findById(storeId).select("name storeName isActive owner");
    if (!store) {
      throw new ApiError(404, "Store not found");
    }

    if (!store.isActive) {
      throw new ApiError(400, "Cannot follow inactive store");
    }

    // Prevent user from following their own store
    if (store.owner && store.owner.toString() === userId.toString()) {
      throw new ApiError(400, "You cannot follow your own store");
    }

    // Get user and check if already following
    const user = await User.findById(userId).select("followingStores");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if already following
    const isAlreadyFollowing = user.followingStores.some(
      followedStoreId => followedStoreId.toString() === storeId
    );

    if (isAlreadyFollowing) {
      throw new ApiError(409, "You are already following this store");
    }

    // Check following limit (max 100 stores)
    if (user.followingStores.length >= 100) {
      throw new ApiError(400, "Maximum 100 stores can be followed");
    }

    // Add store to following list
    user.followingStores.push(storeId);
    await user.save();

    // Optional: Update store's follower count (if you have this field in Store model)
    await Store.findByIdAndUpdate(storeId, {
      $inc: { followersCount: 1 }
    });

    return res.status(200).json(
      new ApiResponse(200, {
        storeId,
        storeName: store.name || store.storeName,
        totalFollowing: user.followingStores.length,
        isFollowing: true
      }, "Store followed successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error following store", error);
  }
});

/**
 * Unfollow a store
 * @route DELETE /api/store-follow/:storeId/unfollow
 * @access Private (Customer only)
 */
export const unfollowStoreController = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user._id;

  // Validate storeId format
  if (!storeId || !storeId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid store ID format");
  }

  try {
    // Get user
    const user = await User.findById(userId).select("followingStores");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if following the store
    const followingIndex = user.followingStores.findIndex(
      followedStoreId => followedStoreId.toString() === storeId
    );

    if (followingIndex === -1) {
      throw new ApiError(409, "You are not following this store");
    }

    // Remove store from following list
    user.followingStores.splice(followingIndex, 1);
    await user.save();

    // Optional: Update store's follower count (if you have this field in Store model)
    await Store.findByIdAndUpdate(storeId, {
      $inc: { followersCount: -1 }
    });

    // Get store info for response
    const store = await Store.findById(storeId).select("name storeName");
    
    return res.status(200).json(
      new ApiResponse(200, {
        storeId,
        storeName: store ? (store.name || store.storeName) : "Unknown Store",
        totalFollowing: user.followingStores.length,
        isFollowing: false
      }, "Store unfollowed successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error unfollowing store", error);
  }
});

/**
 * Get followed stores
 * @route GET /api/store-follow/followed
 * @access Private (Customer only)
 */
export const getFollowedStoresController = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "followedAt",
    sortOrder = "desc",
    category = "all",
    isActive = "true"
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    // Get user with populated following stores
    const user = await User.findById(userId).select("followingStores");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.followingStores || user.followingStores.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, {
          stores: [],
          pagination: {
            currentPage: pageNumber,
            totalPages: 0,
            totalStores: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: limitNumber
          },
          filters: { search, sortBy, sortOrder, category, isActive }
        }, "No followed stores found")
      );
    }

    // Build filter for stores
    const storeFilter = {
      _id: { $in: user.followingStores }
    };

    if (search) {
      storeFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { storeName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (category !== "all") {
      storeFilter.category = category;
    }

    if (isActive !== "all") {
      storeFilter.isActive = isActive === "true";
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy === "followedAt") {
      // Sort by the order in user's followingStores array (most recently followed first)
      sortOptions._id = sortOrder === "desc" ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    // Get stores with pagination
    const [stores, totalStores] = await Promise.all([
      Store.find(storeFilter)
        .select("name storeName description category isActive createdAt followersCount owner")
        .populate("owner", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      Store.countDocuments(storeFilter)
    ]);

    const totalPages = Math.ceil(totalStores / limitNumber);

    // Enrich store data
    const enrichedStores = stores.map(store => ({
      ...store,
      displayName: store.name || store.storeName,
      followedAt: user.followingStores.indexOf(store._id), // Index in following array
      storeAge: Math.floor((Date.now() - store.createdAt) / (1000 * 60 * 60 * 24)), // days
      isFollowing: true
    }));

    return res.status(200).json(
      new ApiResponse(200, {
        stores: enrichedStores,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalStores,
          totalFollowing: user.followingStores.length,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
          limit: limitNumber
        },
        filters: { search, sortBy, sortOrder, category, isActive }
      }, "Followed stores retrieved successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error retrieving followed stores", error);
  }
});

/**
 * Check if following a store
 * @route GET /api/store-follow/:storeId/is-following
 * @access Private (Customer only)
 */
export const isFollowingStoreController = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user._id;

  // Validate storeId format
  if (!storeId || !storeId.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid store ID format");
  }

  try {
    // Check if store exists
    const store = await Store.findById(storeId).select("name storeName isActive");
    if (!store) {
      throw new ApiError(404, "Store not found");
    }

    // Get user and check if following
    const user = await User.findById(userId).select("followingStores");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isFollowing = user.followingStores.some(
      followedStoreId => followedStoreId.toString() === storeId
    );

    return res.status(200).json(
      new ApiResponse(200, {
        storeId,
        storeName: store.name || store.storeName,
        isActive: store.isActive,
        isFollowing,
        totalFollowing: user.followingStores.length
      }, "Following status retrieved successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error checking following status", error);
  }
});

/**
 * Get store followers (Bonus - for store owners/admins)
 * @route GET /api/stores/:storeId/followers
 * @access Private (Store Owner/Admin)
 */
export const getStoreFollowersController = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const {
    page = 1,
    limit = 10,
    search = "",
    sortBy = "followedAt",
    sortOrder = "desc"
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  try {
    // Check if store exists and user has permission
    const store = await Store.findById(storeId).select("name storeName owner");
    if (!store) {
      throw new ApiError(404, "Store not found");
    }

    // Only store owner or admin can view followers
    if (req.user.role !== "admin" && store.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access denied. You can only view your own store's followers");
    }

    // Build filter for users who follow this store
    const userFilter = {
      followingStores: storeId,
      isActive: true
    };

    if (search) {
      userFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Build sort options
    const sortOptions = {};
    if (sortBy === "followedAt") {
      sortOptions.createdAt = sortOrder === "desc" ? -1 : 1; // Approximate
    } else {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    // Get followers
    const [followers, totalFollowers] = await Promise.all([
      User.find(userFilter)
        .select("name email createdAt")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(userFilter)
    ]);

    const totalPages = Math.ceil(totalFollowers / limitNumber);

    return res.status(200).json(
      new ApiResponse(200, {
        store: {
          id: store._id,
          name: store.name || store.storeName
        },
        followers,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalFollowers,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
          limit: limitNumber
        },
        filters: { search, sortBy, sortOrder }
      }, "Store followers retrieved successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error retrieving store followers", error);
  }
});

/**
 * Get following statistics (Bonus - for user dashboard)
 * @route GET /api/store-follow/stats
 * @access Private (Customer only)
 */
export const getFollowingStatsController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId)
      .select("followingStores")
      .populate({
        path: "followingStores",
        select: "name storeName category isActive createdAt",
        match: { isActive: true }
      });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const followedStores = user.followingStores || [];
    
    // Calculate statistics
    const stats = {
      totalFollowing: followedStores.length,
      activeStores: followedStores.filter(store => store.isActive).length,
      inactiveStores: followedStores.filter(store => !store.isActive).length,
      categoriesFollowed: [...new Set(followedStores.map(store => store.category))].length,
      recentlyFollowed: followedStores
        .filter(store => {
          const daysDiff = (Date.now() - store.createdAt) / (1000 * 60 * 60 * 24);
          return daysDiff <= 30; // Followed in last 30 days (approximate)
        })
        .length,
      categoryBreakdown: followedStores.reduce((acc, store) => {
        const category = store.category || "Uncategorized";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    };

    return res.status(200).json(
      new ApiResponse(200, stats, "Following statistics retrieved successfully")
    );

  } catch (error) {
    throw new ApiError(500, "Error retrieving following statistics", error);
  }
});