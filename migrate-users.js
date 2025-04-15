
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const User = require("./models/User");

const uri = "mongodb://gregorydill6:Password112122@ac-nxdneak-shard-00-00.jtmwxgt.mongodb.net:27017,ac-nxdneak-shard-00-01.jtmwxgt.mongodb.net:27017,ac-nxdneak-shard-00-02.jtmwxgt.mongodb.net:27017/?replicaSet=atlas-os1o3c-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=BankCluster";


mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB");

    // Load users.json
    const rawData = fs.readFileSync(path.join(__dirname, "data", "users.json"));
    const data = JSON.parse(rawData);
    const users = data.users || [];

    for (const user of users) {
      // Avoid duplicate entries
      const existing = await User.findOne({ email: user.email });
      if (existing) {
        console.log(`Skipping existing user: ${user.email}`);
        continue;
      }

      // Construct new user
      const newUser = new User({
        name: user.name,
        email: user.email,
        password: user.password, // already hashed
        status: user.status || "active",
        checking: {
          accountNumber: user.checking?.accountNumber,
          balance: user.checking?.balance || 0,
          transactions: user.checking?.transactions || []
        },
        savings: {
          accountNumber: user.savings?.accountNumber,
          balance: user.savings?.balance || 0,
          transactions: user.savings?.transactions || []
        }
      });

      await newUser.save();
      console.log(`Imported user: ${user.email}`);
    }

    console.log("Migration complete.");
    process.exit(0);
  })
  .catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
