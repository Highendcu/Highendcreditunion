// admin.js - Full Admin Controls

document.addEventListener("DOMContentLoaded", function () {
  const userTable = document.getElementById("userTable");

  // Event delegation for all admin actions
  userTable.addEventListener("click", function (e) {
    const target = e.target;
    const row = target.closest("tr");
    const userId = row.getAttribute("data-user-id");

    if (target.classList.contains("suspend-btn")) {
      suspendUser(userId);
    } else if (target.classList.contains("change-password-btn")) {
      changePassword(userId);
    } else if (target.classList.contains("view-transactions-btn")) {
      viewTransactionHistory(userId);
    } else if (target.classList.contains("adjust-balance-btn")) {
      adjustUserBalance(userId);
    } else if (target.classList.contains("delete-btn")) {
      deleteUser(userId);
    }
  });

  function suspendUser(userId) {
    if (confirm("Are you sure you want to suspend this user?")) {
      fetch(`/admin/api/suspend_user/${userId}`, {
        method: "POST"
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || "User suspended successfully.");
          location.reload();
        });
    }
  }

  function changePassword(userId) {
    const newPassword = prompt("Enter new password for this user:");
    if (newPassword) {
      fetch(`/admin/api/change_password/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword })
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || "Password changed successfully.");
        });
    }
  }

  function viewTransactionHistory(userId) {
    window.location.href = `/admin/transaction_history/${userId}`;
  }

  function adjustUserBalance(userId) {
    const amount = prompt("Enter amount to adjust balance (use negative for deduction):");
    if (!isNaN(amount)) {
      fetch(`/admin/api/adjust_balance/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || "Balance updated successfully.");
          location.reload();
        });
    } else {
      alert("Please enter a valid number.");
    }
  }

  function deleteUser(userId) {
    if (confirm("Are you sure you want to delete this user permanently?")) {
      fetch(`/admin/api/delete_user/${userId}`, {
        method: "DELETE"
      })
        .then((res) => res.json())
        .then((data) => {
          alert(data.message || "User deleted successfully.");
          row.remove();
        });
    }
  }
});
