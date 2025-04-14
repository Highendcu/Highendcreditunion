const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/admin/transfer
router.post('/transfer', async (req, res) => {
  const { accountNumber, accountType, amount, memo } = req.body;

  if (!accountNumber || !accountType || isNaN(amount)) {
    return res.status(400).json({ message: 'Invalid transfer input' });
  }

  try {
    const user = await User.findOne({ [`accounts.${accountType}.number`]: accountNumber });

    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.accounts[accountType].balance += parseFloat(amount);

    user.transactions.push({
      type: accountType,
      amount: parseFloat(amount),
      description: memo || 'Admin Transfer'
    });

    await user.save();

    res.json({ message: 'Transfer successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
