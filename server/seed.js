require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const { User } = require("./Schemas");

const DEMO_USERS = [
  {
    username: "Demo Trader",
    email: "trader@tradex.com",
    password: "password123",
    usertype: "User",
    balance: 50000,
  },
  {
    username: "Demo Admin",
    email: "admin@tradex.com",
    password: "admin123",
    usertype: "Admin",
    balance: 100000,
  },
];

/**
 * Ensures demo user accounts exist in the database.
 * If an account already exists, checks if password needs updating to match preset credentials.
 */
async function seedDemoUsers() {
  const results = [];

  for (const demoData of DEMO_USERS) {
    try {
      let user = await User.findOne({ email: demoData.email.toLowerCase() });

      if (!user) {
        // Create new user (pre-save hook will hash password)
        user = new User({
          username: demoData.username,
          email: demoData.email.toLowerCase(),
          password: demoData.password,
          usertype: demoData.usertype,
          balance: demoData.balance,
        });
        await user.save();
        console.log(`✅ Seeded demo user: ${demoData.email} (${demoData.usertype})`);
        results.push({ email: demoData.email, status: "created" });
      } else {
        // Verify if password matches expected demo preset password
        const matches = await user.matchPassword(demoData.password);
        if (!matches) {
          user.password = demoData.password;
          user.usertype = demoData.usertype;
          await user.save();
          console.log(`🔄 Updated password for demo user: ${demoData.email}`);
          results.push({ email: demoData.email, status: "updated_password" });
        } else {
          console.log(`ℹ️ Demo user already exists with valid credentials: ${demoData.email}`);
          results.push({ email: demoData.email, status: "already_exists" });
        }
      }
    } catch (err) {
      console.error(`❌ Failed to seed demo user ${demoData.email}:`, err.message);
    }
  }

  return results;
}

// Standalone script execution
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      console.log("Seeding demo accounts...");
      await seedDemoUsers();
      console.log("Demo accounts seeding completed successfully.");
      await mongoose.connection.close();
      process.exit(0);
    } catch (error) {
      console.error("Seeding execution error:", error);
      process.exit(1);
    }
  })();
}

module.exports = { seedDemoUsers, DEMO_USERS };
