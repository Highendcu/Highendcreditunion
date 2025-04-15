document.addEventListener('DOMContentLoaded', () => {
  const checkingModal = document.getElementById('checkingDetails');
  const savingsModal = document.getElementById('savingsDetails');

  // Example dynamic content
  if (checkingModal)
    checkingModal.innerHTML = `<p>Account #: 1234567890<br>Balance: $500.00</p>`;
  if (savingsModal)
    savingsModal.innerHTML = `<p>Account #: 0987654321<br>Balance: $800.00</p>`;

  // Populate transaction table
  const transactions = [
    { date: '2025-04-15', account: 'Checking', type: 'Deposit', amount: '$200.00', desc: 'Initial deposit' },
    { date: '2025-04-16', account: 'Savings', type: 'Transfer', amount: '$100.00', desc: 'Transfer to savings' }
  ];
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
        <p><strong>Balance:</strong> ${type === 'Checking' ? '$500.00' : '$800.00'}</p>
      `;
      document.getElementById("accountDetailsContent").innerHTML = content;
      modal.show();
    });
  });
});
