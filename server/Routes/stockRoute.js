const express = require("express");
const router = express.Router();
const {
  getAllStocks,
  getStockBySymbol,
  getUserPortfolio,
  addOrUpdateStock,
} = require("../controllers/stockController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Public endpoints
router.get("/", getAllStocks);
router.get("/portfolio", authMiddleware, getUserPortfolio);
router.get("/:symbol", getStockBySymbol);

// Admin endpoints
router.post("/", authMiddleware, adminMiddleware, addOrUpdateStock);

module.exports = router;
