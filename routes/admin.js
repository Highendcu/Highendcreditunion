document.addEventListener("DOMContentLoaded", () => {
  const userTable = document.getElementById("user-table");
  const actionForm = document.getElementById("user-action-form");
  const toastEl = document.getElementById("admin-toast");
  const toastBody = document.getElementById("toast-body");

  function showToast(message, isError = false) {
    toastBody.textContent = message;
    toastBody.classList.toggle("text-danger", isError);
    toastBody.classList.toggle("text-success", !isError);
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const users = await res.json();

      userTable.innerHTML = "";
      users.forEach((user) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            Checking: ${user.checking?.accountNumber || "N/A"}<br>
            Savings: ${user.savings?.accountNumber || "N/A"}
          </td>
          <td>
            Checking: $<span class="balance">${user.checking?.balance.toFixed(2)}</span><br>
            Savings: $<span class="balance">${user.savings?.balance.toFixed(2)}</span>
          </td>
          <td>
            <span class="${user.status === "suspended" ? "text-danger" : "text-success"}">${user.status}</span>
          </td>
          <td>
            <button class="btn btn-sm btn-warning" onclick="toggleSuspend('${user._id}')">Toggle Suspend</button>
          </td>
        `;
        userTable.appendChild(row);
      });
    } catch (err) {
      console.error("Fetch Error", err);
      showToast("Failed to load users", true);
    }
  }

  window.toggleSuspend = async function (id) {
    try {
      const res = await fetch(`/api/users/${id}/toggle-suspend`, { method: "POST" });
      const data = await res.json();
      showToast(data.message);
      fetchUsers();
    } catch (err) {
      showToast("Error updating status", true);
    }
  };

  actionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const accountNumber = document.getElementById("account-number-action").value;
    const accountType = document.getElementById("account-type-action").value;
    const amount = parseFloat(document.getElementById("balance-amount").value);

    if (!accountNumber || isNaN(amount)) return showToast("Invalid form inputs", true);

    try {
      const resUsers = await fetch("/api/users");
      const allUsers = await resUsers.json();
      const user = allUsers.find(
        u => u[accountType]?.accountNumber == accountNumber
      );

      if (!user) return showToast("Account not found", true);

      const res = await fetch(`/api/users/${user._id}/update-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: accountType, amount })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Balance updated: $${data.balance}`);
        fetchUsers();
      } else {
        showToast(data.message || "Update failed", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Server error", true);
    }
  });

  fetchUsers();
});
