import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Get all users (Admin only)
 * @route GET /api/users
 * @access Private (Admin)
 */
export const getAllUsersController = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "all",
    sortBy = "createdAt",
    sortOrder = "desc",
    role = "all",
    isVerified = "all"
  } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  const skip = (pageNumber - 1) * limitNumber;

  // Build filter query
  const filter = {};
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ];
  }

  if (status !== "all") {
    filter.isActive = status === "active";
  }

  if (role !== "all") {
    filter.role = role;
  }

  if (isVerified !== "all") {
    filter.isVerified = isVerified === "true";
  }

  // Build sort query
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

  try {
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -loginAttempts -lockUntil -passwordChangedAt")
        .populate("store", "name storeName isActive")
        .populate("cart", "totalItems totalAmount")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalUsers / limitNumber);
    
    // Add derived fields
    const enrichedUsers = users.map(user => ({
      ...user,
      totalAddresses: user.address?.length || 0,
      defaultAddress: user.address?.find(addr => addr.isDefault) || null,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)), // days
      wishlistCount: user.wishlist?.length || 0,
      followingCount: user.followingStores?.length || 0
    }));

    return res.status(200).json(
      new ApiResponse(200, {
        users: enrichedUsers,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalUsers,
          hasNextPage: pageNumber < totalPages,
          hasPrevPage: pageNumber > 1,
          limit: limitNumber
        },
        filters: { search, status, role, isVerified, sortBy, sortOrder }
      }, "Users retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error retrieving users", error);
  }
});

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserByIdController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requestingUser = req.user;

  // Users can only view their own profile unless they're admin
  if (requestingUser.role !== "admin" && requestingUser._id.toString() !== id) {
    throw new ApiError(403, "Access denied. You can only view your own profile");
  }

  try {
    let selectFields = "-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -loginAttempts -lockUntil -passwordChangedAt";
    
    // If not admin and not own profile, hide sensitive fields
    if (requestingUser.role !== "admin" && requestingUser._id.toString() !== id) {
      selectFields += " -phone -address -wishlist -followingStores";
    }

    const user = await User.findById(id)
      .select(selectFields)
      .populate("store", "name storeName isActive createdAt")
      .populate("cart", "totalItems totalAmount")
      .populate("wishlist", "name price images isActive")
      .populate("followingStores", "name storeName isActive")
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (!user.isActive && requestingUser.role !== "admin") {
      throw new ApiError(404, "User not found");
    }

    // Add derived fields
    const enrichedUser = {
      ...user,
      totalAddresses: user.address?.length || 0,
      defaultAddress: user.address?.find(addr => addr.isDefault) || null,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
      wishlistCount: user.wishlist?.length || 0,
      followingCount: user.followingStores?.length || 0
    };

    return res.status(200).json(
      new ApiResponse(200, enrichedUser, "User retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error retrieving user", error);
  }
});

/**
 * Update user (Admin only)
 * @route PUT /api/users/:id
 * @access Private (Admin)
 */
export const updateUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, isActive, isVerified } = req.body;

  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (emailExists) {
        throw new ApiError(409, "Email is already registered");
      }
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone;
    if (role && ["customer", "seller", "admin"].includes(role)) {
      updateData.role = role;
    }
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (typeof isVerified === "boolean") updateData.isVerified = isVerified;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -loginAttempts -lockUntil -passwordChangedAt");

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "User updated successfully")
    );
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Email is already registered");
    }
    throw new ApiError(500, "Error updating user", error);
  }
});

/**
 * Delete user (Admin only)
 * @route DELETE /api/users/:id
 * @access Private (Admin)
 */
export const deleteUserController = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permanent = false } = req.query;

  try {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      throw new ApiError(400, "You cannot delete your own account");
    }

    if (permanent === "true") {
      // Permanent deletion
      await User.findByIdAndDelete(id);
      return res.status(200).json(
        new ApiResponse(200, null, "User permanently deleted")
      );
    } else {
      // Soft deletion - deactivate account
      const deactivatedUser = await User.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
        },
        { new: true }
      ).select("-password");

      return res.status(200).json(
        new ApiResponse(200, deactivatedUser, "User account deactivated")
      );
    }
  } catch (error) {
    throw new ApiError(500, "Error deleting user", error);
  }
});

/**
 * Get my profile
 * @route GET /api/users/me
 * @access Private
 */
export const getMyProfileController = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -loginAttempts -lockUntil -passwordChangedAt")
      .populate("store", "name storeName isActive createdAt")
      .populate("cart", "totalItems totalAmount")
      .populate({
        path: "wishlist",
        select: "name price images isActive",
        match: { isActive: true }
      })
      .populate({
        path: "followingStores", 
        select: "name storeName isActive",
        match: { isActive: true }
      })
      .lean();

    if (!user || !user.isActive) {
      throw new ApiError(404, "User not found");
    }

    // Add derived fields
    const enrichedUser = {
      ...user,
      totalAddresses: user.address?.length || 0,
      defaultAddress: user.address?.find(addr => addr.isDefault) || null,
      accountAge: Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)),
      wishlistCount: user.wishlist?.length || 0,
      followingCount: user.followingStores?.length || 0
    };

    return res.status(200).json(
      new ApiResponse(200, enrichedUser, "Profile retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error retrieving profile", error);
  }
});

/**
 * Update profile
 * @route PUT /api/users/me
 * @access Private
 */
export const updateProfileController = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  try {
    const userId = req.user._id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      if (emailExists) {
        throw new ApiError(409, "Email is already registered");
      }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) {
      updateData.email = email.toLowerCase().trim();
      updateData.isVerified = false; // Reset email verification if email changed
    }
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire -loginAttempts -lockUntil -passwordChangedAt");

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "Profile updated successfully")
    );
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Email is already registered");
    }
    throw new ApiError(500, "Error updating profile", error);
  }
});

/**
 * Update password
 * @route PUT /api/users/me/password
 * @access Private
 */
export const updatePasswordController = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new ApiError(400, "Please provide current password, new password, and confirm password");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "New password and confirm password do not match");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters long");
  }

  if (currentPassword === newPassword) {
    throw new ApiError(400, "New password must be different from current password");
  }

  try {
    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check current password
    const isCurrentPasswordValid = await user.correctPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json(
      new ApiResponse(200, null, "Password updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error updating password", error);
  }
});

/**
 * Deactivate account
 * @route PUT /api/users/me/deactivate
 * @access Private
 */
export const deactivateAccountController = asyncHandler(async (req, res) => {
  const { password, reason } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required to deactivate account");
  }

  try {
    // Get user with password field
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Verify password
    const isPasswordValid = await user.correctPassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid password");
    }

    // Prevent admin from deactivating their account if they're the only admin
    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin", isActive: true });
      if (adminCount <= 1) {
        throw new ApiError(400, "Cannot deactivate the last admin account");
      }
    }

    // Deactivate account
    user.isActive = false;
    user.email = `deactivated_${Date.now()}_${user.email}`; // Prevent email conflicts
    await user.save();

    // Log deactivation reason if provided
    if (reason) {
      console.log(`User ${user._id} deactivated account. Reason: ${reason}`);
    }

    return res.status(200).json(
      new ApiResponse(200, null, "Account deactivated successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error deactivating account", error);
  }
});

/**
 * Add address
 * @route POST /api/users/me/addresses
 * @access Private
 */
export const addAddressController = asyncHandler(async (req, res) => {
  const { street, city, state, postalCode, country, isDefault = false } = req.body;

  // Validation
  if (!street || !city || !postalCode || !country) {
    throw new ApiError(400, "Street, city, postal code, and country are required");
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check address limit (max 5 addresses per user)
    if (user.address && user.address.length >= 5) {
      throw new ApiError(400, "Maximum 5 addresses allowed per user");
    }

    // If this is the first address or isDefault is true, make it default
    const shouldBeDefault = isDefault || !user.address || user.address.length === 0;
    
    // If making this default, unset other defaults
    if (shouldBeDefault && user.address) {
      user.address.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Create new address
    const newAddress = {
      street: street.trim(),
      city: city.trim(),
      state: state?.trim(),
      postalCode: postalCode.trim(),
      country: country.trim(),
      isDefault: shouldBeDefault
    };

    user.address.push(newAddress);
    await user.save();

    // Get the newly added address
    const addedAddress = user.address[user.address.length - 1];

    return res.status(201).json(
      new ApiResponse(201, {
        address: addedAddress,
        totalAddresses: user.address.length
      }, "Address added successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error adding address", error);
  }
});

/**
 * Update address
 * @route PUT /api/users/me/addresses/:addressId
 * @access Private
 */
export const updateAddressController = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { street, city, state, postalCode, country, isDefault } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Find the address
    const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new ApiError(404, "Address not found");
    }

    // If making this default, unset other defaults
    if (isDefault) {
      user.address.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address fields
    const address = user.address[addressIndex];
    if (street) address.street = street.trim();
    if (city) address.city = city.trim();
    if (state !== undefined) address.state = state?.trim();
    if (postalCode) address.postalCode = postalCode.trim();
    if (country) address.country = country.trim();
    if (typeof isDefault === "boolean") address.isDefault = isDefault;

    await user.save();

    return res.status(200).json(
      new ApiResponse(200, {
        address: user.address[addressIndex],
        totalAddresses: user.address.length
      }, "Address updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error updating address", error);
  }
});

/**
 * Delete address
 * @route DELETE /api/users/me/addresses/:addressId
 * @access Private
 */
export const deleteAddressController = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Find the address
    const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new ApiError(404, "Address not found");
    }

    const wasDefault = user.address[addressIndex].isDefault;

    // Remove the address
    user.address.splice(addressIndex, 1);

    // If deleted address was default and there are other addresses, make the first one default
    if (wasDefault && user.address.length > 0) {
      user.address[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json(
      new ApiResponse(200, {
        deletedAddressId: addressId,
        totalAddresses: user.address.length,
        newDefaultAddress: wasDefault && user.address.length > 0 ? user.address[0] : null
      }, "Address deleted successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error deleting address", error);
  }
});

/**
 * Set default address
 * @route PUT /api/users/me/addresses/:addressId/default
 * @access Private
 */
export const setDefaultAddressController = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Find the address
    const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      throw new ApiError(404, "Address not found");
    }

    // Unset all defaults and set the new one
    user.address.forEach((addr, index) => {
      addr.isDefault = index === addressIndex;
    });

    await user.save();

    return res.status(200).json(
      new ApiResponse(200, {
        defaultAddress: user.address[addressIndex],
        totalAddresses: user.address.length
      }, "Default address updated successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error setting default address", error);
  }
});