const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* ==========================================================================
   1. User Schema & Model
   Fields: username, email, usertype, password, balance
   Collection: 'users'
   ========================================================================== */
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      alias: "Username",
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    usertype: {
      type: String,
      required: [true, "User type is required"],
      default: "User",
      alias: "UserType",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    balance: {
      type: Number,
      default: 0,
      alias: "cashBalance",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.users || mongoose.model("users", userSchema);

/* ==========================================================================
   2. Transactions Schema & Model
   Fields: user, type, paymentMode, amount, time
   Collection: 'transactions'
   ========================================================================== */
const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: [true, "User reference is required"],
      alias: "userId",
    },
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      alias: "Transaction_type",
    },
    paymentMode: {
      type: String,
      required: [true, "Payment mode is required"],
      alias: "Payment_mode",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      alias: "Amount",
    },
    time: {
      type: String,
      default: () => new Date().toISOString(),
      alias: "Time",
    },
    // Optional helper fields for order linkage & status
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "orders",
      default: null,
    },
    status: {
      type: String,
      default: "SUCCESS",
    },
  },
  {
    timestamps: true,
  }
);

const Transaction =
  mongoose.models.transactions ||
  mongoose.model("transactions", transactionSchema);

/* ==========================================================================
   3. Stocks Schema & Model
   Fields: user, symbol, name, price, count, totalPrice, stockExchange
   Collection: 'stocks'
   ========================================================================== */
const stocksSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      alias: "UserId",
    },
    symbol: {
      type: String,
      alias: "Stock_Symbol",
    },
    name: {
      type: String,
      alias: "Stock_name",
    },
    price: {
      type: Number,
      alias: "Price",
    },
    count: {
      type: Number,
      alias: "Count",
    },
    totalPrice: {
      type: Number,
      alias: "Total_price",
    },
    stockExchange: {
      type: String,
      alias: "Stock_Exchange",
    },
    // Market analytics & simulation fields
    change: {
      type: Number,
      default: 0,
    },
    changePercent: {
      type: Number,
      default: 0,
    },
    volume: {
      type: Number,
      default: 0,
    },
    marketCap: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Stock = mongoose.models.stocks || mongoose.model("stocks", stocksSchema);

/* ==========================================================================
   4. Orders Schema & Model
   Fields: user, symbol, name, price, count, totalPrice, stockType, orderType, orderStatus
   Collection: 'orders'
   ========================================================================== */
const ordersSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      alias: "UserId",
    },
    symbol: {
      type: String,
      alias: "Stock_Symbol",
    },
    name: {
      type: String,
      alias: "Stock_name",
    },
    price: {
      type: Number,
      alias: "Price",
    },
    count: {
      type: Number,
      alias: "Count",
    },
    totalPrice: {
      type: Number,
      alias: "Total_price",
    },
    stockType: {
      type: String, // intraday / delivery
      alias: "Stock_Type",
    },
    orderType: {
      type: String, // buy / sell
      alias: "Order_Type",
    },
    orderStatus: {
      type: String,
      alias: "Order_Status",
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.orders || mongoose.model("orders", ordersSchema);

/* ==========================================================================
   Exports
   ========================================================================== */
module.exports = {
  // Models
  User,
  Transaction,
  Stock,
  Order,

  // Schemas
  userSchema,
  transactionSchema,
  stocksSchema,
  ordersSchema,

  // Canonical aliases for flexibility
  stockSchema: stocksSchema,
  orderSchema: ordersSchema,
};
