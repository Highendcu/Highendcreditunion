
document.addEventListener("DOMContentLoaded", function () {
  const callSupportBtn = document.getElementById("callSupportBtn");
  const staffPinInput = document.getElementById("staffPinInput");
  const verifyPinBtn = document.getElementById("verifyPinBtn");

  if (callSupportBtn) {
    callSupportBtn.addEventListener("click", function (e) {
      e.preventDefault();
      alert("+1(234).265.1965");
    });
  }

  if (verifyPinBtn) {
    verifyPinBtn.addEventListener("click", function () {
      const pin = staffPinInput.value;
      if (pin === "090909090") {
        window.location.href = "/views/admin-dashboard.html";
      } else {
        alert("Incorrect PIN");
      }
    });
  }
});
