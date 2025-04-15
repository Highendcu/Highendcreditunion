// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const username = this.querySelector('input[type="text"]').value;
  const password = this.querySelector('input[type="password"]').value;

  if (!username || !password) {
    alert('Please fill in all fields');
    return;
  }

  localStorage.setItem('bankData', JSON.stringify({
    checkingBalance: 26550228.21,
    savingsBalance: 26550228.21
  }));

  window.location.href = 'user-dashboard.html';
});