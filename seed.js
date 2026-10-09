const bcrypt = require('bcryptjs');
const db = require('./database');

async function seed() {
  console.log('Seeding Roommate Finder System – RCPIT Shirpur database...');

  // Clear existing data safely
  db.exec(`
    DELETE FROM reports;
    DELETE FROM messages;
    DELETE FROM favorites;
    DELETE FROM listings;
    DELETE FROM users;
  `);

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // 1. Insert Users (Admin + RCPIT Students)
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, full_name, prn, gender, age, department,
      year_of_study, phone, location, budget, food_pref, sleep_pref,
      study_pref, lifestyle_pref, bio, avatar, is_verified, is_admin
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const users = [
    {
      id: 1,
      email: 'admin@rcpit.ac.in',
      password: adminHash,
      name: 'RCPIT Housing Admin',
      prn: 'ADMIN001',
      gender: 'Other',
      age: 32,
      dept: 'Student Affairs',
      year: 'Staff',
      phone: '+91 98765 43210',
      location: 'Shirpur Campus',
      budget: 10000,
      food: 'Any',
      sleep: 'Flexible / Moderate',
      study: 'Flexible / Music on Headphones',
      lifestyle: 'Neat & Organized',
      bio: 'Official campus accommodation coordinator and platform administrator.',
      avatar: '🛡️',
      verified: 1,
      admin: 1
    },
    {
      id: 2,
      email: 'maya.patel@rcpit.ac.in',
      password: passwordHash,
      name: 'Maya Patel',
      prn: '2021012345',
      gender: 'Female',
      age: 21,
      dept: 'Computer Engineering',
      year: 'Final Year',
      phone: '+91 98231 11223',
      location: 'Karvand Naka, Shirpur',
      budget: 4500,
      food: 'Pure Veg',
      sleep: 'Early Riser & Quiet',
      study: 'Quiet Solo Study',
      lifestyle: 'Neat & Organized',
      bio: 'Senior studying Computer Engineering at RCPIT. Very tidy, loves making herbal tea, and keeps weeknights quiet for coding and campus placement prep.',
      avatar: '🌸',
      verified: 1,
      admin: 0
    },
    {
      id: 3,
      email: 'ajinkya.patil@rcpit.ac.in',
      password: passwordHash,
      name: 'Ajinkya Patil',
      prn: '2022019876',
      gender: 'Male',
      age: 22,
      dept: 'Mechanical Engineering',
      year: 'Third Year',
      phone: '+91 94220 55443',
      location: 'Nimzari Naka, Shirpur',
      budget: 5500,
      food: 'Non-Veg',
      sleep: 'Night Owl & Studious',
      study: 'Group Study / Discussion',
      lifestyle: 'Social & Active',
      bio: 'Mechanical engineering junior. Keep common spaces clean, enjoy weekend football, and looking for an easy-going roommate near college gate.',
      avatar: '🎨',
      verified: 1,
      admin: 0
    },
    {
      id: 4,
      email: 'samira.k@rcpit.ac.in',
      password: passwordHash,
      name: 'Samira Kulkarni',
      prn: '2023014321',
      gender: 'Female',
      age: 20,
      dept: 'Information Technology',
      year: 'Second Year',
      phone: '+91 91580 77889',
      location: 'College Road, Shirpur',
      budget: 6000,
      food: 'Pure Veg',
      sleep: 'Early Riser & Quiet',
      study: 'Library Goer',
      lifestyle: 'Neat & Organized',
      bio: 'IT sophomore. Calm, respectful of quiet study hours, loves coding workshops and evening campus strolls. Looking for flatmate in a 2-BHK apartment.',
      avatar: '🐱',
      verified: 1,
      admin: 0
    },
    {
      id: 5,
      email: 'rohan.gaikwad@rcpit.ac.in',
      password: passwordHash,
      name: 'Rohan Gaikwad',
      prn: '2022017765',
      gender: 'Male',
      age: 21,
      dept: 'AI & Data Science',
      year: 'Third Year',
      phone: '+91 97654 33211',
      location: 'Subhash Nagar, Shirpur',
      budget: 5000,
      food: 'Eggetarian',
      sleep: 'Night Owl & Studious',
      study: 'Quiet Solo Study',
      lifestyle: 'Focused Student / Hybrid Work',
      bio: 'AI & DS enthusiast. Passionate about machine learning hackathons and gym sessions. Respects privacy and always pays rent and utilities on time.',
      avatar: '🏀',
      verified: 1,
      admin: 0
    },
    {
      id: 6,
      email: 'priya.sharma@rcpit.ac.in',
      password: passwordHash,
      name: 'Priya Sharma',
      prn: '2023018899',
      gender: 'Female',
      age: 20,
      dept: 'Electronics & Telecommunication',
      year: 'Second Year',
      phone: '+91 99234 66554',
      location: 'Karvand Naka, Shirpur',
      budget: 4200,
      food: 'Pure Veg',
      sleep: 'Flexible / Moderate',
      study: 'Quiet Solo Study',
      lifestyle: 'Neat & Organized',
      bio: 'E&TC student at RCPIT. Prefers a quiet environment during exam weeks, clean washroom etiquette, and friendly conversations over chai.',
      avatar: '🔬',
      verified: 1,
      admin: 0
    },
    {
      id: 7,
      email: 'rahul.shinde@rcpit.ac.in',
      password: passwordHash,
      name: 'Rahul Shinde',
      prn: '2021016654',
      gender: 'Male',
      age: 22,
      dept: 'Civil Engineering',
      year: 'Final Year',
      phone: '+91 98901 22334',
      location: 'Main Road, Shirpur',
      budget: 4800,
      food: 'Non-Veg',
      sleep: 'Flexible / Moderate',
      study: 'Group Study / Discussion',
      lifestyle: 'Social & Active',
      bio: 'Civil engineering final year student. Enjoys sports, cricket matches, and group discussions. Always tidy in common kitchen area.',
      avatar: '🎧',
      verified: 0,
      admin: 0
    }
  ];

  for (const u of users) {
    insertUser.run(
      u.id, u.email, u.password, u.name, u.prn, u.gender, u.age,
      u.dept, u.year, u.phone, u.location, u.budget, u.food,
      u.sleep, u.study, u.lifestyle, u.bio, u.avatar, u.verified, u.admin
    );
  }

  // 2. Insert Roommate Listings
  const insertListing = db.prepare(`
    INSERT INTO listings (
      id, user_id, title, location, budget, room_type, amenities,
      preferred_gender, is_available, description
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const listings = [
    {
      id: 1,
      userId: 2,
      title: 'Abhilata Building – 2 Sharing Room Near Karvand Naka',
      location: 'Karvand Naka, Shirpur',
      budget: 4500,
      roomType: 'Shared 2-sharing',
      amenities: 'High-speed WiFi, RO Water, Inverter Backup, Study Table, Mess 50m away',
      preferredGender: 'Female only',
      isAvailable: 1,
      description: 'Spacious 2-sharing room in Abhilata Building, just 5 minutes walk from RCPIT main gate. Clean washroom, 24/7 water supply, quiet residential locality.'
    },
    {
      id: 2,
      userId: 3,
      title: 'Ajinkya Apartment – Spacious Room for Boys',
      location: 'Nimzari Naka, Shirpur',
      budget: 5500,
      roomType: 'Shared 2-sharing',
      amenities: 'WiFi, Bike Parking, Attached Bathroom, RO Drinking Water, Balcony',
      preferredGender: 'Male only',
      isAvailable: 1,
      description: 'Second floor well-ventilated apartment room with attached washroom. Quiet atmosphere suitable for studying and project work. Looking for a neat flatmate.'
    },
    {
      id: 3,
      userId: 4,
      title: 'Asusde Residency – 1 Room in 2-BHK Flat',
      location: 'College Road, Shirpur',
      budget: 6000,
      roomType: '1 BHK',
      amenities: 'Furnished, Refrigerator, RO Water, High-speed WiFi, Covered Parking',
      preferredGender: 'Female only',
      isAvailable: 1,
      description: 'Single occupancy room available in a premium 2-BHK apartment near College Road. Fully setup kitchen, peaceful surroundings, ideal for focused study.'
    },
    {
      id: 4,
      userId: 5,
      title: 'Gadhe Villa – Budget Friendly Boys Accommodation',
      location: 'Subhash Nagar, Shirpur',
      budget: 5000,
      roomType: 'Shared 3-sharing',
      amenities: 'WiFi, Hot Water Geyser, Individual Wardrobes, Power Backup',
      preferredGender: 'Male only',
      isAvailable: 1,
      description: 'Affordable shared accommodation with friendly college mates. Regular cleaning, quiet study hours from 10 PM onwards, close to engineering mess.'
    },
    {
      id: 5,
      userId: 6,
      title: 'Sai Shraddha Residency – Girls Flat Sharing',
      location: 'Karvand Naka, Shirpur',
      budget: 4200,
      roomType: 'Shared 2-sharing',
      amenities: 'WiFi, CCTV Security, RO Filter, Solar Water Heater, Study Desks',
      preferredGender: 'Female only',
      isAvailable: 1,
      description: 'Safe and secure girls accommodation in Karvand Naka. Close to supermarkets and medical stores. Looking for a responsible, friendly roommate.'
    },
    {
      id: 6,
      userId: 7,
      title: 'Main Road Studio PG Room for Final Years',
      location: 'Main Road, Shirpur',
      budget: 4800,
      roomType: 'Shared 2-sharing',
      amenities: 'High-speed Internet, Attached Washroom, Easy Transport, Parking',
      preferredGender: 'Any',
      isAvailable: 1,
      description: 'Central location with quick auto connectivity to campus. Great food options and tiffin services right across the street.'
    }
  ];

  for (const l of listings) {
    insertListing.run(
      l.id, l.userId, l.title, l.location, l.budget, l.roomType,
      l.amenities, l.preferredGender, l.isAvailable, l.description
    );
  }

  // 3. Insert Initial Favorites
  const insertFav = db.prepare('INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)');
  insertFav.run(2, 3); // Maya favorited Samira's listing
  insertFav.run(3, 4); // Ajinkya favorited Gadhe Villa
  insertFav.run(4, 1); // Samira favorited Abhilata

  // 4. Insert Initial Messages
  const insertMsg = db.prepare(`
    INSERT INTO messages (sender_id, receiver_id, listing_id, message_text, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
  `);
  insertMsg.run(3, 2, 1, 'Hello Maya, is the shared room in Abhilata Building still open for next semester?', 1, '-2 hours');
  insertMsg.run(2, 3, 1, 'Hi Ajinkya! Yes, it is available. The landlord requires a minimum 6-month stay. Are you looking to move in this month?', 1, '-1 hours');
  insertMsg.run(5, 4, 3, 'Hey Samira! Inquired about your 2-BHK listing on College Road. Does rent include electricity bill?', 0, '-25 minutes');

  console.log('Database successfully seeded with realistic RCPIT Shirpur data!');
}

seed();
