const express = require("express");
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
} = require("../controllers/orderController");
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// All order operations are protected by authMiddleware
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getUserOrders);
router.get("/all", authMiddleware, adminMiddleware, getAllOrders);
router.get("/:id", authMiddleware, getOrderById);
router.put("/:id/cancel", authMiddleware, cancelOrder);

module.exports = router;

