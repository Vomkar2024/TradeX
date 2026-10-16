const express = require("express");
const router = express.Router();
const {
  getUserTransactions,
  getTransactionById,
  depositFunds,
  withdrawFunds,
  getAllTransactions,
} = require("../controllers/transactionController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// Protected transaction routes
router.get("/", authMiddleware, getUserTransactions);
router.get("/all", authMiddleware, adminMiddleware, getAllTransactions);
router.get("/:id", authMiddleware, getTransactionById);
router.post("/deposit", authMiddleware, depositFunds);
router.post("/withdraw", authMiddleware, withdrawFunds);

module.exports = router;
