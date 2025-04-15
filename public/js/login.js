// Replace the existing verifyPinBtn code with:
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
        window.location.href = "/views/admin-dashboard.html";
      } else {
        document.getElementById("staffPin").classList.add("is-invalid");
      }
    });
  }
});