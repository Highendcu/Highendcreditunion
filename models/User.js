const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  username: String,
  password: String,
  status: String,
  accounts: {
    checking: {
      number: String,
      balance: Number,
      transactions: Array
    },
    savings: {
      number: String,
      balance: Number,
      transactions: Array
    }
  }
});

module.exports = mongoose.model("User", userSchema);
