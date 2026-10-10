# Roommate Finder System – RCPIT Shirpur

A full-stack, mobile-responsive web application engineered for students of **R. C. Patel Institute of Technology (RCPIT), Shirpur** to find compatible flatmates, shared hostel rooms, and apartments near campus (Karvand Naka, Nimzari Naka, College Road, Subhash Nagar).

---

## 🚀 Key Features (~80% Functional Milestone)

1. **Authentication & SQLite Database Security**:
   - Real database-backed registration and login powered by native `node:sqlite` (`roommatefinder.db`).
   - Student registration & secure login with JWT tokens (`/api/auth/login`, `/api/auth/register`, `/api/auth/me`).
   - Passwords securely hashed with `bcryptjs`.
   - 1-Click demo account quick-fill login in the UI.
2. **Dedicated Girls Section (Women's Wing)**:
   - Segregated female student roommate listings and girls hostels/PGs (Abhilata Building, Sai Shraddha, etc.).
   - Female safety guidelines: PRN verification, biometric/curfew details, warden contacts, Karvand & College Rd safe zones.
   - Tailored filters: Area, diet (Pure Veg / Eggetarian), budget slider, verified status.
   - 1-Click quick listing creation with "Female only" preset.
3. **Dedicated Boys Section (Men's Wing)**:
   - Segregated male student roommate listings and boys hostels/PGs (Ajinkya Apartment, Gadhe Villa, etc.).
   - Boys campus amenities: Bike parking, 5G Wi-Fi, proximity to college gate & mess, night owl study friendly.
   - Tailored filters: Area, sleep schedule (Night Owl / Early Riser), budget slider.
   - 1-Click quick listing creation with "Male only" preset.
4. **Student Dashboard**:
   - Tabbed interface: My Profile, Edit Profile & Living Habits, My Room Listings, Saved Favorites, In-App Messages, Student Verification, and Admin Controls.
5. **Real Compatibility Matching Algorithm**:
   - Computes genuine mathematical compatibility scores (0–100%) based on Budget (25%), Location (20%), Food (15%), Sleep (15%), Study (15%), and Lifestyle (10%).
   - Visual breakdown bar chart for each category.
6. **Roommate Listing Lifecycle**:
   - Post, edit, delete listings.
   - Toggle availability status (`Available` vs `Occupied`).
   - Filter by room type, gender preference, and rent budget.
7. **In-App Messaging System**:
   - Real-time message exchanges with incoming/outgoing chat bubbles.
   - Conversation list with latest message preview and unread counters.
8. **Favorites / Bookmarking**:
   - Persistent bookmarks stored in SQLite database with duplicate prevention.
9. **RCPIT Student PRN Verification**:
   - University PRN enrollment verification workflow with **✓ Verified Student** badge.
10. **Admin Panel**:
    - System metrics, user management, verify/unverify toggle, listing moderation, and report resolution.
11. **Real SQLite Database Engine**:
    - High-performance native `node:sqlite` database (`roommatefinder.db`).
    - Live database statistics displayed on hero landing.

---

## 🛠️ Quick Start & Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Initial Database
Populates the database with realistic RCPIT student profiles and listings:
```bash
npm run seed
```

### 3. Start Express Server
```bash
npm start
```
Open your browser and navigate to: **`http://localhost:3000`**

### 4. Run Automated Test Suite
Runs the 23-point automated verification test suite:
```bash
npm test
```

---

## 👥 Demo Accounts

| Role | Email / Login | Password | Notes |
|---|---|---|---|
| **Admin** | `admin@rcpit.ac.in` | `admin123` | Platform coordinator with access to Admin Controls |
| **Student (Verified)** | `maya.patel@rcpit.ac.in` | `password123` | Final Year Computer Engg, Karvand Naka |
| **Student (Verified)** | `ajinkya.patil@rcpit.ac.in` | `password123` | Third Year Mechanical Engg, Nimzari Naka |
| **Student (Verified)** | `samira.k@rcpit.ac.in` | `password123` | Second Year IT, College Road |
