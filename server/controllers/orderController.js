const Order = require("../models/orderSchema");
const Stock = require("../models/stockSchema");
const User = require("../models/userModel");
const Transaction = require("../models/transactionModel");

/**
 * @desc    Create / Place a new stock order (BUY or SELL)
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const {
      Stock_Symbol,
      Stock_name,
      Price,
      Count,
      Order_Type,
      Stock_Type,
      Stock_Exchange,
    } = req.body;

    const userId = req.user._id;

    if (!Stock_Symbol || !Price || !Count || !Order_Type) {
      return res.status(400).json({
        success: false,
        message: "Please provide Stock_Symbol, Price, Count, and Order_Type (BUY/SELL).",
      });
    }

    const countNum = parseInt(Count, 10);
    const priceNum = parseFloat(Price);

    if (countNum <= 0 || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price and Count must be greater than zero.",
      });
    }

    const orderTypeUpper = Order_Type.toUpperCase();
    if (!["BUY", "SELL"].includes(orderTypeUpper)) {
      return res.status(400).json({
        success: false,
        message: "Order_Type must be either 'BUY' or 'SELL'.",
      });
    }

    const symbolUpper = Stock_Symbol.toUpperCase().trim();
    const totalPrice = parseFloat((priceNum * countNum).toFixed(2));

    // Fetch user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    let order;
    let transaction;

    if (orderTypeUpper === "BUY") {
      // Check cash balance
      if (user.cashBalance < totalPrice) {
        return res.status(400).json({
          success: false,
          message: `Insufficient funds. Order total is $${totalPrice.toFixed(
            2
          )}, but your balance is $${user.cashBalance.toFixed(2)}.`,
        });
      }

      // Deduct funds from user cashBalance
      user.cashBalance = parseFloat((user.cashBalance - totalPrice).toFixed(2));
      await user.save();

      // Create executed order
      order = await Order.create({
        UserId: userId,
        Stock_Symbol: symbolUpper,
        Stock_name: Stock_name || symbolUpper,
        Price: priceNum,
        Count: countNum,
        Total_price: totalPrice,
        Stock_Type: Stock_Type || "Equity",
        Order_Type: "BUY",
        Order_Status: "EXECUTED",
      });

      // Update or create user portfolio holding
      let userHolding = await Stock.findOne({
        UserId: userId,
        Stock_Symbol: symbolUpper,
      });

      if (userHolding) {
        const newTotalCount = userHolding.Count + countNum;
        const newTotalPrice = parseFloat(
          (userHolding.Total_price + totalPrice).toFixed(2)
        );
        userHolding.Count = newTotalCount;
        userHolding.Total_price = newTotalPrice;
        userHolding.Price = parseFloat((newTotalPrice / newTotalCount).toFixed(2));
        await userHolding.save();
      } else {
        await Stock.create({
          UserId: userId,
          Stock_Symbol: symbolUpper,
          Stock_name: Stock_name || symbolUpper,
          Price: priceNum,
          Count: countNum,
          Total_price: totalPrice,
          Stock_Exchange: Stock_Exchange || "NASDAQ",
        });
      }

      // Create Transaction record
      transaction = await Transaction.create({
        userId: userId,
        orderId: order._id,
        Transaction_type: "STOCK_BUY",
        Payment_mode: "WALLET",
        Amount: totalPrice,
        status: "SUCCESS",
        Time: new Date(),
      });
    } else if (orderTypeUpper === "SELL") {
      // Find holding in portfolio
      const userHolding = await Stock.findOne({
        UserId: userId,
        Stock_Symbol: symbolUpper,
      });

      if (!userHolding || userHolding.Count < countNum) {
        const availableShares = userHolding ? userHolding.Count : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient shares. You want to sell ${countNum} shares, but hold ${availableShares} shares of ${symbolUpper}.`,
        });
      }

      // Reduce shares in portfolio
      userHolding.Count -= countNum;
      if (userHolding.Count === 0) {
        userHolding.Total_price = 0;
      } else {
        userHolding.Total_price = parseFloat(
          (userHolding.Count * userHolding.Price).toFixed(2)
        );
      }
      await userHolding.save();

      // Credit cash balance to user
      user.cashBalance = parseFloat((user.cashBalance + totalPrice).toFixed(2));
      await user.save();

      // Create executed order
      order = await Order.create({
        UserId: userId,
        Stock_Symbol: symbolUpper,
        Stock_name: Stock_name || userHolding.Stock_name || symbolUpper,
        Price: priceNum,
        Count: countNum,
        Total_price: totalPrice,
        Stock_Type: Stock_Type || "Equity",
        Order_Type: "SELL",
        Order_Status: "EXECUTED",
      });

      // Create Transaction record
      transaction = await Transaction.create({
        userId: userId,
        orderId: order._id,
        Transaction_type: "STOCK_SELL",
        Payment_mode: "WALLET",
        Amount: totalPrice,
        status: "SUCCESS",
        Time: new Date(),
      });
    }

    return res.status(201).json({
      success: true,
      message: `Stock ${orderTypeUpper} order placed and executed successfully.`,
      order,
      transaction,
      cashBalance: user.cashBalance,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process stock order.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all orders placed by the authenticated user
 * @route   GET /api/orders
 * @access  Private
 */
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ UserId: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user orders.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get order details by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Ensure the order belongs to the requesting user or user is admin
    if (
      order.UserId?.toString() !== req.user._id.toString() &&
      req.user.UserType !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this order.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details.",
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel a pending order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.UserId?.toString() !== req.user._id.toString() &&
      req.user.UserType !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this order.",
      });
    }

    if (order.Order_Status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already ${order.Order_Status}.`,
      });
    }

    order.Order_Status = "CANCELLED";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order successfully cancelled.",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all orders across all users (Admin view)
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all orders.",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
};

