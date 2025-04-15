document.addEventListener('DOMContentLoaded', function () {
  let currentSection = 0;
  let selectedAccounts = [];

  const monthSelect = document.getElementById('birthMonth');
  const daySelect = document.getElementById('birthDay');
  const yearSelect = document.getElementById('birthYear');

  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  months.forEach((month, index) => {
    monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
  });
  for (let i = 1; i <= 31; i++) {
    daySelect.innerHTML += `<option value="${i}">${i}</option>`;
  }
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 18; i >= 1900; i--) {
    yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
  }

  const countrySelect = document.getElementById('country');
  const stateField = document.getElementById('stateField');
  const stateSelect = document.getElementById('state');
  countrySelect.addEventListener('change', function () {
    if (this.value === 'US') {
      stateField.style.display = 'block';
      stateSelect.required = true;
    } else {
      stateField.style.display = 'none';
      stateSelect.required = false;
    }
  });

  const states = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
                  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
                  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
                  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
                  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
  states.forEach(state => {
    stateSelect.innerHTML += `<option value="${state}">${state}</option>`;
  });

  const savedForm = JSON.parse(localStorage.getItem('signupProgress') || '{}');
  for (const [key, value] of Object.entries(savedForm)) {
    const input = document.getElementById(key);
    if (input) {
      if (input.type === 'checkbox') input.checked = value;
      else input.value = value;
    }
  }

  if (savedForm.selectedAccounts) {
    selectedAccounts = savedForm.selectedAccounts;
    selectedAccounts.forEach(type => {
      const card = document.querySelector(`.account-card[data-account="${type}"]`);
      if (card) card.classList.add('selected');
    });
  }

  document.querySelectorAll('.account-card').forEach(card => {
    card.addEventListener('click', function () {
      this.classList.toggle('selected');
      selectedAccounts = Array.from(document.querySelectorAll('.account-card.selected'))
        .map(card => card.dataset.account);
      saveProgress();
    });
  });

  window.showNextSection = function(id) {
    const sections = document.querySelectorAll('.form-section');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    currentSection++;
  }

  window.showPreviousSection = function() {
    const sections = document.querySelectorAll('.form-section');
    sections.forEach(sec => sec.classList.remove('active'));
    if (currentSection > 0) currentSection--;
    sections[currentSection].classList.add('active');
  }

  window.validateAccountSelection = function() {
    const selected = document.querySelectorAll('.account-card.selected');
    if (selected.length === 0) {
      alert('Please select at least one account type.');
      return;
    }
    selectedAccounts = Array.from(selected).map(card => card.dataset.account);
    saveProgress();
    showNextSection('personalInfo');
  }

  window.validatePersonalInfo = function() {
    const form = document.getElementById('personalInfoForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    saveProgress();
    showNextSection('reviewSubmit');
    document.getElementById('selectedAccountsList').innerHTML =
      selectedAccounts.map(acc => `<li>${acc.replace(/-/g, ' ')}</li>`).join('');
    document.getElementById('personalInfoReview').innerHTML = `
      <p><strong>Name:</strong> ${document.getElementById('firstName').value} ${document.getElementById('lastName').value}</p>
      <p><strong>SSN:</strong> ${document.getElementById('ssn').value}</p>
      <p><strong>DOB:</strong> ${document.getElementById('birthMonth').value}/${document.getElementById('birthDay').value}/${document.getElementById('birthYear').value}</p>
      <p><strong>Address:</strong> ${document.getElementById('street').value}, ${document.getElementById('city').value}, ${document.getElementById('zip').value}, ${document.getElementById('country').value} ${document.getElementById('state').value || ''}</p>
      <p><strong>Email:</strong> ${document.getElementById('email').value}</p>
      <p><strong>Phone:</strong> ${document.getElementById('phone').value}</p>
      <p><strong>Dual Citizenship:</strong> ${document.getElementById('dualCitizenship').checked ? 'Yes' : 'No'}</p>
    `;
  }

  window.submitApplication = function() {
    if (!document.getElementById('termsCheck').checked) {
      alert('Please agree to the Terms and Privacy Policy');
      return;
    }
    const email = document.getElementById('email').value;
    document.getElementById('userEmail').textContent = email;
    setTimeout(() => showNextSection('emailVerification'), 300);
  }

  window.completeSetup = function () {
    const form = document.getElementById('credentialForm');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const name = document.getElementById('firstName').value + " " + document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const selectedAccountType = selectedAccounts[0] || "checking";

    fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        username,
        password,
        selectedAccountType,
        status: "active"
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('loggedInUser', JSON.stringify(data.user));
        localStorage.removeItem('signupProgress');
        window.location.href = "user-dashboard.html";
      } else {
        alert(data.message || "Registration failed.");
      }
    })
    .catch(err => {
      console.error("Error registering:", err);
      alert("Error connecting to server.");
    });
  }

  function saveProgress() {
    const fields = ['firstName', 'lastName', 'ssn', 'birthMonth', 'birthDay', 'birthYear',
                    'street', 'city', 'zip', 'country', 'state', 'email', 'phone', 'dualCitizenship'];
    const progress = {};
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) progress[id] = el.type === 'checkbox' ? el.checked : el.value;
    });
    progress.selectedAccounts = selectedAccounts;
    localStorage.setItem('signupProgress', JSON.stringify(progress));
  }
});