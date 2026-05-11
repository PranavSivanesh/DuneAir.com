// Admin flights page helpers

const API_URL = 'http://localhost:3003/api';

// Check admin mode
if (sessionStorage.getItem('adminMode') !== 'true') {
  alert('Access denied. Please log in as admin.');
  window.location.href = 'index.html';
}

// Load flights on page load
document.addEventListener('DOMContentLoaded', () => {
  loadAllFlights();

  // Create flight button
  const createFlightBtn = document.getElementById('createFlightBtn');
  if (createFlightBtn) {
    createFlightBtn.addEventListener('click', () => {
      openFlightModal('create');
    });
  }

  // Close modal
  const closeModal = document.querySelector('.close-flight-modal');
  if (closeModal) {
    closeModal.addEventListener('click', closeFlightModal);
  }

  // Close modal when clicking overlay
  const flightModal = document.getElementById('flightModal');
  if (flightModal) {
    flightModal.addEventListener('click', (e) => {
      if (e.target === flightModal) {
        closeFlightModal();
      }
    });
  }

  // Flight form submission
  const flightForm = document.getElementById('flightForm');
  if (flightForm) {
    flightForm.addEventListener('submit', handleFlightSubmit);
  }
});

// Load all flights from the database
function loadAllFlights() {
  $.ajax({
    url: `${API_URL}/flights`,
    method: 'GET',
    dataType: 'json'
  })
  .done(function(flights) {
    displayFlights(flights);
  })
  .fail(function(error) {
    console.error('Error loading flights:', error);
    document.getElementById('flightsTable').innerHTML = '<p style="text-align: center; color: #d32f2f;">Failed to load flights.</p>';
  });
}

// Display flights in a table
function displayFlights(flights) {
  const flightsTable = document.getElementById('flightsTable');

  if (!flights || flights.length === 0) {
    flightsTable.innerHTML = '<p style="text-align: center; color: #999;">No flights found.</p>';
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: var(--color-secondary); border-bottom: 2px solid var(--color-primary);">
          <th style="padding: 12px; text-align: left;">Flight ID</th>
          <th style="padding: 12px; text-align: left;">Route</th>
          <th style="padding: 12px; text-align: left;">Departure</th>
          <th style="padding: 12px; text-align: left;">First (AED)</th>
          <th style="padding: 12px; text-align: left;">Business (AED)</th>
          <th style="padding: 12px; text-align: left;">Economy (AED)</th>
          <th style="padding: 12px; text-align: center;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  flights.forEach(flight => {
    const depTime = new Date(flight.departure_time);
    const formattedTime = depTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    html += `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; font-weight: 700;">${flight.flight_id}</td>
        <td style="padding: 12px;">${flight.origin} → ${flight.destination}</td>
        <td style="padding: 12px;">${formattedTime}</td>
        <td style="padding: 12px;">${flight.first_class_price || 'N/A'}</td>
        <td style="padding: 12px;">${flight.business_class_price || 'N/A'}</td>
        <td style="padding: 12px;">${flight.economy_class_price}</td>
        <td style="padding: 12px; text-align: center;">
          <button class="btn secondary" onclick="editFlight('${flight.flight_id}')" style="margin-right: 5px; padding: 5px 10px; font-size: 0.85em;">Edit</button>
          <button class="btn primary" onclick="deleteFlight('${flight.flight_id}')" style="padding: 5px 10px; font-size: 0.85em; background-color: #d32f2f;">Delete</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  flightsTable.innerHTML = html;
}

// Open the flight modal for create or edit
function openFlightModal(mode, flightData = null) {
  const modal = document.getElementById('flightModal');
  const title = document.getElementById('flightModalTitle');
  const submitBtn = document.getElementById('flightSubmitBtn');
  const modeInput = document.getElementById('flightFormMode');
  const originalFlightId = document.getElementById('originalFlightId');
  const flightError = document.getElementById('flightError');

  // Reset form
  document.getElementById('flightForm').reset();
  flightError.style.display = 'none';

  if (mode === 'create') {
    title.textContent = 'Create New Flight';
    submitBtn.textContent = 'Create Flight';
    modeInput.value = 'create';
    originalFlightId.value = '';
    document.getElementById('flightId').disabled = false;
  } else if (mode === 'edit' && flightData) {
    title.textContent = 'Edit Flight';
    submitBtn.textContent = 'Update Flight';
    modeInput.value = 'edit';
    originalFlightId.value = flightData.flight_id;

    // Populate form
    document.getElementById('flightId').value = flightData.flight_id;
    document.getElementById('flightId').disabled = true;
    document.getElementById('origin').value = flightData.origin;
    document.getElementById('destination').value = flightData.destination;

    // Format datetime for the input
    const depTime = new Date(flightData.departure_time);
    const year = depTime.getFullYear();
    const month = String(depTime.getMonth() + 1).padStart(2, '0');
    const day = String(depTime.getDate()).padStart(2, '0');
    const hours = String(depTime.getHours()).padStart(2, '0');
    const minutes = String(depTime.getMinutes()).padStart(2, '0');
    document.getElementById('departureTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;

    document.getElementById('firstClassPrice').value = flightData.first_class_price || '';
    document.getElementById('businessClassPrice').value = flightData.business_class_price || '';
    document.getElementById('economyClassPrice').value = flightData.economy_class_price;
  }

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Close flight modal
function closeFlightModal() {
  const modal = document.getElementById('flightModal');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Handle flight form submission
function handleFlightSubmit(e) {
  e.preventDefault();

  const mode = document.getElementById('flightFormMode').value;
  const flightData = {
    flight_id: document.getElementById('flightId').value.toUpperCase().trim(),
    origin: document.getElementById('origin').value.toUpperCase().trim(),
    destination: document.getElementById('destination').value.toUpperCase().trim(),
    departure_time: document.getElementById('departureTime').value,
    first_class_price: document.getElementById('firstClassPrice').value || null,
    business_class_price: document.getElementById('businessClassPrice').value || null,
    economy_class_price: document.getElementById('economyClassPrice').value
  };

  if (mode === 'create') {
    createFlight(flightData);
  } else if (mode === 'edit') {
    const originalId = document.getElementById('originalFlightId').value;
    updateFlight(originalId, flightData);
  }
}

// Create a new flight
function createFlight(flightData) {
  $.ajax({
    url: `${API_URL}/flights`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(flightData),
    dataType: 'json'
  })
  .done(function(response) {
    closeFlightModal();
    loadAllFlights();
    alert('Flight created successfully!');
  })
  .fail(function(error) {
    const flightError = document.getElementById('flightError');
    flightError.textContent = error.responseJSON?.error || 'Failed to create flight';
    flightError.style.display = 'block';
  });
}

// Update an existing flight
function updateFlight(originalId, flightData) {
  $.ajax({
    url: `${API_URL}/flights/${originalId}`,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(flightData),
    dataType: 'json'
  })
  .done(function(response) {
    closeFlightModal();
    loadAllFlights();
    alert('Flight updated successfully!');
  })
  .fail(function(error) {
    const flightError = document.getElementById('flightError');
    flightError.textContent = error.responseJSON?.error || 'Failed to update flight';
    flightError.style.display = 'block';
  });
}

// Edit a flight (load data then open modal)
function editFlight(flightId) {
  $.ajax({
    url: `${API_URL}/flights/${flightId}`,
    method: 'GET',
    dataType: 'json'
  })
  .done(function(flight) {
    openFlightModal('edit', flight);
  })
  .fail(function(error) {
    alert('Failed to load flight data');
  });
}

// Delete a flight
function deleteFlight(flightId) {
  if (!confirm(`Are you sure you want to delete flight ${flightId}? This action cannot be undone.`)) {
    return;
  }

  $.ajax({
    url: `${API_URL}/flights/${flightId}`,
    method: 'DELETE'
  })
  .done(function(response) {
    loadAllFlights();
    alert('Flight deleted successfully!');
  })
  .fail(function(error) {
    alert(error.responseJSON?.error || 'Failed to delete flight');
  });
}
