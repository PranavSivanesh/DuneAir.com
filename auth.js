// Authentication functionality for Dune Air

let currentUser = null;
let isSignupMode = false;

// Check session on page load
async function checkSession() {
  try {
    const response = await fetch('http://localhost:3003/api/auth/session', {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.loggedIn) {
      currentUser = data.user;
      updateUIForLoggedInUser();
      loadUserBookings();
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

// Update UI when user is logged in
function updateUIForLoggedInUser() {
  // Hide login button, show user info in navbar
  const loginTrigger = document.getElementById('loginTrigger');
  const userNavInfo = document.getElementById('userNavInfo');
  const navUserEmail = document.getElementById('navUserEmail');

  if (loginTrigger) loginTrigger.style.display = 'none';
  if (userNavInfo) {
    userNavInfo.style.display = 'inline';
    navUserEmail.textContent = currentUser.email;
  }

  // Show booking history section
  const bookingHistorySection = document.getElementById('bookingHistorySection');
  if (bookingHistorySection) {
    bookingHistorySection.style.display = 'block';
  }

  // Show loyalty summary section
  const loyaltySummarySection = document.getElementById('loyaltySummarySection');
  if (loyaltySummarySection) {
    loyaltySummarySection.style.display = 'block';
  }
}

// Update UI when user is logged out
function updateUIForLoggedOutUser() {
  const loginTrigger = document.getElementById('loginTrigger');
  const userNavInfo = document.getElementById('userNavInfo');

  if (loginTrigger) loginTrigger.style.display = 'inline';
  if (userNavInfo) userNavInfo.style.display = 'none';

  // Hide booking history section
  const bookingHistorySection = document.getElementById('bookingHistorySection');
  if (bookingHistorySection) {
    bookingHistorySection.style.display = 'none';
  }

  const loyaltySummarySection = document.getElementById('loyaltySummarySection');
  if (loyaltySummarySection) {
    loyaltySummarySection.style.display = 'none';
  }

  currentUser = null;
}

// Toggle between login and signup modes
function toggleAuthMode() {
  isSignupMode = !isSignupMode;

  const modalTitle = document.getElementById('authModalTitle');
  const confirmPasswordField = document.getElementById('confirmPasswordField');
  const submitBtn = document.getElementById('authSubmitBtn');
  const toggleText = document.getElementById('authToggleText');
  const toggleLink = document.getElementById('authToggleLink');
  const authError = document.getElementById('authError');

  // Clear error message
  authError.style.display = 'none';

  if (isSignupMode) {
    modalTitle.textContent = 'Sign Up';
    confirmPasswordField.style.display = 'block';
    submitBtn.textContent = 'Sign Up';
    toggleText.innerHTML = 'Already have an account? <a href="#" id="authToggleLink" style="color: var(--color-primary); font-weight: 700;">Log In</a>';
  } else {
    modalTitle.textContent = 'Log In';
    confirmPasswordField.style.display = 'none';
    submitBtn.textContent = 'Log In';
    toggleText.innerHTML = 'Don\'t have an account? <a href="#" id="authToggleLink" style="color: var(--color-primary); font-weight: 700;">Sign Up</a>';
  }

  // Re-attach event listener to new toggle link
  document.getElementById('authToggleLink').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthMode();
  });
}

// Show error message in auth modal
function showAuthError(message) {
  const authError = document.getElementById('authError');
  authError.textContent = message;
  authError.style.display = 'block';
}

// Validate email format
function isValidEmail(email) {
  return email.includes('@') && email.includes('.');
}

// Handle login/signup form submission
async function handleAuthSubmit(e) {
  e.preventDefault();

  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const confirmPassword = document.getElementById('authConfirmPassword').value;

  // Validate email
  if (!isValidEmail(email)) {
    showAuthError('Please enter a valid email address');
    return;
  }

  // If signup mode, check password confirmation
  if (isSignupMode) {
    if (password !== confirmPassword) {
      showAuthError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      showAuthError('Password must be at least 6 characters');
      return;
    }
  }

  const endpoint = isSignupMode ? '/api/auth/signup' : '/api/auth/login';

  try {
    const response = await fetch(`http://localhost:3003${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;

      // Close modal
      const loginModal = document.getElementById('loginModal');
      loginModal.style.display = 'none';
      document.body.style.overflow = 'auto';

      // Update UI
      updateUIForLoggedInUser();
      loadUserBookings();

      // Reset form
      document.getElementById('loginForm').reset();
      isSignupMode = false;
      toggleAuthMode();

    } else {
      showAuthError(data.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    showAuthError('An error occurred. Please try again.');
  }
}

// Handle logout
async function handleLogout() {
  try {
    const response = await fetch('http://localhost:3003/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      updateUIForLoggedOutUser();

      // Clear bookings list
      const bookingHistoryList = document.getElementById('bookingHistoryList');
      if (bookingHistoryList) {
        bookingHistoryList.innerHTML = '<p style="text-align: center; color: #999;">Please log in to view your bookings.</p>';
      }
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

// Load user's bookings
async function loadUserBookings() {
  if (!currentUser) return;

  const bookingHistoryList = document.getElementById('bookingHistoryList');
  if (!bookingHistoryList) return;

  let bookings = [];

  try {
    const response = await fetch(`http://localhost:3003/api/users/${currentUser.id}/bookings`, {
      credentials: 'include'
    });

    if (!response.ok) {
      bookingHistoryList.innerHTML = '<p style="text-align: center; color: #d32f2f;">Failed to load bookings.</p>';
      loadLoyaltySummary([]);
      return;
    }

    bookings = await response.json();

    if (!Array.isArray(bookings)) {
      bookingHistoryList.innerHTML = '<p style="text-align: center; color: #d32f2f;">Failed to load bookings.</p>';
      loadLoyaltySummary([]);
      return;
    }

    if (bookings.length === 0) {
      bookingHistoryList.innerHTML = '<p style="text-align: center; color: #999;">You have no bookings yet.</p>';
      loadLoyaltySummary([]);
      return;
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';

    bookings.forEach(booking => {
      const departureDate = new Date(booking.departure_time);
      const formattedDate = departureDate.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = departureDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      html += `
        <div class="booking-item" style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background: #f9f9f9;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h4 style="margin: 0 0 10px 0; color: var(--color-primary);">${booking.origin} → ${booking.destination}</h4>
              <p style="margin: 5px 0; color: #666;"><strong>Flight:</strong> ${booking.flight_id}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Departure:</strong> ${formattedDate} at ${formattedTime}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Booking ID:</strong> ${booking.booking_id}</p>
              <p style="margin: 5px 0; color: var(--color-accent); font-weight: 700;"><strong>Total:</strong> AED ${booking.total_price.toLocaleString()}</p>
              <p style="margin: 5px 0; color: #2e7d32; font-weight: 700;"><strong>Loyalty Earned:</strong> ${ (booking.points_earned || 0).toLocaleString() } pts</p>
            </div>
            <button class="btn secondary" onclick="cancelBooking(${booking.booking_id})" style="white-space: nowrap;">Cancel Booking</button>
          </div>
        </div>
      `;
    });

    html += '</div>';
    bookingHistoryList.innerHTML = html;
    loadLoyaltySummary(bookings);

  } catch (error) {
    console.error('Error loading bookings:', error);
    bookingHistoryList.innerHTML = '<p style="text-align: center; color: #d32f2f;">Failed to load bookings.</p>';
    loadLoyaltySummary([]);
  }
}

function getLoyaltyTier(points) {
  if (points >= 100000) return 'Platinum';
  if (points >= 50000) return 'Gold';
  if (points >= 25000) return 'Silver';
  return 'Bronze';
}

// Load loyalty summary (total points, tier, per-booking breakdown)
async function loadLoyaltySummary(bookings = []) {
  if (!currentUser) return;

  const loyaltySection = document.getElementById('loyaltySummarySection');
  const loyaltyContent = document.getElementById('loyaltySummaryContent');

  if (!loyaltySection || !loyaltyContent) return;

  loyaltySection.style.display = 'block';
  loyaltyContent.innerHTML = '<p style="color: #666; text-align: center;">Loading loyalty details...</p>';

  let totalPoints = 0;

  try {
    const response = await fetch(`http://localhost:3003/api/users/${currentUser.id}/loyalty`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      totalPoints = data.loyalty_points || 0;
      currentUser.loyalty_points = totalPoints;
    }
  } catch (error) {
    console.error('Error loading loyalty points:', error);
  }

  if (!totalPoints && Array.isArray(bookings)) {
    totalPoints = bookings.reduce((sum, booking) => sum + (booking.points_earned || 0), 0);
  }

  const tier = getLoyaltyTier(totalPoints);

  let bookingPointsHtml = '';
  if (Array.isArray(bookings) && bookings.length > 0) {
    bookingPointsHtml = bookings.map(booking => `
      <li style="margin-bottom: 6px;">
        Booking #${booking.booking_id}: +${(booking.points_earned || 0).toLocaleString()} pts — ${booking.origin} → ${booking.destination}
      </li>
    `).join('');
  } else {
    bookingPointsHtml = '<li style="margin-bottom: 6px;">No bookings yet. Earn points on your first trip!</li>';
  }

  loyaltyContent.innerHTML = `
    <p style="margin: 0 0 8px 0;"><strong>Total Points:</strong> ${totalPoints.toLocaleString()} pts</p>
    <p style="margin: 0 0 12px 0;"><strong>Current Tier:</strong> ${tier}</p>
    <div class="loyalty-booking-breakdown" style="background: #f7f9ff; border: 1px solid #d7e3ff; border-radius: 8px; padding: 12px;">
      <p style="margin: 0 0 6px 0; font-weight: 700; color: #2d3a63;">Points per booking</p>
      <ul style="padding-left: 18px; margin: 0; color: #45506b;">
        ${bookingPointsHtml}
      </ul>
    </div>
  `;
}

// Cancel a booking
async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  try {
    const response = await fetch(`http://localhost:3003/api/bookings/${bookingId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) {
      // Reload bookings
      loadUserBookings();
      alert('Booking cancelled successfully');
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to cancel booking');
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    alert('An error occurred while cancelling the booking');
  }
}

// Check if user is logged in before proceeding to booking
function requireLogin() {
  if (!currentUser) {
    // Show login modal
    const loginModal = document.getElementById('loginModal');
    loginModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    return false;
  }
  return true;
}

// Initialize auth functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check session on page load
  checkSession();

  // Login trigger
  const loginTrigger = document.getElementById('loginTrigger');
  if (loginTrigger) {
    loginTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      const loginModal = document.getElementById('loginModal');
      loginModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal
  const closeModal = document.querySelector('.close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      const loginModal = document.getElementById('loginModal');
      loginModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  // Close modal on overlay click
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Auth form submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleAuthSubmit);
  }

  // Toggle between login and signup
  const authToggleLink = document.getElementById('authToggleLink');
  if (authToggleLink) {
    authToggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      toggleAuthMode();
    });
  }

  // Logout button in navbar
  const navLogoutBtn = document.getElementById('navLogoutBtn');
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
});
