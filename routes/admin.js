// routes/admin.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Admin balance update route
router.post("/transfer", async (req, res) => {
  const { accountNumber, accountType, amount, memo } = req.body;
  try {
    const user = await User.findOne({ [`${accountType}.accountNumber`]: accountNumber });
    if (!user) return res.status(404).json({ message: "User not found" });

    const amt = parseFloat(amount);
    user[accountType].balance += amt;
    user[accountType].transactions.push({
      date: new Date().toISOString(),
      type: amt > 0 ? "Credit" : "Debit",
      amount: amt,
      description: memo || "Admin Transfer"
    });

    await user.save();
    res.json({ message: "Transfer successful", balance: user[accountType].balance });
  } catch (err) {
    res.status(500).json({ message: "Error processing transfer" });
  }
});

module.exports = router;
