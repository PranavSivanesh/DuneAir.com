// Airport codes with city names (for dropdowns)
const AIRPORTS = {
  // UAE Hubs
  'DXB': 'Dubai', 'SHJ': 'Sharjah', 'AUH': 'Abu Dhabi',
  
  // Middle East
  'DOH': 'Doha', 'JED': 'Jeddah', 'RUH': 'Riyadh', 'BAH': 'Bahrain', 
  'MCT': 'Muscat', 'KWI': 'Kuwait', 'BEY': 'Beirut', 'AMM': 'Amman',
  
  // Europe
  'LHR': 'London', 'CDG': 'Paris', 'FRA': 'Frankfurt', 'IST': 'Istanbul',
  'AMS': 'Amsterdam', 'LGW': 'London Gatwick',
  
  // Americas
  'JFK': 'New York', 'YYZ': 'Toronto', 'ORD': 'Chicago', 'LAX': 'Los Angeles',
  
  // Asia & Oceania
  'SIN': 'Singapore', 'BKK': 'Bangkok', 'KUL': 'Kuala Lumpur', 
  'SYD': 'Sydney', 'MEL': 'Melbourne', 'NRT': 'Tokyo',
  
  // Indian Subcontinent
  'DEL': 'Delhi', 'BOM': 'Mumbai', 'MAA': 'Chennai', 'CCU': 'Kolkata',
  
  // Africa
  'JNB': 'Johannesburg', 'CPT': 'Cape Town', 'ADD': 'Addis Ababa', 'CAI': 'Cairo'
};

// Search History Management
const SearchHistory = {
  getHistory: function() {
    const history = localStorage.getItem('duneAirSearchHistory');
    return history ? JSON.parse(history) : [];
  },

  addSearch: function(from, to, depart) {
    let history = this.getHistory();
    const searchItem = {
      from,
      to,
      depart,
      timestamp: new Date().toISOString()
    };

    // Remove duplicates and keep only last 5 searches
    history = history.filter(item => 
      !(item.from === from && item.to === to && item.depart === depart)
    );
    
    history.unshift(searchItem);
    history = history.slice(0, 5);

    localStorage.setItem('duneAirSearchHistory', JSON.stringify(history));
    return history;
  },

  clearHistory: function() {
    localStorage.removeItem('duneAirSearchHistory');
  }
};

// Display search history function
function displaySearchHistory() {
  const history = SearchHistory.getHistory();
  const historyList = document.getElementById('historyList');

  if (!historyList) return;

  if (history.length === 0) {
    historyList.innerHTML = '<p style="color: #999; font-size: 0.9em;">No recent searches</p>';
    return;
  }

  historyList.innerHTML = '';

  history.forEach((item, index) => {
    const fromCity = AIRPORTS[item.from] || item.from;
    const toCity = AIRPORTS[item.to] || item.to;
    const date = new Date(item.depart).toLocaleDateString();

    const historyItem = document.createElement('button');
    historyItem.className = 'btn secondary';
    historyItem.style.fontSize = '0.9em';
    historyItem.style.padding = '8px 12px';
    historyItem.innerHTML = `
      ${fromCity} → ${toCity}<br>
      <small>${date}</small>
    `;

    historyItem.addEventListener('click', function(e) {
      e.preventDefault();
      document.getElementById('fromInput').value = item.from;
      document.getElementById('toInput').value = item.to;
      document.getElementById('departInput').value = item.depart;
      
      // Trigger Select2 update if it exists
      if (window.jQuery && jQuery.fn.select2) {
        jQuery('#fromInput').trigger('change');
        jQuery('#toInput').trigger('change');
      }
    });

    historyList.appendChild(historyItem);
  });
}

// --- GLOBAL STATE for Multi-Passenger Booking ---
let totalPassengers = 1;
let selectedSeats = {}; // Stores {1: {seatId: '1A', price: 5000, ...}, 2: {...}}
let selectedPrice = 0;

// Helper to format date/time
const formatFlightTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', ' @');
}

// Show toast notification instead of alert
const showToast = (message, type = 'info') => {
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    error: '⚠️',
    warning: '⚠️',
    success: '✓',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 3000);
}

// ----- LOGIN MODAL FUNCTIONALITY -----
document.addEventListener('DOMContentLoaded', function() {
  // Login Modal Elements
  const loginTrigger = document.getElementById('loginTrigger');
  const loginModal = document.getElementById('loginModal');
  const closeModal = document.querySelector('.close-modal');
  const loginForm = document.getElementById('loginForm');

  // Open modal
  if (loginTrigger && loginModal) {
    loginTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      loginModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  }

  // Close modal
  if (closeModal && loginModal) {
    closeModal.addEventListener('click', function() {
      loginModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    });
  }

  // Close modal when clicking outside
  if (loginModal) {
    loginModal.addEventListener('click', function(e) {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = this.querySelector('input[type="email"]').value;
      const password = this.querySelector('input[type="password"]').value;
      
      if (email && password) {
        const submitBtn = this.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing In...';
        
        setTimeout(() => {
          alert('Login successful! Welcome to Dune Air.');
          loginModal.style.display = 'none';
          document.body.style.overflow = 'auto';
          if (loginTrigger) {
            loginTrigger.textContent = 'My Account';
            loginTrigger.style.fontWeight = '700';
          }
          submitBtn.disabled = false;
          submitBtn.textContent = 'Sign In';
        }, 1500);
      }
    });
  }

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && loginModal && loginModal.style.display === 'flex') {
      loginModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Populate airport dropdowns if they exist
  const fromSelect = document.getElementById('fromInput');
  const toSelect = document.getElementById('toInput');

  if (fromSelect && toSelect) {
    // Populate airport options
    Object.keys(AIRPORTS).forEach(code => {
      const cityName = AIRPORTS[code];
      const option = `<option value="${code}">${cityName} - ${code}</option>`;
      fromSelect.innerHTML += option;
      toSelect.innerHTML += option;
    });

    // Initialize Select2 if available
    if (window.jQuery && jQuery.fn.select2) {
      jQuery(fromSelect).select2({
        placeholder: 'Select Departure City',
        allowClear: true,
        width: '100%'
      });

      jQuery(toSelect).select2({
        placeholder: 'Select Destination City',
        allowClear: true,
        width: '100%'
      });
    }
  }

  // Display search history
  displaySearchHistory();
});

// ----- INDEX.HTML - COMFORT TOGGLE -----
const comfortLink = document.getElementById('comfortLink');
const comfortInfo = document.getElementById('comfort-info');

if (comfortLink && comfortInfo) {
    comfortLink.addEventListener('click', (e) => {
        e.preventDefault();
        comfortInfo.style.display = comfortInfo.style.display === 'none' ? 'block' : 'none';
        
        if (comfortInfo.style.display === 'block') {
            comfortInfo.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

// ----- INDEX.HTML - SEARCH -----
const searchForm = document.getElementById('searchForm');
if (searchForm) {
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const from = document.getElementById('fromInput').value.toUpperCase().trim();
    const to = document.getElementById('toInput').value.toUpperCase().trim();
    const depart = document.getElementById('departInput').value;
    const passengerCount = parseInt(document.getElementById('passengerCount').value);
    
    // Allow searching with any combination (no validation required)
    
    // Save to search history if specific search
    if (from && to && depart) {
      SearchHistory.addSearch(from, to, depart);
    }
    
    // Clear old multi-step data when starting a new search
    localStorage.removeItem('currentPassengerIndex');
    localStorage.removeItem('passengers');
    localStorage.removeItem('selectedSeats');
    localStorage.removeItem('totalPrice');

    localStorage.setItem('search', JSON.stringify({ from, to, depart, passengerCount }));
    window.location.href = 'results.html';
  });
}

// ----- PASSENGER (passenger.html) - MULTI-STEP LOGIC -----
const passengerForm = document.getElementById('passengerForm');
if (passengerForm) {
    const search = JSON.parse(localStorage.getItem('search') || '{}');
    totalPassengers = search.passengerCount || 1; 
    let currentPassengerIndex = parseInt(localStorage.getItem('currentPassengerIndex') || 1);

    const savedPassengers = JSON.parse(localStorage.getItem('passengers') || '{}');

    // Display which passenger is being entered
    const title = document.getElementById('passengerInfo');
    if (title) {
        title.textContent = `Passenger ${currentPassengerIndex} of ${totalPassengers} Details`;
    }
    const nextBtn = document.getElementById('nextPassengerBtn');
    if (nextBtn) {
        nextBtn.textContent = (currentPassengerIndex < totalPassengers) ? 'Continue to Next Passenger' : 'Continue to Seat Selection';
    }

    // Load existing data if available
    const currentPassData = savedPassengers[currentPassengerIndex] || {};
    if (document.getElementById('passName')) document.getElementById('passName').value = currentPassData.name || '';
    if (document.getElementById('passEmail')) document.getElementById('passEmail').value = currentPassData.email || '';
    if (document.getElementById('passID')) document.getElementById('passID').value = currentPassData.id || '';
    if (document.getElementById('passPhone')) document.getElementById('passPhone').value = currentPassData.phone || '';

    passengerForm.addEventListener('submit', e => {
        e.preventDefault();
        
        const passenger = {
            name: document.getElementById('passName').value.trim(),
            email: document.getElementById('passEmail').value.trim(),
            id: document.getElementById('passID').value.trim(),
            phone: document.getElementById('passPhone').value.trim()
        };

        if (passenger.name && passenger.email && passenger.id && passenger.phone) {
            savedPassengers[currentPassengerIndex] = passenger;
            localStorage.setItem('passengers', JSON.stringify(savedPassengers));

            if (currentPassengerIndex < totalPassengers) {
                currentPassengerIndex++;
                localStorage.setItem('currentPassengerIndex', currentPassengerIndex);
                window.location.reload(); 
            } else {
                localStorage.removeItem('currentPassengerIndex'); 
                window.location.href = 'seat.html';
            }
        } else {
            alert('Please fill in all required passenger details (Name, Email, Passport/EID, and Contact).');
        }
    });
}

// ----- SEAT (seat.html) - MULTI-SEAT SELECTION LOGIC -----
const seatMap = document.getElementById('seatMap');
const proceedPaymentBtn = document.getElementById('proceedPaymentBtn');
const seatPriceSummary = document.getElementById('seatPriceSummary');

if (seatMap) {
    const flight = JSON.parse(localStorage.getItem('selectedFlight'));
    const search = JSON.parse(localStorage.getItem('search') || '{}');
    totalPassengers = search.passengerCount || 1;
    
    // Load previously selected seats
    selectedSeats = JSON.parse(localStorage.getItem('selectedSeats') || '{}');

    if (!flight) window.location.href = 'index.html';

    // Cabin configuration 
    const cabinConfigs = {
        F: { rows: 2, cols: ['A', 'K'], label: 'First Class', cssClass: 'first-class', price: flight.classes.F || 0 },
        B: { rows: 4, cols: ['C', 'D', 'G', 'H'], label: 'Business Class', cssClass: 'business-class', price: flight.classes.B || 0 },
        E: { rows: 10, cols: ['A', 'B', 'C', 'D', 'E', 'F'], label: 'Economy Class', cssClass: 'economy-class', price: flight.classes.E || 0 }
    };
    
    // Seat map rendering
    const occupiedSeats = ['1A', '3D', '3G', '6A', '12C', '15F'];
    let currentRow = 1;
    seatMap.innerHTML = '';

    Object.keys(flight.classes).forEach(classKey => {
        const config = cabinConfigs[classKey];
        if (!config || config.price === 0) return;

        // Create cabin section container
        const cabinSection = document.createElement('div');
        cabinSection.className = 'cabin-section';

        // Add Cabin Class Header
        const classHeader = document.createElement('div');
        classHeader.className = 'cabin-header ' + config.cssClass;
        classHeader.textContent = `${config.label} (AED ${config.price.toLocaleString()})`;
        cabinSection.appendChild(classHeader);

        // Create rows container
        const cabinRows = document.createElement('div');
        cabinRows.className = 'cabin-rows';

        for (let r = 0; r < config.rows; r++) {
            const rowNumber = currentRow + r;

            // Create row container
            const seatRow = document.createElement('div');
            seatRow.className = 'seat-row';

            const midPoint = Math.ceil(config.cols.length / 2);

            config.cols.forEach((c, index) => {
                const seatId = rowNumber + c;
                const isOccupied = occupiedSeats.includes(seatId);

                // Check if seat is selected by ANY passenger
                const selectedBy = Object.keys(selectedSeats).find(p => selectedSeats[p].seatId === seatId);

                const seatWrap = document.createElement('label');
                seatWrap.className = 'seat ' + config.cssClass;
                seatWrap.setAttribute('data-seat-id', seatId);

                const seatInput = document.createElement('input');
                seatInput.type = 'checkbox';
                seatInput.name = 'seatSelect';
                seatInput.value = seatId;
                seatInput.checked = !!selectedBy;
                seatInput.setAttribute('data-price', config.price);
                seatInput.setAttribute('data-class', classKey);
                seatInput.disabled = isOccupied;

                const seatLabel = document.createElement('span');
                seatLabel.className = `seat-label ${isOccupied ? 'occupied' : 'available'}`;
                seatLabel.textContent = c;

                // Highlight seat if selected by any passenger
                if (selectedBy) {
                    seatLabel.classList.add('selected');
                    seatLabel.textContent = selectedBy; // Show passenger number
                }

                seatWrap.appendChild(seatInput);
                seatWrap.appendChild(seatLabel);
                seatRow.appendChild(seatWrap);

                // Add aisle gap in the middle for wider cabins
                if (config.cols.length > 4 && index === midPoint - 1) {
                    const aisleDiv = document.createElement('div');
                    aisleDiv.style.width = '20px';
                    seatRow.appendChild(aisleDiv);
                }
            });

            cabinRows.appendChild(seatRow);
        }

        cabinSection.appendChild(cabinRows);
        seatMap.appendChild(cabinSection);
        currentRow += config.rows;
    });

    // Handle seat selection logic
    seatMap.addEventListener('change', (e) => {
        if (e.target.name === 'seatSelect') {
            const seatId = e.target.value;
            const seatPrice = parseInt(e.target.getAttribute('data-price'));
            const seatClass = e.target.getAttribute('data-class');
            const seatLabel = e.target.nextElementSibling;
            
            let currentSelections = Object.values(selectedSeats).map(s => s.seatId);

            if (e.target.checked) {
                if (currentSelections.length >= totalPassengers) {
                    showToast(`You can only select ${totalPassengers} seat${totalPassengers > 1 ? 's' : ''}`, 'warning');
                    e.target.checked = false;
                    return;
                }
                
                // Find the first empty passenger slot (1, 2, 3...)
                let nextPassId = 1;
                while (selectedSeats[nextPassId]) {
                    nextPassId++;
                }

                selectedSeats[nextPassId] = { seatId, seatPrice, seatClass, passengerId: nextPassId };
                seatLabel.classList.add('selected');
                seatLabel.textContent = nextPassId;

            } else {
                // Find which passenger occupied this seat and remove
                const passIdToRemove = Object.keys(selectedSeats).find(p => selectedSeats[p].seatId === seatId);
                if (passIdToRemove) {
                    delete selectedSeats[passIdToRemove];
                }
                seatLabel.classList.remove('selected');
                seatLabel.textContent = seatId.charAt(seatId.length - 1); // Revert to row letter

                // Re-label all remaining seats to ensure numbering is sequential (1, 2, ...)
                const sortedSeats = Object.values(selectedSeats).sort((a, b) => a.passengerId - b.passengerId);
                let newPassId = 1;
                let newSelectedSeats = {};
                
                // Clear all current visual labels
                document.querySelectorAll('.seat-label.selected').forEach(label => {
                    label.classList.remove('selected');
                    label.textContent = label.parentElement.getAttribute('data-seat-id').charAt(label.parentElement.getAttribute('data-seat-id').length - 1);
                });

                // Apply new sequential labels
                sortedSeats.forEach(seat => {
                    newSelectedSeats[newPassId] = { ...seat, passengerId: newPassId };
                    
                    const newLabel = document.querySelector(`[data-seat-id="${seat.seatId}"] .seat-label`);
                    if (newLabel) {
                        newLabel.classList.add('selected');
                        newLabel.textContent = newPassId;
                    }
                    newPassId++;
                });
                selectedSeats = newSelectedSeats;
            }

            // Update localStorage and summary
            localStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
            updateSeatSummary();
        }
    });

    const updateSeatSummary = () => {
        const totalSelected = Object.keys(selectedSeats).length;
        const totalPrice = Object.values(selectedSeats).reduce((sum, seat) => sum + seat.seatPrice, 0);
        selectedPrice = totalPrice;

        seatPriceSummary.textContent = `Selected Seats: ${totalSelected} / ${totalPassengers} | Total Cost: AED ${totalPrice.toLocaleString()}`;
        
        if (totalSelected === totalPassengers) {
            proceedPaymentBtn.textContent = `Proceed to Payment (AED ${totalPrice.toLocaleString()})`;
            proceedPaymentBtn.disabled = false;
        } else {
            proceedPaymentBtn.textContent = `Select ${totalPassengers - totalSelected} more seat(s)`;
            proceedPaymentBtn.disabled = true;
        }
    }
    
    // Initial summary load
    updateSeatSummary();

    proceedPaymentBtn.addEventListener('click', () => {
        if (Object.keys(selectedSeats).length === totalPassengers) {
            localStorage.setItem('totalPrice', selectedPrice);
            window.location.href = 'payment.html';
        } else {
            showToast(`Please select all ${totalPassengers} seats before proceeding`, 'warning');
        }
    });
}

// ----- PAYMENT (payment.html) -----
// Payment form handler moved to script-api.js to handle booking creation via API