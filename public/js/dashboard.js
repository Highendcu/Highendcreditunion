document.addEventListener('DOMContentLoaded', () => {
  const checkingModal = document.getElementById('checkingDetails');
  const savingsModal = document.getElementById('savingsDetails');

  // Example dynamic content
  if (checkingModal)
    checkingModal.innerHTML = `<p>Account #: 1234567890<br>Balance: $0.00</p>`;
  if (savingsModal)
    savingsModal.innerHTML = `<p>Account #: 0987654321<br>Balance: $0.00</p>`;

  // Populate transaction table
  const transactions = [];
  const tbody = document.getElementById('transactionTable');
  if (tbody) {
    transactions.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.date}</td><td>${t.account}</td><td>${t.type}</td><td>${t.amount}</td><td>${t.desc}</td>`;
      tbody.appendChild(tr);
    });
  }

  // Attach modal logic to account cards
const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || !user.accounts) return;

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const type = card.getAttribute("data-type").toLowerCase(); // "checking" or "savings"
      const account = user.accounts[type];

      const html = `
        <p><strong>Account Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
        <p><strong>Account Number:</strong> ${account.accountNumber}</p>
        <p><strong>Routing Number:</strong> ${account.routingNumber}</p>
        <p><strong>Balance:</strong> $${parseFloat(account.balance).toFixed(2)}</p>
      `;

      document.getElementById("accountDetailsContent").innerHTML = html;
      new bootstrap.Modal(document.getElementById("accountDetailsModal")).show();
    });
  });
});

  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!user) return location.href = "login.html";

  const routingNumber = "836284645";

  async function refreshUserData() {
    const res = await fetch(`/api/users`);
    const users = await res.json();
    const fresh = users.find(u => u.email === user.email);
    if (fresh) {
      localStorage.setItem("loggedInUser", JSON.stringify(fresh));
      return fresh;
    }
    return user;
  }

  function updateDashboard(data) {
    const { checking, savings } = data;
    const currentBalance = (checking.balance + savings.balance).toFixed(2);
    document.querySelector(".card h3").textContent = `$${currentBalance}`;
    document.querySelector(".text-muted").textContent = `$${currentBalance}`;
    document.querySelector(".account-card[data-type='Checking'] .display-6").textContent = `$${checking.balance.toFixed(2)}`;
    document.querySelector(".account-card[data-type='Checking'] small").textContent = `•••• ${checking.accountNumber.slice(-4)}`;
    document.querySelector(".account-card[data-type='Savings'] .display-6").textContent = `$${savings.balance.toFixed(2)}`;
    document.querySelector(".account-card[data-type='Savings'] small").textContent = `•••• ${savings.accountNumber.slice(-4)}`;
  }

  async function loadTransactions(userId) {
    const res = await fetch(`/api/users/${userId}/transactions`);
    const txs = await res.json();
    const tbody = document.querySelector("#transactionTable tbody");
    tbody.innerHTML = "";
    txs.forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(tx.date).toLocaleString()}</td>
        <td>${tx.account}</td>
        <td>${tx.type}</td>
        <td>$${tx.amount.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
  }

  document.querySelector("[data-bs-target='#accountDetailsModal']").addEventListener("click", () => {
    const user = JSON.parse(localStorage.getItem("loggedInUser"));
    const html = `
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Checking:</strong> ${user.checking.accountNumber}</p>
      <p><strong>Savings:</strong> ${user.savings.accountNumber}</p>
      <p><strong>Routing Number:</strong> ${routingNumber}</p>`;
    document.getElementById("accountDetailsContent").innerHTML = html;
  });

  document.getElementById("internalTransferForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const form = e.target;
    const from = form.fromAccount.value;
    const to = form.toAccount.value;
    const amt = parseFloat(form.amount.value);

    if (from === to || amt <= 0) return alert("Invalid transfer");

    const updated = JSON.parse(localStorage.getItem("loggedInUser"));
    updated[from].balance -= amt;
    updated[to].balance += amt;

    updated[from].transactions.push({ type: "Debit", amount: amt, date: new Date().toISOString() });
    updated[to].transactions.push({ type: "Credit", amount: amt, date: new Date().toISOString() });

    await fetch(`/api/users/${updated._id}/update-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: from, amount: -amt })
    });

    await fetch(`/api/users/${updated._id}/update-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: to, amount: amt })
    });

    const fresh = await refreshUserData();
    updateDashboard(fresh);
    loadTransactions(fresh._id);
    alert("Transfer complete");
    const modal = bootstrap.Modal.getInstance(document.getElementById("internalTransferModal"));
    modal.hide();
  });

  refreshUserData().then(u => {
    updateDashboard(u);
    loadTransactions(u._id);
  });
});

  const transactionTable = document.getElementById("transactionTable");

  try {
    const res = await fetch(`/api/users/${user.id}/transactions`);
    const data = await res.json();

    transactionTable.innerHTML = "";

    data.forEach(t => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(t.date).toLocaleDateString()}</td>
        <td>${t.account}</td>
        <td>${t.type || "Transfer"}</td>
        <td>${t.amount ? `$${parseFloat(t.amount).toFixed(2)}` : "$0.00"}</td>
        <td>${t.description || "-"}</td>
      `;
      transactionTable.appendChild(row);
    });

  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    transactionTable.innerHTML = `<tr><td colspan="5">Error loading transactions.</td></tr>`;
  }
});
'}</p>
      `;
      document.getElementById("accountDetailsContent").innerHTML = content;
      modal.show();
    });
  });
});


