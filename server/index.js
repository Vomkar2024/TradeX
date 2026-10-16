require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { seedDemoUsers } = require("./seed");

// Import routes
const userRoute = require("./Routes/userRoute");
const stockRoute = require("./Routes/stockRoute");
const orderRoute = require("./Routes/orderRoute");
const transactionRoute = require("./Routes/transactionRoute");

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));

// Ensure database is connected before handling backend actions
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database is not connected. Unable to perform backend actions.",
    });
  }
  next();
});

// Health Check Endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TradeX SB Stocks API Server is up and running.",
    databaseConnected: mongoose.connection.readyState === 1,
    version: "1.0.0",
    endpoints: {
      users: "/api/users",
      stocks: "/api/stocks",
      orders: "/api/orders",
      transactions: "/api/transactions",
    },
  });
});

// API Routes
app.use("/api/users", userRoute);
app.use("/api/auth", userRoute); // Alias for auth endpoints like /api/auth/login, /api/auth/register
app.use("/api/stocks", stockRoute);
app.use("/api/orders", orderRoute);
app.use("/api/transactions", transactionRoute);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} - Route not found.`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 6001;

// Ensure database is connected before starting server / performing backend actions
const startServer = async () => {
  try {
    await connectDB();
    await seedDemoUsers();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server due to database connection error:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;