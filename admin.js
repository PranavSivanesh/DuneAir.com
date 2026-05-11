// Admin helpers for Dune Air

const ADMIN_PASSWORD = 'admin';
let isAdminMode = false;

// Check admin mode on page load
document.addEventListener('DOMContentLoaded', () => {
  const adminMode = sessionStorage.getItem('adminMode');
  if (adminMode === 'true') {
    isAdminMode = true;
    showAdminUI();
  }

  // Admin trigger button
  const adminTrigger = document.getElementById('adminTrigger');
  if (adminTrigger) {
    adminTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (isAdminMode) {
        // Leave admin mode if already active
        exitAdminMode();
      } else {
        // Show admin password modal
        const adminModal = document.getElementById('adminModal');
        if (adminModal) {
          adminModal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }
    });
  }

  // Close admin modal
  const closeAdminModal = document.querySelector('.close-admin-modal');
  if (closeAdminModal) {
    closeAdminModal.addEventListener('click', () => {
      const adminModal = document.getElementById('adminModal');
      if (adminModal) {
        adminModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Close modal by clicking the overlay
  const adminModal = document.getElementById('adminModal');
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        adminModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Admin form submission
  const adminForm = document.getElementById('adminForm');
  if (adminForm) {
    adminForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const password = document.getElementById('adminPassword').value;
      const adminError = document.getElementById('adminError');

      if (password === ADMIN_PASSWORD) {
        // Correct password
        isAdminMode = true;
        sessionStorage.setItem('adminMode', 'true');

        // Close modal
        adminModal.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Show admin UI
        showAdminUI();

        // Clear form
        adminForm.reset();
        adminError.style.display = 'none';
      } else {
        // Wrong password
        adminError.textContent = 'Incorrect password';
        adminError.style.display = 'block';
      }
    });
  }

  // Edit flights button
  const editFlightsBtn = document.getElementById('editFlightsBtn');
  if (editFlightsBtn) {
    editFlightsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = 'admin-flights.html';
    });
  }
});

function showAdminUI() {
  const adminIndicator = document.getElementById('adminIndicator');
  const editFlightsBtn = document.getElementById('editFlightsBtn');
  const adminTrigger = document.getElementById('adminTrigger');

  if (adminIndicator) adminIndicator.style.display = 'inline';
  if (editFlightsBtn) editFlightsBtn.style.display = 'inline';
  if (adminTrigger) adminTrigger.textContent = 'Exit Admin';
}

function exitAdminMode() {
  isAdminMode = false;
  sessionStorage.removeItem('adminMode');

  const adminIndicator = document.getElementById('adminIndicator');
  const editFlightsBtn = document.getElementById('editFlightsBtn');
  const adminTrigger = document.getElementById('adminTrigger');

  if (adminIndicator) adminIndicator.style.display = 'none';
  if (editFlightsBtn) editFlightsBtn.style.display = 'none';
  if (adminTrigger) adminTrigger.textContent = 'Admin';
}
