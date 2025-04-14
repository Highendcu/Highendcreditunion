const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  number: String,
  balance: { type: Number, default: 0 }
});

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: String,
  amount: Number,
  description: String
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  accounts: {
    checking: accountSchema,
    savings: accountSchema
  },
  transactions: [transactionSchema],
  status: { type: String, default: 'active' }
});

module.exports = mongoose.model('User', userSchema);
