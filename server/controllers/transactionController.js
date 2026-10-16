const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");

/**
 * @desc    Get user's transaction ledger history
 * @route   GET /api/transactions
 * @access  Private
 */
const getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate("orderId")
      .sort({ Time: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user transactions.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single transaction receipt by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate("orderId");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction receipt not found.",
      });
    }

    // Ensure belongs to user or user is admin
    if (
      transaction.userId.toString() !== req.user._id.toString() &&
      req.user.UserType !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this transaction.",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction.",
      error: error.message,
    });
  }
};

/**
 * @desc    Deposit funds into trading wallet
 * @route   POST /api/transactions/deposit
 * @access  Private
 */
const depositFunds = async (req, res) => {
  try {
    const rawAmount = req.body.amount !== undefined ? req.body.amount : req.body.Amount;
    const paymentMode = req.body.paymentMode || req.body.Payment_mode || "BANK_TRANSFER";
    const depositAmount = parseFloat(rawAmount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid positive deposit amount.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Credit balance
    const currentBalance = typeof user.cashBalance === "number" 
      ? user.cashBalance 
      : (typeof user.balance === "number" ? user.balance : 0);
    const newBalance = parseFloat((currentBalance + depositAmount).toFixed(2));
    user.cashBalance = newBalance;
    user.balance = newBalance;
    await user.save();

    // Create deposit transaction
    const transaction = await Transaction.create({
      userId: user._id,
      Transaction_type: "DEPOSIT",
      Payment_mode: paymentMode,
      Amount: depositAmount,
      status: "SUCCESS",
      Time: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deposited $${depositAmount.toFixed(2)}.`,
      cashBalance: newBalance,
      balance: newBalance,
      transaction,
    });
  } catch (error) {
    console.error("Deposit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process deposit.",
      error: error.message,
    });
  }
};

/**
 * @desc    Withdraw funds from trading wallet
 * @route   POST /api/transactions/withdraw
 * @access  Private
 */
const withdrawFunds = async (req, res) => {
  try {
    const rawAmount = req.body.amount !== undefined ? req.body.amount : req.body.Amount;
    const paymentMode = req.body.paymentMode || req.body.Payment_mode || "BANK_TRANSFER";
    const withdrawAmount = parseFloat(rawAmount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid positive withdrawal amount.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify sufficient balance
    const currentBalance = typeof user.cashBalance === "number" 
      ? user.cashBalance 
      : (typeof user.balance === "number" ? user.balance : 0);
    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient funds for withdrawal. Available: $${currentBalance.toFixed(
          2
        )}, requested: $${withdrawAmount.toFixed(2)}.`,
      });
    }

    // Debit balance
    const newBalance = parseFloat((currentBalance - withdrawAmount).toFixed(2));
    user.cashBalance = newBalance;
    user.balance = newBalance;
    await user.save();

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      userId: user._id,
      Transaction_type: "WITHDRAWAL",
      Payment_mode: paymentMode,
      Amount: withdrawAmount,
      status: "SUCCESS",
      Time: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Successfully withdrew $${withdrawAmount.toFixed(2)}.`,
      cashBalance: newBalance,
      balance: newBalance,
      transaction,
    });
  } catch (error) {
    console.error("Withdrawal Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process withdrawal.",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all transactions (Admin view)
 * @route   GET /api/transactions/all
 * @access  Private/Admin
 */
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "Username email")
      .populate("orderId")
      .sort({ Time: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all transactions.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserTransactions,
  getTransactionById,
  depositFunds,
  withdrawFunds,
  getAllTransactions,
};
