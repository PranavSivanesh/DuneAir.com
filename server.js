const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = 3003;

// Middleware setup
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
// Using express-session for session management
app.use(session({
  secret: 'duneair-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: null
  }
}));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'duneair123', 
  database: 'duneair'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Flight and booking endpoints

// Get all flights
app.get('/api/flights', (req, res) => {
  const sql = 'SELECT * FROM flights';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching flights:', err);
      res.status(500).json({ error: 'Failed to fetch flights' });
      return;
    }
    res.json(results);
  });
});

// Search flights with optional filters
app.get('/api/flights/search', (req, res) => {
  const { from, to, depart, flexible } = req.query;

  let sql = 'SELECT * FROM flights WHERE 1=1';
  const params = [];

  // Optional origin filter
  if (from && from.trim() !== '' && from !== '*') {
    sql += ' AND origin = ?';
    params.push(from.trim());
  }

  // Optional destination filter
  if (to && to.trim() !== '' && to !== '*') {
    sql += ' AND destination = ?';
    params.push(to.trim());
  }

  // Optional date filter (with ±3 days when flexible)
  if (depart && depart.trim() !== '') {
    if (flexible === 'true') {
      // Within three days of the chosen date
      sql += ' AND DATE(departure_time) BETWEEN DATE_SUB(?, INTERVAL 3 DAY) AND DATE_ADD(?, INTERVAL 3 DAY)';
      params.push(depart.trim(), depart.trim());
    } else {
      // Exact date or later
      sql += ' AND DATE(departure_time) >= DATE(?)';
      params.push(depart.trim());
    }
  }

  // Order by departure time
  sql += ' ORDER BY departure_time ASC';

  console.log('SQL Query:', sql);
  console.log('Params:', params);

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error searching flights:', err);
      res.status(500).json({ error: 'Failed to search flights' });
      return;
    }
    console.log('Results count:', results.length);
    res.json(results);
  });
});

// Get flight by ID
app.get('/api/flights/:id', (req, res) => {
  const sql = 'SELECT * FROM flights WHERE flight_id = ?';
  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching flight:', err);
      res.status(500).json({ error: 'Failed to fetch flight' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }
    res.json(results[0]);
  });
});

// Create new flight (admin)
app.post('/api/flights', (req, res) => {
  const { flight_id, origin, destination, departure_time, first_class_price, business_class_price, economy_class_price } = req.body;

  const sql = 'INSERT INTO flights (flight_id, origin, destination, departure_time, first_class_price, business_class_price, economy_class_price) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [flight_id, origin, destination, departure_time, first_class_price, business_class_price, economy_class_price], (err, result) => {
    if (err) {
      console.error('Error creating flight:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Flight ID already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create flight' });
      }
      return;
    }
    res.json({ message: 'Flight created successfully', flight_id });
  });
});

// Update flight (admin)
app.put('/api/flights/:id', (req, res) => {
  const originalId = req.params.id;
  const { flight_id, origin, destination, departure_time, first_class_price, business_class_price, economy_class_price } = req.body;

  const sql = 'UPDATE flights SET flight_id = ?, origin = ?, destination = ?, departure_time = ?, first_class_price = ?, business_class_price = ?, economy_class_price = ? WHERE flight_id = ?';
  db.query(sql, [flight_id, origin, destination, departure_time, first_class_price, business_class_price, economy_class_price, originalId], (err, result) => {
    if (err) {
      console.error('Error updating flight:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Flight ID already exists' });
      } else {
        res.status(500).json({ error: 'Failed to update flight' });
      }
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }
    res.json({ message: 'Flight updated successfully', flight_id });
  });
});

// Delete flight (admin)
app.delete('/api/flights/:id', (req, res) => {
  const sql = 'DELETE FROM flights WHERE flight_id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting flight:', err);
      res.status(500).json({ error: 'Failed to delete flight' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Flight not found' });
      return;
    }
    res.json({ message: 'Flight deleted successfully' });
  });
});


// Create booking
app.post('/api/bookings', (req, res) => {
  const { flight_id, passengers, total_price } = req.body;
  const user_id = req.session.userId || null;

  // Loyalty points are equal to the total price (1 point per AED)
  const points_earned = Math.max(0, parseInt(total_price, 10) || 0);

  const sql = 'INSERT INTO bookings (user_id, flight_id, total_price, points_earned, booking_date) VALUES (?, ?, ?, ?, NOW())';
  db.query(sql, [user_id, flight_id, total_price, points_earned], (err, result) => {
    if (err) {
      console.error('Error creating booking:', err);
      res.status(500).json({ error: 'Failed to create booking' });
      return;
    }

    const booking_id = result.insertId;

    // Insert passengers linked to this booking
    const passengerSql = 'INSERT INTO passengers (booking_id, name, email, passport_id, phone, seat_number, seat_class) VALUES ?';
    const passengerValues = passengers.map(p => [
      booking_id,
      p.name,
      p.email,
      p.passport_id,
      p.phone,
      p.seat_number,
      p.seat_class
    ]);

    db.query(passengerSql, [passengerValues], (err2) => {
      if (err2) {
        console.error('Error adding passengers:', err2);
        res.status(500).json({ error: 'Failed to add passengers' });
        return;
      }

      // Add points to the user if logged in
      if (user_id) {
        const updatePointsSql = 'UPDATE users SET loyalty_points = loyalty_points + ? WHERE user_id = ?';
        db.query(updatePointsSql, [points_earned, user_id], (err3) => {
          if (err3) {
            console.error('Error updating loyalty points:', err3);
          }
        });
      }

      res.json({
        message: 'Booking created successfully',
        booking_id: booking_id,
        points_earned: points_earned
      });
    });
  });
});

// Get booking by ID
app.get('/api/bookings/:id', (req, res) => {
  const sql = `
    SELECT b.*, f.flight_id, f.origin, f.destination, f.departure_time
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    WHERE b.booking_id = ?
  `;

  db.query(sql, [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching booking:', err);
      res.status(500).json({ error: 'Failed to fetch booking' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const booking = results[0];

    // Get passengers for this booking
    const passengerSql = 'SELECT * FROM passengers WHERE booking_id = ?';
    db.query(passengerSql, [req.params.id], (err2, passengers) => {
      if (err2) {
        console.error('Error fetching passengers:', err2);
        res.status(500).json({ error: 'Failed to fetch passengers' });
        return;
      }

      booking.passengers = passengers;
      res.json(booking);
    });
  });
});

// Authentication endpoints

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  // Check if the email already exists
  const checkSql = 'SELECT * FROM users WHERE email = ?';
  db.query(checkSql, [email], async (err, results) => {
    if (err) {
      console.error('Error checking email:', err);
      res.status(500).json({ error: 'Failed to create account' });
      return;
    }

    if (results.length > 0) {
      res.status(400).json({ error: 'Email already exists. Please log in.' });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const insertSql = 'INSERT INTO users (email, password_hash) VALUES (?, ?)';
    db.query(insertSql, [email, password_hash], (err2, result) => {
      if (err2) {
        console.error('Error creating user:', err2);
        res.status(500).json({ error: 'Failed to create account' });
        return;
      }

      // Set session
      req.session.userId = result.insertId;
      req.session.userEmail = email;

      res.json({
        message: 'Account created successfully',
        user: { id: result.insertId, email: email, loyalty_points: 0 }
      });
    });
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: 'Login failed' });
      return;
    }

    if (results.length === 0) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const user = results[0];

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Set session
    req.session.userId = user.user_id;
    req.session.userEmail = user.email;

    res.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        email: user.email,
        loyalty_points: user.loyalty_points || 0
      }
    });
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error during logout:', err);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check session status
app.get('/api/auth/session', (req, res) => {
  if (!req.session.userId) {
    res.json({ loggedIn: false });
    return;
  }

  const sql = 'SELECT user_id, email, loyalty_points FROM users WHERE user_id = ?';
  db.query(sql, [req.session.userId], (err, results) => {
    if (err) {
      console.error('Error fetching session user:', err);
      res.status(500).json({ error: 'Failed to fetch session' });
      return;
    }

    if (results.length === 0) {
      res.json({ loggedIn: false });
      return;
    }

    const user = results[0];

    res.json({
      loggedIn: true,
      user: {
        id: user.user_id,
        email: user.email,
        loyalty_points: user.loyalty_points || 0
      }
    });
  });
});

// Get a user's bookings
app.get('/api/users/:userId/bookings', (req, res) => {
  const userId = req.params.userId;

  // Ensure the user is viewing their own bookings
  if (req.session.userId !== parseInt(userId)) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const sql = `
    SELECT b.*, f.flight_id, f.origin, f.destination, f.departure_time
    FROM bookings b
    JOIN flights f ON b.flight_id = f.flight_id
    WHERE b.user_id = ?
    ORDER BY b.booking_date DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user bookings:', err);
      res.status(500).json({ error: 'Failed to fetch bookings' });
      return;
    }
    res.json(results);
  });
});

// Get a user's loyalty summary
app.get('/api/users/:userId/loyalty', (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (req.session.userId !== userId) {
    res.status(403).json({ error: 'Unauthorized' });
    return;
  }

  const sql = 'SELECT loyalty_points FROM users WHERE user_id = ?';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching loyalty points:', err);
      res.status(500).json({ error: 'Failed to fetch loyalty points' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ loyalty_points: results[0].loyalty_points || 0 });
  });
});

// Cancel a booking
app.delete('/api/bookings/:id', (req, res) => {
  const bookingId = req.params.id;

  // Verify the booking belongs to the logged-in user
  const checkSql = 'SELECT * FROM bookings WHERE booking_id = ?';
  db.query(checkSql, [bookingId], (err, results) => {
    if (err) {
      console.error('Error checking booking:', err);
      res.status(500).json({ error: 'Failed to cancel booking' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    if (results[0].user_id !== req.session.userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const bookingUserId = results[0].user_id;
    const pointsToRevoke = results[0].points_earned || 0;

    // Delete passengers first (foreign key constraint)
    const deletePassengersSql = 'DELETE FROM passengers WHERE booking_id = ?';
    db.query(deletePassengersSql, [bookingId], (err2) => {
      if (err2) {
        console.error('Error deleting passengers:', err2);
        res.status(500).json({ error: 'Failed to cancel booking' });
        return;
      }

      // Delete the booking record
      const deleteBookingSql = 'DELETE FROM bookings WHERE booking_id = ?';
      db.query(deleteBookingSql, [bookingId], (err3) => {
        if (err3) {
          console.error('Error deleting booking:', err3);
          res.status(500).json({ error: 'Failed to cancel booking' });
          return;
        }

        // Remove loyalty points earned from this booking
        if (bookingUserId) {
          const updatePointsSql = 'UPDATE users SET loyalty_points = GREATEST(loyalty_points - ?, 0) WHERE user_id = ?';
          db.query(updatePointsSql, [pointsToRevoke, bookingUserId], (err4) => {
            if (err4) {
              console.error('Error updating loyalty points on cancel:', err4);
              // Booking still cancels even if points update fails
            }
            res.json({ message: 'Booking cancelled successfully', points_removed: pointsToRevoke });
          });
        } else {
          res.json({ message: 'Booking cancelled successfully' });
        }
      });
    });
  });
});

// Serve static files 
app.use(express.static('.'));

// Start the server
app.listen(PORT, () => {
  console.log(`DuneAir server running on http://localhost:${PORT}`);
});
