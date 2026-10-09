# Roommate Finder System – RCPIT Shirpur

A full-stack, mobile-responsive web application engineered for students of **R. C. Patel Institute of Technology (RCPIT), Shirpur** to find compatible flatmates, shared hostel rooms, and apartments near campus (Karvand Naka, Nimzari Naka, College Road, Subhash Nagar).

---

## 🚀 Key Features (~80% Functional Milestone)

1. **Authentication & Session Security**:
   - Student registration & secure login with JWT tokens.
   - Passwords hashed using `bcryptjs`.
   - Protected API endpoints and authorization checks.
2. **Student Dashboard**:
   - Tabbed interface: My Profile, Edit Profile & Living Habits, My Room Listings, Saved Favorites, In-App Messages, Student Verification, and Admin Controls.
3. **Real Compatibility Matching Algorithm**:
   - Computes genuine mathematical compatibility scores ($0-100\%$) based on:
     - Budget ($25\%$)
     - Location Proximity ($20\%$)
     - Food/Dietary Habits ($15\%$)
     - Sleep Schedules ($15\%$)
     - Study Habits ($15\%$)
     - Lifestyle ($10\%$)
   - Visual breakdown bar chart for each category.
4. **Roommate Listing Lifecycle**:
   - Post, edit, delete listings.
   - Toggle availability status (`Available` vs `Occupied`).
   - Filter by room type, gender preference, and rent budget.
5. **In-App Messaging System**:
   - Real-time message exchanges with incoming/outgoing chat bubbles.
   - Conversation list with latest message preview and unread counters.
   - Automatic read-receipt updates and message deletion.
6. **Favorites / Bookmarking**:
   - Persistent bookmarks stored in SQLite database with duplicate prevention.
7. **RCPIT Student PRN Verification**:
   - University PRN enrollment verification workflow.
   - Official **✓ Verified Student** badge displayed across listings and cards.
8. **Synergistic Search & Multi-Filters**:
   - Filter by Keyword, Shirpur Area, Gender, Diet, Sleep, Study, Lifestyle, and Budget slider.
   - Sort by Compatibility, Rent (Asc/Desc), Age, and Newest.
9. **Community Safety & Reporting**:
   - Report misleading listings or inappropriate behavior with reason and details.
10. **Admin Panel**:
    - System metrics, user management, verify/unverify toggle, listing moderation, and report resolution.
11. **Real SQLite Database & Metrics**:
    - High-performance SQLite database using Node.js native `DatabaseSync` engine (`node:sqlite`).
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
