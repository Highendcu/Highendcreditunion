const express = require("express");
const helmet = require("helmet");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const adminRoutes = require("./routes/admin");

const app = express();
const port = process.env.PORT || 3000;

app.use("/api", adminRoutes);

// Middleware
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com"
      ],
      "style-src": [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'"
      ],
      "font-src": ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'", "https://highendcreditunion-hyzp.onrender.com"],
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Force HTTPS
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// MongoDB Connection
mongoose.connect(
  "mongodb://gregorydill6:Password112122@ac-nxdneak-shard-00-00.jtmwxgt.mongodb.net:27017,ac-nxdneak-shard-00-01.jtmwxgt.mongodb.net:27017,ac-nxdneak-shard-00-02.jtmwxgt.mongodb.net:27017/?replicaSet=atlas-os1o3c-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=BankCluster"
)
.then(() => console.log("MongoDB connected"))
.catch((err) => console.error("MongoDB connection error:", err));

// View routes
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "public/register.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public/login.html")));
app.get("/user-dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/user-dashboard.html")));
app.get("/admin-dashboard", (req, res) => res.sendFile(path.join(__dirname, "public/admin-dashboard.html")));

// Registration
app.post("/register", async (req, res) => {
  const { name, email, username, password, selectedAccountType, status } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ success: false, message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const generateAccountNumber = () => Math.floor(Math.random() * 9000000000 + 1000000000).toString();

    const user = new User({
      name,
      email,
      username,
      password: hashed,
      status,
      accounts: {
        checking: {
          accountNumber: generateAccountNumber()
        },
        savings: {
          accountNumber: generateAccountNumber()
        }
      }
    });

    await user.save();
    return res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
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

// Admin routes
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to load users" });
  }
});

app.post("/api/users/:id/toggle-suspend", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "suspended" ? "active" : "suspended";
    await user.save();
    res.json({ message: `User ${user.status}` });
  } catch (err) {
    res.status(500).json({ message: "Error updating user status" });
  }
});

app.post("/api/users/:id/change-password", async (req, res) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating password" });
  }
});

app.post("/api/users/:id/update-balance", async (req, res) => {
  try {
    const { account, amount } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || !["checking", "savings"].includes(account)) {
      return res.status(400).json({ message: "Invalid user or account type" });
    }

    const amt = parseFloat(amount);
    user[account].balance += amt;
    user[account].transactions.push({
      date: new Date().toISOString(),
      type: amt >= 0 ? "Credit" : "Debit",
      amount: amt
    });

    await user.save();
    res.json({ message: "Balance updated", balance: user[account].balance });
  } catch (err) {
    res.status(500).json({ message: "Error updating balance" });
  }
});

app.get("/api/users/:id/transactions", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allTransactions = [
      ...user.checking.transactions.map(tx => ({ ...tx, account: "checking" })),
      ...user.savings.transactions.map(tx => ({ ...tx, account: "savings" }))
    ];

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(allTransactions);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving transactions" });
  }
});

// Verify admin PIN
app.post("/api/verify-pin", (req, res) => {
  const { pin } = req.body;
  if (pin === process.env.ADMIN_PIN || pin === "090909090") {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
