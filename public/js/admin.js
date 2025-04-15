// Ensure only admins access this page
if (localStorage.getItem("isAdmin") !== "true") {
  window.location.href = "/index.html";
}

window.onload = () => {
  fetchUsers();
  updateTransactionTable();
  updatePagination();
};

// Fetch Users from MongoDB and display in main table
async function fetchUsers() {
  const response = await fetch("/api/users");
  const users = await response.json();
  const tbody = document.getElementById("userTable");
  const userTableManage = document.getElementById("user-table");

  tbody.innerHTML = "";
  userTableManage.innerHTML = "";

  users.forEach(user => {
    // User Accounts section
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.checking.accountNumber}<br>${user.savings.accountNumber}</td>
      <td>Checking<br>Savings</td>
      <td>$${user.checking.balance.toLocaleString()}<br>$${user.savings.balance.toLocaleString()}</td>
      <td>${user.email}</td>
    `;
    tbody.appendChild(row);

    // Manage Users section
    const rowManage = document.createElement("tr");
    rowManage.innerHTML = `
      <td class="px-4 py-2">${user.name}</td>
      <td class="px-4 py-2">${user.email}</td>
      <td class="px-4 py-2">Checking: ${user.checking.accountNumber}<br>Savings: ${user.savings.accountNumber}</td>
      <td class="px-4 py-2">Checking: $${user.checking.balance.toLocaleString()}<br>Savings: $${user.savings.balance.toLocaleString()}</td>
      <td class="px-4 py-2">${user.status}</td>
      <td class="px-4 py-2">
        <button class="btn btn-sm btn-warning" onclick="editUser('${user.checking.accountNumber}', 'checking')">Edit Checking</button>
        <button class="btn btn-sm btn-secondary" onclick="editUser('${user.savings.accountNumber}', 'savings')">Edit Savings</button>
        <button class="btn btn-sm btn-info" onclick="changePasswordPrompt('${user._id}')">Change Password</button>
        <button class="btn btn-sm btn-danger" onclick="toggleSuspendUser('${user._id}')">${user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}</button>
      </td>
    `;
    userTableManage.appendChild(rowManage);
  });
}

function editUser(accountNumber, accountType) {
  document.getElementById("account-number-action").value = accountNumber;
  document.getElementById("account-type-action").value = accountType;
  document.getElementById("user-actions").scrollIntoView({ behavior: "smooth" });
}

function changePasswordPrompt(userId) {
  const newPassword = prompt("Enter new password:");
  if (!newPassword) return;
  fetch(`/api/users/${userId}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPassword })
  })
    .then(res => res.json())
    .then(data => alert(data.message || "Password updated"))
    .catch(() => alert("Error changing password"));
}

function toggleSuspendUser(userId) {
  if (!confirm("Toggle suspension for this user?")) return;
  fetch(`/api/users/${userId}/toggle-suspend`, { method: "POST" })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      fetchUsers();
    })
    .catch(() => alert("Suspension failed"));
}

// Handle User Actions (form)
document.getElementById("action").addEventListener("change", function () {
  const selected = this.value;
  document.getElementById("balance-amount").closest(".mb-3").classList.toggle("d-none", selected !== "update-balance");
  document.getElementById("new-password").closest(".mb-3").classList.toggle("d-none", selected !== "change-password");
});

document.addEventListener("DOMContentLoaded", () => {
  const alertBox = document.getElementById("admin-alert");

  function showAdminAlert(message, type = "success") {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove("d-none");

    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 3000);
  }

  // Handle balance update
  document.getElementById("user-action-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const accountNumber = document.getElementById("account-number-action").value.trim();
    const accountType = document.getElementById("account-type-action").value;
    const amount = parseFloat(document.getElementById("balance-amount").value);

    if (!accountNumber || isNaN(amount)) {
      return showAdminAlert("Missing or invalid input", "danger");
    }

    try {
      const res = await fetch("/api/users");
      const users = await res.json();
      const user = users.find(u => u[accountType]?.accountNumber === accountNumber);

      if (!user) return showAdminAlert("User not found", "danger");

      const updateRes = await fetch(`/api/users/${user._id}/update-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: accountType, amount })
      });

      const result = await updateRes.json();
      if (updateRes.ok) {
        showAdminAlert("Balance updated successfully", "success");
        highlightRow(user._id);
      } else {
        showAdminAlert(result.message || "Error updating balance", "danger");
      }
    } catch (err) {
      showAdminAlert("Server error during balance update", "danger");
      console.error(err);
    }
  });

  function highlightRow(userId) {
    const row = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (row) {
      row.classList.add("table-success");
      setTimeout(() => row.classList.remove("table-success"), 2000);
    }
  }
});

});

// Admin transfer form
const transferForm = document.getElementById("transferForm");
if (transferForm) {
  transferForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const accountNumber = document.getElementById("accountNumber").value;
    const accountName = document.getElementById("accountName").value;
    const accountType = document.getElementById("accountType").value;
    const amount = parseFloat(document.getElementById("transferAmount").value);
    const memo = document.getElementById("transferMemo").value;

    if (!accountNumber || !accountName || isNaN(amount)) return alert("Fill all fields correctly");

    const res = await fetch("/api/admin/transfer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountNumber, accountType, amount, memo })
    });

    const result = await res.json();
    alert(result.message || "Transfer complete");
    transferForm.reset();
    fetchUsers();
  });
}

// Quick Transfer Modal
const confirmQuickTransfer = document.getElementById("confirmQuickTransfer");
if (confirmQuickTransfer) {
  confirmQuickTransfer.addEventListener("click", () => {
    const pin = document.getElementById("transferPin").value;
    if (pin === "1234") {
      const externalAccount = document.getElementById("externalAccount").value;
      const amount = parseFloat(document.getElementById("transferAmountQuick").value);
      if (!externalAccount || isNaN(amount)) return alert("Fill fields correctly");
      alert(`Transferred $${amount} to account ${externalAccount}`);
      const modal = bootstrap.Modal.getInstance(document.getElementById("quickTransferModal"));
      modal.hide();
      document.getElementById("externalAccount").value = "";
      document.getElementById("transferAmountQuick").value = "";
      document.getElementById("transferPin").value = "";
    } else {
      alert("Invalid PIN");
    }
  });
}

// Transaction Data (placeholder - could be dynamic)
let transactions = [
  {
    date: "2025-04-01",
    account: "••••7890",
    type: "Checking",
    amount: 50000.0,
    description: "Loan Payment"
  },
  {
    date: "2025-04-02",
    account: "••••4321",
    type: "Savings",
    amount: -10000.0,
    description: "Deposit Refund"
  }
];

let currentPage = 1;
const transactionsPerPage = 5;

function updateTransactionTable() {
  const tbody = document.getElementById("transactionTable");
  tbody.innerHTML = "";
  const start = (currentPage - 1) * transactionsPerPage;
  const pageTransactions = transactions.slice(start, start + transactionsPerPage);
  pageTransactions.forEach(trans => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${trans.date}</td>
      <td>${trans.account}</td>
      <td>${trans.type}</td>
      <td class="${trans.amount < 0 ? 'text-danger' : 'text-success'}">$${Math.abs(trans.amount).toLocaleString()}</td>
      <td>${trans.description}</td>
    `;
    tbody.appendChild(row);
  });
}

function updatePagination() {
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${totalPages}`;
  document.getElementById("previousPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

document.getElementById("previousPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    updateTransactionTable();
    updatePagination();
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    updateTransactionTable();
    updatePagination();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const alertBox = document.getElementById("admin-alert");

  function showAdminAlert(message, type = "success") {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.classList.remove("d-none");

    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 3000);
  }
