document.addEventListener("DOMContentLoaded", function () {
  const staffOnlyBtn = document.getElementById("staffOnlyBtn");
  const staffPinModal = new bootstrap.Modal('#staffPinModal');
  const verifyPinBtn = document.getElementById("submitPinBtn");

  if (staffOnlyBtn) {
    staffOnlyBtn.addEventListener("click", function (e) {
      e.preventDefault();
      staffPinModal.show();
    });
  }

  if (verifyPinBtn) {
    verifyPinBtn.addEventListener("click", function () {
      const pin = document.getElementById("staffPin").value;
      if (pin === "090909090") {
         localStorage.setItem("isAdmin", "true");
         window.location.href = "/admin-dashboard.html";
       }

    });
  }

  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("usernameInput").value;
      const password = document.getElementById("passwordInput").value;

      try {
        const res = await fetch("/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem("loggedInUser", JSON.stringify(data.user));
          window.location.href = "user-dashboard.html";
        } else {
          alert(data.message || "Login failed");
        }
      } catch (err) {
        console.error("Login error:", err);
        alert("Error connecting to server.");
      }
    });
  }
});
