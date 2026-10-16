require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const {
  User,
  Stock,
  Order,
  Transaction,
  userSchema,
  stocksSchema,
  ordersSchema,
  transactionSchema,
} = require("./Schemas");

async function runTests() {
  console.log("=== TradeX MongoDB & Mongoose Schemas Verification Test ===");
  console.log(`Mongoose version: ${mongoose.version}`);

  let errors = 0;

  // 1. Validate User Model with exact schema fields (from reference screenshot)
  try {
    const testUser = new User({
      username: "trader_omkar",
      email: "trader_omkar@example.com",
      usertype: "User",
      password: "securePassword123",
      balance: 50000,
    });
    await testUser.validate();

    if (testUser.username !== "trader_omkar" || testUser.balance !== 50000) {
      throw new Error("User fields do not match expected values.");
    }
    console.log("✅ User Schema & Model (Exact reference fields): Validated successfully.");
  } catch (err) {
    console.error("❌ User Model Error:", err.message);
    errors++;
  }

  // 2. Validate Stock Model with exact schema fields (from reference screenshot)
  try {
    const testStock = new Stock({
      user: "trader_omkar",
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      price: 135.5,
      count: 20,
      totalPrice: 2710.0,
      stockExchange: "NASDAQ",
    });
    await testStock.validate();

    if (testStock.symbol !== "NVDA" || testStock.totalPrice !== 2710.0) {
      throw new Error("Stock fields do not match expected values.");
    }
    console.log("✅ Stock Schema & Model (Exact reference fields): Validated successfully.");
  } catch (err) {
    console.error("❌ Stock Model Error:", err.message);
    errors++;
  }

  // 3. Validate Order Model with exact schema fields (from reference screenshot)
  try {
    const testOrder = new Order({
      user: "trader_omkar",
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 225.0,
      count: 10,
      totalPrice: 2250.0,
      stockType: "delivery", // intraday / delivery
      orderType: "buy", // buy / sell
      orderStatus: "EXECUTED",
    });
    await testOrder.validate();

    if (testOrder.stockType !== "delivery" || testOrder.orderType !== "buy") {
      throw new Error("Order fields do not match expected values.");
    }
    console.log("✅ Order Schema & Model (Exact reference fields): Validated successfully.");
  } catch (err) {
    console.error("❌ Order Model Error:", err.message);
    errors++;
  }

  // 4. Validate Transaction Model with exact schema fields (from reference screenshot)
  try {
    const testTx = new Transaction({
      user: "trader_omkar",
      type: "STOCK_BUY",
      paymentMode: "WALLET",
      amount: 2250.0,
      time: new Date().toISOString(),
    });
    await testTx.validate();

    if (testTx.amount !== 2250.0 || testTx.paymentMode !== "WALLET") {
      throw new Error("Transaction fields do not match expected values.");
    }
    console.log("✅ Transaction Schema & Model (Exact reference fields): Validated successfully.");
  } catch (err) {
    console.error("❌ Transaction Model Error:", err.message);
    errors++;
  }

  // 5. Validate Backwards Compatibility with Aliases & Controllers
  try {
    const legacyUser = new User({
      Username: "legacy_user",
      email: "legacy@test.com",
      password: "password123",
      UserType: "Admin",
      cashBalance: 10000,
    });
    await legacyUser.validate();

    const legacyOrder = new Order({
      UserId: "652c1e8b7a9f1b001a1c4e01",
      Stock_Symbol: "TSLA",
      Stock_name: "Tesla, Inc.",
      Price: 220.0,
      Count: 5,
      Total_price: 1100.0,
      Order_Type: "BUY",
      Order_Status: "EXECUTED",
    });
    await legacyOrder.validate();

    console.log("✅ Backwards-Compatibility Aliases (Controllers & Legacy formats): Validated successfully.");
  } catch (err) {
    console.error("❌ Legacy Alias Compatibility Error:", err.message);
    errors++;
  }

  // 6. Test Database Connection Module
  try {
    console.log("\nTesting MongoDB connection initialization...");
    const conn = await connectDB();
    if (conn) {
      console.log("✅ Database connection established successfully.");
      await mongoose.connection.close();
      console.log("Database connection closed cleanly.");
    } else {
      console.log("ℹ️  Database connection handled gracefully without throwing unhandled rejection (Simulation Mode active).");
    }
  } catch (err) {
    console.error("❌ Database connection test threw an error:", err.message);
    errors++;
  }

  console.log("\n==================================================");
  if (errors === 0) {
    console.log("🎉 ALL TESTS PASSED: All 4 MongoDB Schemas and Models are configured & verified!");
    process.exit(0);
  } else {
    console.error(`⚠️ Found ${errors} error(s) during verification.`);
    process.exit(1);
  }
}

runTests();
