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
  const cards = document.querySelectorAll(".account-card");
  cards.forEach(card => {
    card.addEventListener("click", () => {
      const type = card.textContent.includes("Checking") ? "Checking" : "Savings";
      const modal = new bootstrap.Modal(document.getElementById("accountDetailsModal"));
      const content = `
        <p><strong>Account Type:</strong> ${type}</p>
        <p><strong>Account Number:</strong> ${type === 'Checking' ? '1234567890' : '0987654321'}</p>
        <p><strong>Balance:</strong> ${type === 'Checking' ? '$0.00' : '$0.00document.addEventListener("DOMContentLoaded", async () => {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || !user.id) return;

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
