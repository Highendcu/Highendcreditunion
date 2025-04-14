// routes/admin.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// POST /api/admin/transfer
router.post("/transfer", async (req, res) => {
  const { accountNumber, amount, memo, accountType } = req.body;

  if (!accountNumber || isNaN(amount) || !["checking", "savings"].includes(accountType)) {
    return res.status(400).json({ message: "Invalid input" });
  }

  try {
    const user = await User.findOne({ [`${accountType}.accountNumber`]: accountNumber });

    if (!user) return res.status(404).json({ message: "User not found" });

    user[accountType].balance += parseFloat(amount);
    user[accountType].transactions.push({
      type: parseFloat(amount) >= 0 ? "Credit" : "Debit",
      amount: parseFloat(amount),
      description: memo || "Admin transfer"
    });

    await user.save();
    res.json({ message: "Transfer successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
