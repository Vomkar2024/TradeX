require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

async function verifyConnectionLifecycle() {
  console.log("=== TradeX DB Pre-Connection Verification ===");
  console.log("Step 1: Check initial Mongoose readyState (should be 0/disconnected):", mongoose.connection.readyState);
  
  if (mongoose.connection.readyState !== 0) {
    console.warn("Mongoose was already connected before connectDB.");
  }

  console.log("Step 2: Invoking connectDB()...");
  await connectDB();

  console.log("Step 3: Check readyState after connectDB (must be 1/connected):", mongoose.connection.readyState);

  if (mongoose.connection.readyState === 1) {
    console.log("✅ Verified: Database is connected BEFORE performing any backend actions.");
  } else {
    console.error("❌ Failed: Database is not in connected state.");
    process.exit(1);
  }

  await mongoose.connection.close();
  console.log("Step 4: Cleanly closed verification connection.");
  console.log("=== All DB Connection Verification Checks Passed ===");
}

verifyConnectionLifecycle().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
