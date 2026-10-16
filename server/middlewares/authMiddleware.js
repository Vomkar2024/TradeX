const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "tradex_jwt_secret_key_2026";

/**
 * Middleware to verify JWT token and authenticate user
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header for Bearer token
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // Check cookies
      token = req.cookies.token;
    } else if (req.headers["x-access-token"]) {
      // Fallback header
      token = req.headers["x-access-token"];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details from DB excluding password
    const user = await User.findById(decoded.id || decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found or token has expired.",
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      error: error.message,
    });
  }
};

/**
 * Middleware to check if user has Admin privileges
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.UserType === "Admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Forbidden. Admin access required.",
    });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware,
  JWT_SECRET,
};
