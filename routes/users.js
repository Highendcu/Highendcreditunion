const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

function generateAccountNumber() {
  return Math.floor(Math.random() * 9000000000 + 1000000000).toString();
}

router.post("/register", async (req, res) => {
  const { name, email, username, password, selectedAccountType, status } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      username,
      password: hashedPassword,
      status,
      accounts: {
        checking: {
          number: generateAccountNumber(),
          balance: 0,
          transactions: []
        },
        savings: {
          number: generateAccountNumber(),
          balance: 0,
          transactions: []
        }
      }
    });

    await user.save();
    res.json({ success: true, user });

  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
