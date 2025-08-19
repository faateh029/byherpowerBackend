

// // controllers/auth.controllers.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from 'nodemailer';
import { sendEmail } from "../utils/helpers.js";
import crypto from 'crypto';
import User from "../models/user.model.js"; // Assuming you have a User model
import logger from "../config/logger.js"; // Your logger setup

// =========================================================================
// Helper function for sending emails (can be moved to a separate file like utils/sendEmail.js)
// =========================================================================


// =========================================================================
// Core Authentication Controllers
// =========================================================================
export const signupController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate input fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character."
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
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
      { expiresIn: "7d" }
    );

    // Send response
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
    next(error);
  }
};

export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req, res, next) => {
  try {
    // This assumes you are storing the JWT in a cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// =========================================================================
// Password Management Controllers
// =========================================================================
export const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });

    // Security practice: Always return a generic success message to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Save the hashed token and its expiry to the user model in the database
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // Token expires in 15 minutes
    await user.save({ validateBeforeSave: false });

    // Create the reset URL that the user will click from their email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const message = `
      You are receiving this because you (or someone else) have requested the reset of the password for your account.
      Please click on the following link, or paste this into your browser to complete the process:
      ${resetUrl}
      This link is valid for 15 minutes. If you did not request this, please ignore this email and your password will remain unchanged.
    `;

    // Use the new helper function to send the email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: message
    });

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent."
    });

  } catch (error) {
    console.error(error);
    // Rollback the token fields if an email error occurs to prevent token invalidation without email delivery
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return res.status(500).json({ success: false, message: "Server error. Could not send email." });
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ msg: "Token and new password are required" });
    }

    // Password complexity validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, contain an uppercase letter, a lowercase letter, a number, and a special character."
      });
    }

    // Hash incoming token to compare with DB stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired token" });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Generate JWT for auto-login
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      msg: "Password reset successful. You are now logged in.",
      token: accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import nodemailer from 'nodemailer';
// import crypto from 'crypto';
// import User from "../models/user.model.js"; // Assuming you have a User model
// import logger from "../config/logger.js";

// export const signupController = async (req, res, next) => {
//  try {
//     const { name, email, password } = req.body;

//     //  Validate input
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     // Check if email already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(409).json({ message: "Email already in use" });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create new user (role is hardcoded to 'user')
//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: "user",
//     });

//     // Generate JWT token for auto-login
//     const token = jwt.sign(
//       { userId: newUser._id, role: newUser.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" } // token valid for 7 days
//     );

//     //  Send response with token (and maybe user details without password)
//     return res.status(201).json({
//       message: "Signup successful",
//       token,
//       user: {
//         id: newUser._id,
//         name: newUser.name,
//         email: newUser.email,
//         role: newUser.role,
//       },
//     });
//   } catch (error) {
//     next(error); // Pass error to your error handling middleware
//   }
// };

// export const loginController = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     // 1. Validate inputs
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: "Email and password are required" });
//     }

//     // 2. Check if user exists
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ success: false, message: "Invalid credentials" });
//     }

//     // 3. Compare passwords
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ success: false, message: "Invalid credentials" });
//     }

//     // 4. Generate JWT
//     const payload = { id: user._id, role: user.role };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

//     // 5. Send token
//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// };
// export const logoutController = async (req, res, next) => {
//   try {
//     // Clear the cookie that stores the JWT
//     res.clearCookie("accessToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production", // send only over HTTPS in production
//       sameSite: "strict",
//     });

//     // Optional: also clear refresh token cookie if you're using one
//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Logged out successfully.",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const forgotPasswordController = async (req, res, next) => {
  
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ success: false, message: "Email is required" });
//     }

//     // Find user
//     const user = await User.findOne({ email });
    
//     // For security: Always return same message even if user doesn't exist
//     if (!user) {
//       return res.status(200).json({
//         success: true,
//         message: "If an account exists, a password reset link has been sent to your email."
//       });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString("hex");
//     const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

//     // Save token & expiry in DB
//     user.resetPasswordToken = hashedToken;
//     user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
//     await user.save({ validateBeforeSave: false });

//     // Create reset URL (frontend)
//     const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

//     // Email message
//     const message = `
//       You requested a password reset.
//       Please click the link below to reset your password:
//       ${resetUrl}
//       If you did not request this, please ignore this email.
//     `;

//     await sendEmail({
//       to: user.email,
//       subject: "Password Reset Request",
//       text: message
//     });

//     return res.status(200).json({
//       success: true,
//       message: "If an account exists, a password reset link has been sent to your email."
//     });

//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// export const resetPasswordController = async (req, res, next) => {
//   try {
//     const { token, newPassword } = req.body;

//     if (!token || !newPassword) {
//       return res.status(400).json({ msg: "Token and new password are required" });
//     }

//     // Hash incoming token to compare with DB stored hash
//     const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

//     // Find user with valid token and not expired
//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpire: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({ msg: "Invalid or expired token" });
//     }

//     // Update password
//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(newPassword, salt);

//     // Clear reset token fields
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;

//     await user.save();

//     // Generate JWT for auto-login
//     const accessToken = jwt.sign(
//       { id: user._id, role: user.role }, // Add more claims if needed
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
//     );

//     res.status(200).json({
//       msg: "Password reset successful. You are now logged in.",
//       token: accessToken,
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         role: user.role
//       }
//     });

//   } catch (error) {
//     next(error);
//   }
// };

// export const changePasswordController = async (req, res, next) => {
//   res.status(200).json({
//     success: true,
//     message: "Change password route is functional."
//   });
// };