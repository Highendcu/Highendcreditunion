const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');
const adminRoutes = require('./routes/admin');
const app = express();
const port = process.env.PORT || 3000;

const USERS_FILE = path.join(__dirname, "data", "users.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Force HTTPS on Render
app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }
  next();
});

// Helpers
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return { users: [] };
  const rawData = fs.readFileSync(USERS_FILE);
  try {
    return JSON.parse(rawData);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { users: [] };
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error("Error saving users to file:", error);
  }
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// Routes
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-login.html"));
});

app.get("/admin-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.get("/user-dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "user-dashboard.html"));
});

// Register new user
app.post("/register", (req, res) => {
  const { name, email, password, accountTypes } = req.body;
  const accountType = accountTypes && accountTypes[0] || "checking";

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const users = loadUsers();
  if (users.users.find(u => u.email === email)) {
    return res.status(400).json({ success: false, message: "Email already registered" });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ success: false, message: "Error hashing password" });

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      status: "active",
      checking: {
        accountNumber: generateAccountNumber(),
        balance: 0,
        transactions: [],
      },
      savings: {
        accountNumber: generateAccountNumber(),
        balance: 0,
        transactions: [],
      },
      selectedAccountType: accountType
    };

    users.users.push(newUser);
    saveUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    res.json({
      success: true,
      message: "Registration success!",
      user: userWithoutPassword,
      redirect: "/user-dashboard"
    });
  });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();
  const user = users.users.find(u => u.email === email);

  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      const { password: _, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });
});

// Admin login
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "123456789") {
    res.redirect("/admin-dashboard");
  } else {
    res.status(401).send("Invalid admin credentials.");
  }
});

// API Routes
app.get("/api/users", (req, res) => {
  const users = loadUsers();
  res.json(users.users);
});

app.get("/api/users/:id", (req, res) => {
  const users = loadUsers();
  const user = users.users.find(u => u.id === req.params.id);
  if (user) {
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } else {
    res.status(404).json({ message: "User not found" });
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

app.get("/api/users/:id/transactions", (req, res) => {
  const users = loadUsers();
  const user = users.users.find(u => u.id === req.params.id);
  if (user) {
    const allTxns = [
      ...user.checking.transactions.map(txn => ({ ...txn, account: "checking" })),
      ...user.savings.transactions.map(txn => ({ ...txn, account: "savings" }))
    ];
    res.json(allTxns);
  } else {
    res.status(404).json({ message: "User not found" });
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

const path = require('path');

app.get('/admin-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
