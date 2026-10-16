const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "tradex_jwt_secret_key_2026";

/**
 * Helper to generate JWT token for authenticated user session
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      _id: user._id,
      email: user.email,
      Username: user.Username,
      UserType: user.UserType,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const registerUser = async (req, res) => {
  const { Username, username, name, email, password, UserType } = req.body;
  try {
    const resolvedUsername = Username || username || name;

    if (!resolvedUsername || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide Username, email, and password.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    // Create user
    const user = await User.create({
      Username: resolvedUsername,
      email: email.toLowerCase(),
      password,
      UserType: UserType || "User",
      cashBalance: 25000, // Default starting virtual cash balance
    });

    const token = generateToken(user);

    // Send cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        _id: user._id,
        Username: user.Username,
        email: user.email,
        UserType: user.UserType,
        cashBalance: user.cashBalance,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Check user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Self-healing check for demo presets if DB was freshly created or cleared
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail === "trader@tradex.com" || normalizedEmail === "admin@tradex.com") {
        try {
          const { seedDemoUsers } = require("../seed");
          await seedDemoUsers();
          user = await User.findOne({ email: normalizedEmail });
        } catch (seedErr) {
          console.warn("Auto-seed during login attempt warning:", seedErr.message);
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password.",
        });
      }
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user);

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        Username: user.Username,
        email: user.email,
        UserType: user.UserType,
        cashBalance: user.cashBalance,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/users/logout
 * @access  Public
 */
const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during logout.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
      error: error.message,
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { Username, username, email, password } = req.body;
    if (Username || username) user.Username = Username || username;
    if (email) user.email = email.toLowerCase();
    if (password) user.password = password;

    const updatedUser = await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        _id: updatedUser._id,
        Username: updatedUser.Username,
        email: updatedUser.email,
        UserType: updatedUser.UserType,
        cashBalance: updatedUser.cashBalance,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get wallet balance
 * @route   GET /api/users/balance
 * @access  Private
 */
const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("cashBalance Username");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      cashBalance: user.cashBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet balance.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all users (Admin view)
 * @route   GET /api/users/all
 * @access  Private/Admin
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users list.",
      error: error.message,
    });
  }
};

module.exports = {
  register: registerUser,
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getWalletBalance,
  getAllUsers,
  generateToken,
};

