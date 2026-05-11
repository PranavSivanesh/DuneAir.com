-- Initializing the database 
CREATE DATABASE IF NOT EXISTS duneair;
USE duneair;

-- Users Table, needs to be created first
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  loyalty_points INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Flights Table, after users table
CREATE TABLE IF NOT EXISTS flights (
  flight_id VARCHAR(10) PRIMARY KEY,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  departure_time DATETIME NOT NULL,
  first_class_price INT,
  business_class_price INT,
  economy_class_price INT
) ENGINE=InnoDB;

-- Bookings Table, created after users and flights
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  flight_id VARCHAR(10) NOT NULL,
  total_price INT NOT NULL,
  points_earned INT DEFAULT 0,
  booking_date DATETIME NOT NULL,
  FOREIGN KEY (flight_id) REFERENCES flights(flight_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Passengers Table, created after bookings
CREATE TABLE IF NOT EXISTS passengers (
  passenger_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  passport_id VARCHAR(50) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  seat_number VARCHAR(5) NOT NULL,
  seat_class VARCHAR(1) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert Sample Users
INSERT INTO users (email, password_hash, loyalty_points) VALUES
('john@email.com', 'hashed_password_123', 1500),
('admin@duneair.com', 'admin_hashed_password', 5000),
('sarah@email.com', 'hashed_password_456', 800);

-- Sample Flights
INSERT INTO flights (flight_id, origin, destination, departure_time, first_class_price, business_class_price, economy_class_price) VALUES
('DA412', 'DXB', 'LHR', '2025-12-01 09:20:00', 5000, 3500, 950),
('DA201', 'DXB', 'JFK', '2025-12-02 02:30:00', 8500, 5500, 1950),
('DA354', 'DXB', 'SIN', '2025-12-03 22:10:00', 4800, 3000, 780),
('DA007', 'DXB', 'CAI', '2025-12-07 06:45:00', NULL, 1200, 320),
('DA115', 'DXB', 'CDG', '2025-12-10 14:00:00', 6000, 4000, 850),
('DA630', 'SHJ', 'DOH', '2025-12-01 07:15:00', NULL, 900, 280),
('DA151', 'SHJ', 'IST', '2025-12-04 12:30:00', NULL, 2400, 620),
('DA740', 'SHJ', 'DEL', '2025-12-08 18:00:00', NULL, 1300, 380),
('DA905', 'SHJ', 'KWI', '2025-12-11 20:50:00', NULL, 950, 290),
('DA010', 'AUH', 'NRT', '2025-12-05 01:10:00', 7500, 4500, 1200),
('DA222', 'AUH', 'FRA', '2025-12-09 10:45:00', 5500, 3800, 790),
('DA888', 'AUH', 'CPT', '2025-12-14 23:00:00', 6500, 4200, 1500),
('DA199', 'AUH', 'MLE', '2025-12-18 16:20:00', NULL, 2200, 650),
('DA602', 'LHR', 'DXB', '2025-12-05 17:40:00', 5500, 3800, 900),
('DA810', 'JFK', 'DXB', '2025-12-08 20:10:00', 9000, 6000, 2000);

-- Sample Bookings
INSERT INTO bookings (user_id, flight_id, total_price, points_earned, booking_date) VALUES
(1, 'DA412', 950, 100, '2025-11-15 10:30:00'),
(1, 'DA201', 1950, 200, '2025-11-20 14:45:00'),
(2, 'DA354', 780, 100, '2025-11-18 09:15:00');

-- Sample Passengers
INSERT INTO passengers (booking_id, name, email, passport_id, phone, seat_number, seat_class) VALUES
(1, 'John Doe', 'john@email.com', 'AB123456', '+1234567890', '12A', 'E'),
(2, 'John Doe', 'john@email.com', 'AB123456', '+1234567890', '15C', 'E'),
(3, 'Admin User', 'admin@duneair.com', 'CD789012', '+1987654321', '8B', 'E');