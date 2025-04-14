
const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  accountNumber: String,
  balance: { type: Number, default: 0 },
  transactions: [
    {
      type: { type: String },
      amount: Number,
      description: String,
      date: { type: Date, default: Date.now }
    }
  ]
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  status: { type: String, default: 'active' },
  checking: accountSchema,
  savings: accountSchema
});

module.exports = mongoose.model('User', userSchema);
