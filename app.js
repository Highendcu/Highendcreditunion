
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const helmet = require("helmet");
app.use(helmet());

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect("mongodb://gregorydill6:Password112122@ac-nxdneak-shard-00-00.jtmwxgt.mongodb.net:27017,ac-nxdneak-shard-00-01.jtmwxgt.mongodb.net:27017,ac-nxdneak-shard-00-02.jtmwxgt.mongodb.net:27017/?replicaSet=atlas-os1o3c-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=BankCluster")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});


// View routes
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/user-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "user-dashboard.html"));
});

// Register a new user
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      checking: {
        accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        balance: 0,
        transactions: []
      },
      savings: {
        accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        balance: 0,
        transactions: []
      }
    });

    await newUser.save();
    const user = newUser.toObject();
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Incorrect password" });

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login error" });
  }
});

// Fetch all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

app.post("/api/users/:id/toggle-suspend", (req, res) => {
  const users = loadUsers();
  const user = users.users.find(u => u.id === req.params.id);
  if (user) {
    user.status = user.status === "suspended" ? "active" : "suspended";
    saveUsers(users);
    res.json({ message: `User ${user.status}` });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

app.post("/api/users/:id/change-password", (req, res) => {
  const { newPassword } = req.body;
  const users = loadUsers();
  const user = users.users.find(u => u.id === req.params.id);
  if (user) {
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ success: false, message: 'Error hashing password' });

      user.password = hashedPassword;
      saveUsers(users);
      res.json({ message: "Password updated" });
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// Get user transactions
app.get("/api/users/:id/transactions", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allTransactions = [
      ...user.checking.transactions.map(tx => ({ ...tx, account: "checking" })),
      ...user.savings.transactions.map(tx => ({ ...tx, account: "savings" }))
    ];

    // Optional: sort by date, newest first
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allTransactions);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving transactions" });
  }
});

app.post("/api/users/:id/update-balance", (req, res) => {
  const { amount, account } = req.body;
  const amt = parseFloat(amount);
  const users = loadUsers();
  const user = users.users.find(u => u.id === req.params.id);

  if (!user || !["checking", "savings"].includes(account)) {
    return res.status(400).json({ message: "Invalid user or account type" });
  }

  user[account].balance += amt;
  user[account].transactions.push({
    date: new Date().toISOString(),
    type: amt >= 0 ? "Credit" : "Debit",
    amount: amt
  });

  saveUsers(users);
  res.json({ message: "Balance updated", balance: user[account].balance });
});

// Mount admin routes
app.use("/api/admin", require("./routes/admin"));

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
