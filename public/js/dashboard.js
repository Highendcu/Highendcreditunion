document.addEventListener('DOMContentLoaded', async () => {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user) return location.href = "login.html";

  const routingNumber = "836284645";
  const checkingCard = document.querySelector(".account-card[data-type='Checking']");
  const savingsCard = document.querySelector(".account-card[data-type='Savings']");
  const transactionTable = document.querySelector("#transactionTable tbody");

  // Refresh and sync user
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
    checkingCard.querySelector(".display-6").textContent = `$${checking.balance.toFixed(2)}`;
    checkingCard.querySelector("small").textContent = `•••• ${checking.accountNumber.slice(-4)}`;
    savingsCard.querySelector(".display-6").textContent = `$${savings.balance.toFixed(2)}`;
    savingsCard.querySelector("small").textContent = `•••• ${savings.accountNumber.slice(-4)}`;
  }

  async function loadTransactions(userId) {
    const res = await fetch(`/api/users/${userId}/transactions`);
    const txs = await res.json();
    transactionTable.innerHTML = "";
    txs.forEach(tx => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(tx.date).toLocaleString()}</td>
        <td>${tx.account}</td>
        <td>${tx.type}</td>
        <td>$${tx.amount.toFixed(2)}</td>`;
      transactionTable.appendChild(tr);
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

  checkingCard?.addEventListener("click", () => {
    const u = JSON.parse(localStorage.getItem("loggedInUser"));
    const c = u.checking;
    const html = `
      <p><strong>Account Type:</strong> Checking</p>
      <p><strong>Account Number:</strong> ${c.accountNumber}</p>
      <p><strong>Routing Number:</strong> ${routingNumber}</p>
      <p><strong>Balance:</strong> $${c.balance.toFixed(2)}</p>
    `;
    document.getElementById("accountDetailsContent").innerHTML = html;
    new bootstrap.Modal(document.getElementById("accountDetailsModal")).show();
  });

  savingsCard?.addEventListener("click", () => {
    const u = JSON.parse(localStorage.getItem("loggedInUser"));
    const s = u.savings;
    const html = `
      <p><strong>Account Type:</strong> Savings</p>
      <p><strong>Account Number:</strong> ${s.accountNumber}</p>
      <p><strong>Routing Number:</strong> ${routingNumber}</p>
      <p><strong>Balance:</strong> $${s.balance.toFixed(2)}</p>
    `;
    document.getElementById("accountDetailsContent").innerHTML = html;
    new bootstrap.Modal(document.getElementById("accountDetailsModal")).show();
  });

  const fresh = await refreshUserData();
  updateDashboard(fresh);
  loadTransactions(fresh._id);
});
