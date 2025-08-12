// controllers/auth.controllers.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; // Assuming you have a User model
import logger from "../config/logger.js";

export const signupController = async (req, res, next) => {
 try {
    const { name, email, password } = req.body;

    //  Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (role is hardcoded to 'user')
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    // Generate JWT token for auto-login
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // token valid for 7 days
    );

    //  Send response with token (and maybe user details without password)
    return res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error); // Pass error to your error handling middleware
  }
};

export const loginController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Login route is functional."
  });
};

export const logoutController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Logout route is functional."
  });
};

export const forgotPasswordController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Forgot password route is functional."
  });
};

export const resetPasswordController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Reset password route is functional."
  });
};

export const changePasswordController = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: "Change password route is functional."
  });
};