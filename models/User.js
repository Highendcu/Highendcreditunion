const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  username: { type: String, unique: true },
  password: String,
  status: { type: String, default: "active" },
  accounts: {
    checking: {
      accountNumber: String,
      routingNumber: { type: String, default: "836284645" },
      balance: { type: Number, default: 0 },
      transactions: { type: [Object], default: [] }
    },
    savings: {
      accountNumber: String,
      routingNumber: { type: String, default: "836284645" },
      balance: { type: Number, default: 0 },
      transactions: { type: [Object], default: [] }
    }
  }
});

module.exports = mongoose.model("User", userSchema);
