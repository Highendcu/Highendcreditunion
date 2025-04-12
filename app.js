const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
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
  if (!fs.existsSync(USERS_FILE)) return { users: [] }; // Ensure there's a users key even if file is empty
  
  const rawData = fs.readFileSync(USERS_FILE); // Read the file data
  try {
    return JSON.parse(rawData); // Parse JSON content
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { users: [] }; // If parsing fails, return an empty array
  }
}


function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log("Users saved successfully.");
  } catch (error) {
    console.error("Error saving users to file:", error);
  }
}

function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit number
}

// Serve HTML pages
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

  if (!name || !email || !password || !accountType) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const users = loadUsers();
  console.log("Users before registration:", users); // Debug: Check current users list

  if (users.find(u => u.email === email)) {
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

    users.push(newUser);
    saveUsers(users);
    res.json({ success: true, message: "Registration success!", redirect: "/user-dashboard" });
  });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();

  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      res.json({ success: true, user });
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
  res.json(users);
});

app.post("/api/users/:id/toggle-suspend", (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.params.id);
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
  const user = users.find(u => u.id === req.params.id);
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
  const user = users.find(u => u.id === req.params.id);
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
  const user = users.find(u => u.id === req.params.id);

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

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
