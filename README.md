# DuneAir - Premium Flight Booking Platform

A sophisticated full-stack airline booking system built with modern web technologies, featuring multi-passenger bookings, interactive seat selection, loyalty programs, and comprehensive admin management.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![jQuery](https://img.shields.io/badge/jQuery-3.6+-orange)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)

## Live Demo

**Access the application:** `http://localhost:3003`

**Default Admin Login:**
- Email: `admin@duneair.com`
- Password: `admin`

## Features

### User Features
- **Advanced Flight Search** with flexible dates (±3 days) and multiple filters
- **Multi-Passenger Booking** with individual seat selection
- **Interactive Seat Map** with visual cabin layouts and real-time availability
- **Secure Authentication** with session management and password hashing
- **Booking Management** with view/cancel functionality
- **Loyalty Program** (Dune Miles) with tier-based rewards system
- **Offline Search History** using localStorage persistence
- **Responsive Design** optimized for all devices

### Admin Features
- **Complete Flight CRUD Operations** (Create, Read, Update, Delete)
- **Real-time Flight Management** with dynamic pricing
- **Admin Authentication** with secure access control
- **Database Management** through intuitive web interface

## Technology Stack

### Frontend
- **HTML5** - Semantic structure and accessibility
- **CSS3** - Advanced styling with CSS Grid, Flexbox, and CSS Variables
- **JavaScript (ES6+)** - Modern JavaScript with modular architecture
- **jQuery** - DOM manipulation and AJAX requests
- **Select2** - Enhanced dropdown functionality

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database management
- **bcrypt** - Password hashing and security
- **express-session** - Session management
- **CORS** - Cross-origin resource sharing

### Data Management
- **JSON** - Data transfer format
- **Web Storage API** - Local persistence for search history
- **RESTful APIs** - Structured backend communication

## Project Structure
```
duneair/
├── HTML Pages
│ ├── index.html # Homepage with flight search
│ ├── results.html # Flight search results
│ ├── passenger.html # Multi-passenger details form
│ ├── seat.html # Interactive seat selection
│ ├── payment.html # Payment processing
│ ├── loyalty.html # Loyalty program information
│ ├── network.html # Route network and destinations
│ └── admin-flights.html # Admin flight management
│
├── Styling & Scripts
│ ├── styles.css # Comprehensive CSS with theme variables
│ ├── script.js # Core frontend functionality & state management
│ ├── script-api.js # API integration and data handling
│ ├── auth.js # Authentication and user session management
│ ├── admin.js # Admin authentication and UI
│ └── admin-flights.js # Admin flight CRUD operations
│
├── Backend & Database
│ ├── server.js # Express server with REST API endpoints
│ └── database.sql # Database schema with sample data
│
└── Configuration
├── package.json # Dependencies and scripts
├── package-lock.json # Exact dependency versions
└── README.md # Project documentation
```
## Prerequisites

- Node.js installed (Download from https://nodejs.org/)
- MySQL installed (Download from https://www.mysql.com/)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup MySQL Database

1. Open MySQL Workbench or MySQL command line
2. Run the SQL script to create the database:

```bash
mysql -u root -p < database.sql
```

Or manually:
- Open `database.sql` in MySQL Workbench
- Execute the script

### 3. Configure Database Connection

Edit `server.js` and update the MySQL connection settings:

```javascript
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD',  // Change this!
  database: 'duneair'
});
```

### 4. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 5. Access the Application

Open your browser and go to:
```
http://localhost:3000
```

## Features

- Search for flights
- Book tickets
- Select seats
- Multi-passenger booking
- Payment processing
- Loyalty points system

## API Endpoints

### Flights
- `GET /api/flights` - Get all flights
- `GET /api/flights/search?from=DXB&to=LHR&depart=2025-12-01` - Search flights
- `GET /api/flights/:id` - Get flight by ID

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/:id` - Get booking by ID

## Database Schema

- **flights**: Stores flight information
- **bookings**: Stores booking records
- **passengers**: Stores passenger details for each booking
- **users**: Stores user information and loyalty points

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check current session

### Flights
- `GET /api/flights` - Get all flights
- `GET /api/flights/search` - Search flights with filters
- `GET /api/flights/:id` - Get specific flight details
- `POST /api/flights` - Create new flight (Admin)
- `PUT /api/flights/:id` - Update flight (Admin)
- `DELETE /api/flights/:id` - Delete flight (Admin)

### Bookings & Users
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `DELETE /api/bookings/:id` - Cancel booking
- `GET /api/users/:id/bookings` - Get user's booking history
- `GET /api/users/:id/loyalty` - Get user's loyalty points

## Database Schema

### Core Tables
- **users** - User accounts with loyalty points
- **flights** - Flight schedules with class-based pricing
- **bookings** - Booking records with total pricing
- **passengers** - Individual passenger details per booking

### Key Relationships
```
users (1) ←→ (many) bookings (1) ←→ (many) passengers
flights (1) ←→ (many) bookings
```
