
// DuneAir Backend API Integration using jQuery


const API_URL = 'http://localhost:3003/api';


let flights = []; 
let totalPassengers = 1;
let selectedSeats = {};
let selectedPrice = 0;

// Airport codes with city names
const AIRPORTS = {
  'DXB': 'Dubai',
  'SHJ': 'Sharjah',
  'AUH': 'Abu Dhabi',
  'LHR': 'London',
  'JFK': 'New York',
  'SIN': 'Singapore',
  'CAI': 'Cairo',
  'CDG': 'Paris',
  'DOH': 'Doha',
  'IST': 'Istanbul',
  'DEL': 'Delhi',
  'KWI': 'Kuwait',
  'NRT': 'Tokyo',
  'FRA': 'Frankfurt',
  'CPT': 'Cape Town',
  'MLE': 'Maldives'
};

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

// Search History Management (Offline Storage)
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

// Load flights from backend
function loadFlights() {
  return $.ajax({
    url: `${API_URL}/flights`,
    method: 'GET',
    dataType: 'json'
  });
}

// Search flights from backend (flexible)
function searchFlights(from, to, depart, flexible) {
  return $.ajax({
    url: `${API_URL}/flights/search`,
    method: 'GET',
    data: { from, to, depart, flexible },
    dataType: 'json'
  });
}

// Get single flight
function getFlight(flightId) {
  return $.ajax({
    url: `${API_URL}/flights/${flightId}`,
    method: 'GET',
    dataType: 'json'
  });
}

// Create booking
function createBooking(bookingData) {
  return $.ajax({
    url: `${API_URL}/bookings`,
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(bookingData),
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    }
  });
}

// Populating the airport dropdowns and initializing
$(document).ready(function() {
  const fromSelect = $('#fromInput');
  const toSelect = $('#toInput');

  if (fromSelect.length && toSelect.length) {
    // Populate airport options
    Object.keys(AIRPORTS).forEach(code => {
      const cityName = AIRPORTS[code];
      const option = `<option value="${code}">${cityName} - ${code}</option>`;
      fromSelect.append(option);
      toSelect.append(option);
    });

    // Using Select2 for searchable dropdowns
    fromSelect.select2({
      placeholder: 'Select Departure City',
      allowClear: true,
      width: '100%'
    });

    toSelect.select2({
      placeholder: 'Select Destination City',
      allowClear: true,
      width: '100%'
    });

    // Load and display search history
    displaySearchHistory();
  }

  // Comfort toggle
  const comfortLink = $('#comfortLink');
  const comfortInfo = $('#comfort-info');

  if (comfortLink.length && comfortInfo.length) {
    comfortLink.on('click', function(e) {
      e.preventDefault();
      comfortInfo.toggle();

      if (comfortInfo.is(':visible')) {
        comfortInfo.get(0).scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});

// Display search history
function displaySearchHistory() {
  const history = SearchHistory.getHistory();
  const historyList = $('#historyList');

  if (!historyList.length) return;

  if (history.length === 0) {
    historyList.html('<p style="color: #999; font-size: 0.9em;">No recent searches</p>');
    return;
  }

  historyList.empty();

  history.forEach((item, index) => {
    const fromCity = AIRPORTS[item.from] || item.from;
    const toCity = AIRPORTS[item.to] || item.to;
    const date = new Date(item.depart).toLocaleDateString();

    const historyItem = $(`
      <button class="btn secondary" style="font-size: 0.9em; padding: 8px 12px;" data-index="${index}">
        ${fromCity} → ${toCity}<br>
        <small>${date}</small>
      </button>
    `);

    historyItem.on('click', function(e) {
      e.preventDefault();
      $('#fromInput').val(item.from).trigger('change');
      $('#toInput').val(item.to).trigger('change');
      $('#departInput').val(item.depart);
    });

    historyList.append(historyItem);
  });
}


$(document).ready(function() {
  const searchForm = $('#searchForm');

  if (searchForm.length) {
    // Helper function to perform search
    function performSearch(from, to, depart) {
      const passengerCount = parseInt($('#passengerCount').val());
      const flexibleDates = $('#flexibleDates').is(':checked');

      // Get filter values
      const sortBy = $('#sortBy').val();
      const timeFilter = $('#timeFilter').val();
      const classFilter = $('#classFilter').val();

      // Save to search history only if specific search
      if (from && to && depart) {
        SearchHistory.addSearch(from, to, depart);
      }

      // Clear old booking data
      localStorage.removeItem('currentPassengerIndex');
      localStorage.removeItem('passengers');
      localStorage.removeItem('selectedSeats');
      localStorage.removeItem('totalPrice');

      // Save search with filters to localStorage for offline use
      localStorage.setItem('search', JSON.stringify({
        from,
        to,
        depart,
        passengerCount,
        sortBy,
        timeFilter,
        classFilter,
        flexibleDates
      }));

      window.location.href = 'results.html';
    }

    // Search flights button handler
    searchForm.on('submit', function(e) {
      e.preventDefault();

      const from = $('#fromInput').val() || '';
      const to = $('#toInput').val() || '';
      const depart = $('#departInput').val() || '';

      performSearch(from, to, depart);
    });

    // View All Flights button handler
    $('#viewAllFlightsBtn').on('click', function(e) {
      e.preventDefault();
      // Perform search with empty parameters to show all flights
      performSearch('', '', '');
    });
  }
});


$(document).ready(function() {
  const resultsGrid = $('#resultsGrid');

  if (resultsGrid.length) {
    const search = JSON.parse(localStorage.getItem('search') || '{}');
    const classLabels = { F: 'First Class', B: 'Business Class', E: 'Economy Class' };

    // Build search title
    let searchTitle = 'All Available Flights';
    if (search.from && search.to) {
      const fromCity = AIRPORTS[search.from] || search.from;
      const toCity = AIRPORTS[search.to] || search.to;
      searchTitle = `Flights: ${fromCity} → ${toCity}`;
    } else if (search.from) {
      searchTitle = `Flights from ${AIRPORTS[search.from] || search.from}`;
    } else if (search.to) {
      searchTitle = `Flights to ${AIRPORTS[search.to] || search.to}`;
    }

    if (search.depart) {
      const dateStr = new Date(search.depart).toLocaleDateString();
      searchTitle += ` on ${dateStr}`;
      if (search.flexibleDates) {
        searchTitle += ' (±3 days)';
      }
    }

    // Show search title and loading
    resultsGrid.html(`
      <h3 style="text-align: center; margin-bottom: 20px; color: #333;">${searchTitle}</h3>
      <p style="text-align: center; padding: 30px;">Searching flights...</p>
    `);

    // Search flights from backend
    searchFlights(search.from, search.to, search.depart, search.flexibleDates)
      .done(function(matched) {
        resultsGrid.html(`<h3 style="text-align: center; margin-bottom: 20px; color: #333;">${searchTitle}</h3>`);

        if (matched.length === 0) {
          resultsGrid.append(`
            <div style="text-align: center; padding: 40px;">
              <p style="font-size: 1.2em; margin-bottom: 15px;">No flights found</p>
              <p style="color: #666; margin-bottom: 20px;">Try these suggestions:</p>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;">• Choose different dates or enable flexible dates</li>
                <li style="margin: 10px 0;">• Try "Any Departure City" or "Any Destination"</li>
                <li style="margin: 10px 0;">• Remove some filters</li>
              </ul>
            </div>
          `);
          return;
        }

        // Apply filters
        let filteredFlights = applyFilters(matched, search);

        // Active filters summary
        const activeFilters = [];
        if (search.classFilter) {
          const label = classLabels[search.classFilter] || 'Selected Class';
          activeFilters.push(`Class: ${label}`);
        }
        if (search.timeFilter) {
          const timeLabels = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' };
          activeFilters.push(`Departure: ${timeLabels[search.timeFilter] || search.timeFilter}`);
        }
        if (search.sortBy) {
          const sortLabels = {
            price_asc: 'Sort: Price Low→High',
            price_desc: 'Sort: Price High→Low'
          };
          activeFilters.push(sortLabels[search.sortBy] || `Sort: ${search.sortBy}`);
        }

        if (activeFilters.length > 0) {
          const note = search.classFilter === 'F'
            ? ' • Only flights with First Class available are shown.'
            : '';
          resultsGrid.append(`
            <p style="text-align: center; color: #2d3a63; margin-bottom: 12px;">
              Filters: ${activeFilters.join(' | ')}${note}
            </p>
          `);
        }

        if (filteredFlights.length === 0) {
          resultsGrid.append(`
            <p style="text-align: center; padding: 30px;">
              Found ${matched.length} flight(s) but none match your filters.<br>
              <button class="btn secondary" onclick="window.location.reload()" style="margin-top: 15px;">Clear Filters</button>
            </p>
          `);
          return;
        }

        // Show count
        resultsGrid.append(`<p style="text-align: center; color: #666; margin-bottom: 20px;">Showing ${filteredFlights.length} flight(s)</p>`);

        // Create results container
        const resultsContainer = $('<div class="results-grid"></div>');

        // Display filtered flights
        filteredFlights.forEach(function(f) {
          // Calculate displayed price based on class filter (default: lowest available)
          let displayPrice = getLowestPrice(f);
          if (search.classFilter === 'F' && f.first_class_price) displayPrice = f.first_class_price;
          if (search.classFilter === 'B' && f.business_class_price) displayPrice = f.business_class_price;
          if (search.classFilter === 'E' && f.economy_class_price) displayPrice = f.economy_class_price;

          const card = $('<div class="flight-card"></div>');
          card.html(`
            <div>
              <strong>${f.flight_id}</strong>: ${f.origin} → ${f.destination}<br>
              <small>Departs: ${formatFlightTime(f.departure_time)}</small>
            </div>
            <div>
              Starting from: <strong>AED ${displayPrice.toLocaleString()}</strong>
              <button class="btn primary selectFlight" data-id="${f.flight_id}">Select</button>
            </div>
          `);

          resultsContainer.append(card);
        });

        resultsGrid.append(resultsContainer);

        // Attach click handlers using jQuery
        $('.selectFlight').on('click', function() {
          // Check if user is logged in before proceeding
          if (typeof requireLogin === 'function' && !requireLogin()) {
            return;
          }

          const flightId = $(this).data('id');
          const flight = filteredFlights.find(f => f.flight_id === flightId);

          // Convert backend format to frontend format
          const flightData = {
            id: flight.flight_id,
            from: flight.origin,
            to: flight.destination,
            depart: flight.departure_time,
            classes: {
              F: flight.first_class_price || 0,
              B: flight.business_class_price || 0,
              E: flight.economy_class_price || 0
            }
          };

          localStorage.setItem('selectedFlight', JSON.stringify(flightData));
          localStorage.setItem('currentPassengerIndex', 1);
          window.location.href = 'passenger.html';
        });
      })
      .fail(function(error) {
        console.error('Error fetching flights:', error);
        resultsGrid.html('<p style="text-align: center; padding: 30px; color: red;">Error loading flights. Please try again.</p>');
      });
  }
});

// Apply filters to flight results
function applyFilters(flights, search) {
  let filtered = [...flights];

  // Time filter
  if (search.timeFilter) {
    filtered = filtered.filter(f => {
      const hour = new Date(f.departure_time).getHours();
      switch (search.timeFilter) {
        case 'morning': return hour >= 6 && hour < 12;
        case 'afternoon': return hour >= 12 && hour < 18;
        case 'evening': return hour >= 18 && hour < 24;
        case 'night': return hour >= 0 && hour < 6;
        default: return true;
      }
    });
  }

  // Class filter
  if (search.classFilter) {
    filtered = filtered.filter(f => {
      if (search.classFilter === 'F') return f.first_class_price > 0;
      if (search.classFilter === 'B') return f.business_class_price > 0;
      if (search.classFilter === 'E') return f.economy_class_price > 0;
      return true;
    });
  }

  // Sort
  if (search.sortBy) {
    filtered.sort((a, b) => {
      switch (search.sortBy) {
        case 'price_asc':
          return getPriceForSearch(a, search) - getPriceForSearch(b, search);
        case 'price_desc':
          return getPriceForSearch(b, search) - getPriceForSearch(a, search);
        default:
          return 0;
      }
    });
  }

  return filtered;
}

// Helper function to get lowest price from flight
function getLowestPrice(flight) {
  const prices = [];
  if (flight.first_class_price) prices.push(flight.first_class_price);
  if (flight.business_class_price) prices.push(flight.business_class_price);
  if (flight.economy_class_price) prices.push(flight.economy_class_price);
  return Math.min(...prices);
}

// Helper to get price relevant to search (falls back to lowest)
function getPriceForSearch(flight, search) {
  if (search.classFilter === 'F' && flight.first_class_price) return flight.first_class_price;
  if (search.classFilter === 'B' && flight.business_class_price) return flight.business_class_price;
  if (search.classFilter === 'E' && flight.economy_class_price) return flight.economy_class_price;
  return getLowestPrice(flight);
}

// Managing passenger details
$(document).ready(function() {
  const passengerForm = $('#passengerForm');

  if (passengerForm.length) {
    const search = JSON.parse(localStorage.getItem('search') || '{}');
    totalPassengers = search.passengerCount || 1;
    let currentPassengerIndex = parseInt(localStorage.getItem('currentPassengerIndex') || 1);
    const savedPassengers = JSON.parse(localStorage.getItem('passengers') || '{}');

    // Update title
    const title = $('#passengerInfo');
    if (title.length) {
      title.text(`Passenger ${currentPassengerIndex} of ${totalPassengers} Details`);
    }

    const nextBtn = $('#nextPassengerBtn');
    if (nextBtn.length) {
      nextBtn.text((currentPassengerIndex < totalPassengers) ? 'Continue to Next Passenger' : 'Continue to Seat Selection');
    }

    // Load existing data
    const currentPassData = savedPassengers[currentPassengerIndex] || {};
    $('#passName').val(currentPassData.name || '');
    $('#passEmail').val(currentPassData.email || '');
    $('#passID').val(currentPassData.id || '');
    $('#passPhone').val(currentPassData.phone || '');

    passengerForm.on('submit', function(e) {
      e.preventDefault();

      const passenger = {
        name: $('#passName').val().trim(),
        email: $('#passEmail').val().trim(),
        id: $('#passID').val().trim(),
        phone: $('#passPhone').val().trim()
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
        alert('Please fill in all required passenger details.');
      }
    });
  }
});


// Managing payment and saving to database
$(document).ready(function() {
  const paymentForm = $('#paymentForm');
  console.log('Payment page loaded, form found:', paymentForm.length);

  if (paymentForm.length) {
    const passengers = JSON.parse(localStorage.getItem('passengers') || '{}');
    const flight = JSON.parse(localStorage.getItem('selectedFlight') || '{}');
    const selectedSeats = JSON.parse(localStorage.getItem('selectedSeats') || '{}');
    const totalPrice = parseInt(localStorage.getItem('totalPrice') || 0);

    console.log('Payment data:', { flight, passengers, selectedSeats, totalPrice });

    if (!flight.id || !Object.keys(passengers).length || !totalPrice) {
      console.warn('Missing payment data, redirecting to home');
      window.location.href = 'index.html';
      return;
    }

    // Populate summary using jQuery
    $('#sumFlight').text(flight.id ? `${flight.from} → ${flight.to} (${flight.id})` : 'N/A');
    $('#sumPassengers').text(`${Object.keys(passengers).length} passengers`);

    const seatDetails = Object.values(selectedSeats).map(s => `${s.seatId} (${s.seatClass})`).join(', ');
    $('#sumSeats').text(seatDetails || 'N/A');
    $('#sumTotal').text(`AED ${totalPrice.toLocaleString()}`);
    $('#loyaltyPreviewPoints').text(totalPrice.toLocaleString());

    console.log('Payment form handler attached');

    // Payment submission - Save to database
    paymentForm.on('submit', function(e) {
      e.preventDefault();
      console.log('Payment form submitted!');

      const cardName = $('#cardName').val();

      // Prepare booking data for API
      const bookingData = {
        flight_id: flight.id,
        total_price: totalPrice,
        passengers: Object.keys(passengers).map(key => {
          const p = passengers[key];
          const seat = selectedSeats[key];
          return {
            name: p.name,
            email: p.email,
            passport_id: p.id,
            phone: p.phone,
            seat_number: seat.seatId,
            seat_class: seat.seatClass
          };
        })
      };

      console.log('Creating booking with data:', bookingData);

      // Disable submit button
      $(this).find('button[type="submit"]').prop('disabled', true).text('Processing...');

      // Save booking to database
      createBooking(bookingData)
        .done(function(response) {
          console.log('Booking created successfully:', response);

          // Show success modal
          const successModal = $('#successModal');
          const seatsList = Object.values(selectedSeats).map(s => s.seatId).join(', ');

          $('#confirmBookingId').text(response.booking_id);
          $('#confirmFlight').text(`${flight.from} → ${flight.to} (${flight.id})`);
          $('#confirmPassengers').text(`${Object.keys(passengers).length} passenger${Object.keys(passengers).length > 1 ? 's' : ''}`);
          $('#confirmSeats').text(seatsList);
          $('#confirmTotal').text(`AED ${totalPrice.toLocaleString()}`);
          $('#confirmPoints').text(`${(response.points_earned || totalPrice).toLocaleString()} Dune Miles`);

          successModal.addClass('show');
          $('body').css('overflow', 'hidden');

          // Clear localStorage after a short delay
          setTimeout(() => {
            localStorage.clear();
          }, 500);
        })
        .fail(function(error) {
          console.error('Booking failed:', error);
          alert('Sorry, there was an error processing your booking. Please try again.');
          paymentForm.find('button[type="submit"]').prop('disabled', false).text('Pay Now');
        });
    });
  } else {
    console.log('Payment form not found on this page');
  }
});
