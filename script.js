/**
 * Roommate Finder System – RCPIT Shirpur
 * 80% Complete & Fully Functional Client Logic
 * Handles Authentication, Student Dashboard, Real Compatibility Matching,
 * Listing Management, In-App Chat Messaging, Favorites, Verification, and Admin Controls.
 */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. App State & API Configuration
  // ==========================================================================
  function getApiBase() {
    // If frontend is served directly by Express on port 3000
    if (window.location.port === '3000') {
      return '/api';
    }
    // If opened via VS Code Live Server (port 5500/5501) or other local dev port, route to Express on 3000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
      return 'http://127.0.0.1:3000/api';
    }
    return '/api';
  }

  let API_BASE = getApiBase();

  let currentUser = null;
  let authToken = localStorage.getItem('rf_token') || null;
  let favoriteListingIds = new Set();
  let activeConversationPartnerId = null;
  let chatPollTimer = null;

  // Cache of profiles and listings
  let cachedProfiles = [];
  let cachedListings = [];
  let activeSelectedProfile = null;

  // Try to load cached user
  const storedUser = localStorage.getItem('rf_user');
  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
    } catch (e) {
      currentUser = null;
    }
  }

  // ==========================================================================
  // 2. DOM Elements
  // ==========================================================================
  // Navigation elements
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navAuthContainer = document.getElementById('nav-auth-container');
  const navDashboardLink = document.getElementById('nav-dashboard-link');
  const unreadNavBadge = document.getElementById('unread-nav-badge');
  const directViewTriggers = document.querySelectorAll('[data-view]');

  // Live Stats Elements
  const statStudents = document.getElementById('stat-students');
  const statListings = document.getElementById('stat-listings');
  const statVerified = document.getElementById('stat-verified');
  const statMessages = document.getElementById('stat-messages');

  // Search & Filter elements
  const filterKeyword = document.getElementById('filter-keyword');
  const filterLocation = document.getElementById('filter-location');
  const filterGender = document.getElementById('filter-gender');
  const filterSort = document.getElementById('filter-sort');
  const filterFood = document.getElementById('filter-food');
  const filterSleep = document.getElementById('filter-sleep');
  const filterStudy = document.getElementById('filter-study');
  const filterLifestyle = document.getElementById('filter-lifestyle');
  const filterVerified = document.getElementById('filter-verified');
  const filterBudget = document.getElementById('filter-budget');
  const budgetValueDisplay = document.getElementById('budget-value-display');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  const noResultsResetBtn = document.getElementById('no-results-reset-btn');
  const roommatesGrid = document.getElementById('roommates-grid');
  const resultsCount = document.getElementById('results-count');
  const noResultsBox = document.getElementById('no-results');
  const authHintBanner = document.getElementById('auth-hint-banner');

  // Listings view elements
  const listingFilterKeyword = document.getElementById('listing-filter-keyword');
  const listingFilterType = document.getElementById('listing-filter-type');
  const listingFilterGender = document.getElementById('listing-filter-gender');
  const listingFilterSort = document.getElementById('listing-filter-sort');
  const listingsGrid = document.getElementById('listings-grid');
  const listingsResultsCount = document.getElementById('listings-results-count');
  const noListingsBox = document.getElementById('no-listings-found');
  const noListingsResetBtn = document.getElementById('no-listings-reset-btn');

  // Dashboard elements
  const dashNavButtons = document.querySelectorAll('.dash-nav-btn[data-tab]');
  const dashTabPanes = document.querySelectorAll('.dash-tab-pane');
  const dashSidebarAvatar = document.getElementById('dash-sidebar-avatar');
  const dashSidebarName = document.getElementById('dash-sidebar-name');
  const dashSidebarDept = document.getElementById('dash-sidebar-dept');
  const dashSidebarBadge = document.getElementById('dash-sidebar-badge');
  const dashAdminNavBtn = document.getElementById('dash-admin-nav-btn');
  const dashFavCount = document.getElementById('dash-fav-count');
  const dashMsgCount = document.getElementById('dash-msg-count');
  const dashLogoutBtn = document.getElementById('dash-logout-btn');

  // Dashboard profile tab
  const dashSumName = document.getElementById('dash-sum-name');
  const dashSumEmail = document.getElementById('dash-sum-email');
  const dashSumPrn = document.getElementById('dash-sum-prn');
  const dashSumDept = document.getElementById('dash-sum-dept');
  const dashSumGender = document.getElementById('dash-sum-gender');
  const dashSumLocation = document.getElementById('dash-sum-location');
  const dashSumBudget = document.getElementById('dash-sum-budget');
  const dashSumPhone = document.getElementById('dash-sum-phone');
  const dashSumFood = document.getElementById('dash-sum-food');
  const dashSumSleep = document.getElementById('dash-sum-sleep');
  const dashSumStudy = document.getElementById('dash-sum-study');
  const dashSumLifestyle = document.getElementById('dash-sum-lifestyle');
  const dashSumBio = document.getElementById('dash-sum-bio');
  const jumpToEditBtn = document.getElementById('jump-to-edit-btn');

  // Dashboard forms
  const editProfileForm = document.getElementById('edit-profile-form');
  const verificationForm = document.getElementById('verification-form');
  const verificationStatusBox = document.getElementById('verification-status-box');
  const myListingsContainer = document.getElementById('my-listings-container');
  const favoritesGrid = document.getElementById('favorites-grid');

  // Chat elements
  const conversationsList = document.getElementById('conversations-list');
  const chatEmptyState = document.getElementById('chat-empty-state');
  const chatActiveBox = document.getElementById('chat-active-box');
  const chatPartnerAvatar = document.getElementById('chat-partner-avatar');
  const chatPartnerName = document.getElementById('chat-partner-name');
  const chatPartnerDept = document.getElementById('chat-partner-dept');
  const chatMessagesBody = document.getElementById('chat-messages-body');
  const chatSendForm = document.getElementById('chat-send-form');
  const chatInputText = document.getElementById('chat-input-text');

  // Modals
  const authModal = document.getElementById('auth-modal');
  const authModalClose = document.getElementById('auth-modal-close');
  const tabBtnLogin = document.getElementById('tab-btn-login');
  const tabBtnRegister = document.getElementById('tab-btn-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authAlert = document.getElementById('auth-alert');

  const profileModal = document.getElementById('profile-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDismissBtn = document.getElementById('modal-dismiss-btn');
  const modalAvatar = document.getElementById('modal-avatar');
  const modalName = document.getElementById('modal-name');
  const modalVerifiedBadge = document.getElementById('modal-verified-badge');
  const modalLocation = document.getElementById('modal-location');
  const modalBudget = document.getElementById('modal-budget');
  const modalGender = document.getElementById('modal-gender');
  const modalDept = document.getElementById('modal-dept');
  const modalFood = document.getElementById('modal-food');
  const modalSleep = document.getElementById('modal-sleep');
  const modalStudy = document.getElementById('modal-study');
  const modalBio = document.getElementById('modal-bio');
  const modalCompScore = document.getElementById('modal-comp-score');
  const modalCompBars = document.getElementById('modal-comp-bars');
  const modalContactBtn = document.getElementById('modal-contact-btn');
  const modalFavBtn = document.getElementById('modal-fav-btn');
  const modalReportBtn = document.getElementById('modal-report-btn');

  const listingModal = document.getElementById('listing-modal');
  const listingModalClose = document.getElementById('listing-modal-close');
  const listingForm = document.getElementById('listing-form');
  const listingModalTitle = document.getElementById('listing-modal-title');
  const listingEditId = document.getElementById('listing-edit-id');

  const messageModal = document.getElementById('message-modal');
  const messageModalClose = document.getElementById('message-modal-close');
  const directMessageForm = document.getElementById('direct-message-form');
  const msgRecipientName = document.getElementById('msg-recipient-name');
  const msgRecipientId = document.getElementById('msg-recipient-id');
  const msgListingId = document.getElementById('msg-listing-id');
  const msgCancelBtn = document.getElementById('msg-cancel-btn');

  const reportModal = document.getElementById('report-modal');
  const reportModalClose = document.getElementById('report-modal-close');
  const reportForm = document.getElementById('report-form');
  const reportTargetType = document.getElementById('report-target-type');
  const reportTargetId = document.getElementById('report-target-id');
  const reportCancelBtn = document.getElementById('report-cancel-btn');

  const toastContainer = document.getElementById('toast-container');

  // ==========================================================================
  // 3. Toast Notifications
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ==========================================================================
  // 4. API Request Helper with 405 / Static Host Fallback
  // ==========================================================================
  function calculateClientCompatibility(userA, userB) {
    if (!userA || !userB) return { score: 75, breakdown: { budget: 75, location: 75, food: 75, sleep: 75, study: 75, lifestyle: 75 } };

    const bA = Number(userA.budget) || 5000;
    const bB = Number(userB.budget) || 5000;
    const maxB = Math.max(bA, bB);
    const diffB = Math.abs(bA - bB);
    let budgetScore = maxB > 0 ? Math.max(10, Math.round(100 - (diffB / maxB) * 100)) : 100;

    const locA = (userA.location || '').toLowerCase().trim();
    const locB = (userB.location || '').toLowerCase().trim();
    let locationScore = 40;
    if (locA && locB) {
      if (locA === locB) locationScore = 100;
      else if (locA.includes('shirpur') && locB.includes('shirpur')) locationScore = 90;
      else if (locA.includes(locB) || locB.includes(locA)) locationScore = 80;
      else if ((locA.includes('karvand') && locB.includes('karvand')) || (locA.includes('nimzari') && locB.includes('nimzari'))) locationScore = 95;
      else locationScore = 45;
    }

    const foodA = (userA.food_pref || 'Any').toLowerCase();
    const foodB = (userB.food_pref || 'Any').toLowerCase();
    let foodScore = 70;
    if (foodA === 'any' || foodB === 'any' || foodA === foodB) foodScore = 100;
    else if (foodA.includes('veg') && foodB.includes('veg')) foodScore = 95;
    else if ((foodA.includes('non-veg') && foodB.includes('veg')) || (foodB.includes('non-veg') && foodA.includes('veg'))) foodScore = 30;

    const sleepA = (userA.sleep_pref || '').toLowerCase();
    const sleepB = (userB.sleep_pref || '').toLowerCase();
    let sleepScore = 70;
    if (!sleepA || !sleepB || sleepA === sleepB || sleepA.includes('flexible') || sleepB.includes('flexible')) sleepScore = 100;
    else if ((sleepA.includes('early') && sleepB.includes('night')) || (sleepB.includes('early') && sleepA.includes('night'))) sleepScore = 35;

    const studyA = (userA.study_pref || '').toLowerCase();
    const studyB = (userB.study_pref || '').toLowerCase();
    let studyScore = 70;
    if (!studyA || !studyB || studyA === studyB || studyA.includes('flexible') || studyB.includes('flexible')) studyScore = 100;
    else if ((studyA.includes('solo') && studyB.includes('group')) || (studyB.includes('solo') && studyA.includes('group'))) studyScore = 40;

    const lifeA = (userA.lifestyle_pref || userA.lifestyle || '').toLowerCase();
    const lifeB = (userB.lifestyle_pref || userB.lifestyle || '').toLowerCase();
    let lifeScore = 60;
    if (!lifeA || !lifeB || lifeA === lifeB) lifeScore = 100;
    else if (lifeA.includes('neat') && lifeB.includes('neat')) lifeScore = 95;

    const total = budgetScore * 0.25 + locationScore * 0.20 + foodScore * 0.15 + sleepScore * 0.15 + studyScore * 0.15 + lifeScore * 0.10;
    return {
      score: Math.min(99, Math.max(30, Math.round(total))),
      breakdown: { budget: budgetScore, location: locationScore, food: foodScore, sleep: sleepScore, study: studyScore, lifestyle: lifeScore }
    };
  }

  function handleStaticFallback(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    let body = {};
    try {
      if (options.body) body = JSON.parse(options.body);
    } catch (e) {
      body = {};
    }

    let localUsers = JSON.parse(localStorage.getItem('rf_local_users') || 'null');
    if (!localUsers) {
      localUsers = [
        {
          id: 1, email: 'admin@rcpit.ac.in', password: 'admin123',
          full_name: 'RCPIT Housing Admin', prn: 'ADMIN001', gender: 'Other',
          age: 32, department: 'Student Affairs', year_of_study: 'Staff',
          phone: '+91 98765 43210', location: 'Shirpur Campus', budget: 10000,
          food_pref: 'Any', sleep_pref: 'Flexible / Moderate', study_pref: 'Flexible / Music on Headphones',
          lifestyle_pref: 'Neat & Organized', bio: 'Official campus accommodation coordinator and platform administrator.',
          avatar: '🛡️', is_verified: 1, is_admin: 1
        },
        {
          id: 2, email: 'maya.patel@rcpit.ac.in', password: 'password123',
          full_name: 'Maya Patel', prn: '2021012345', gender: 'Female',
          age: 21, department: 'Computer Engineering', year_of_study: 'Final Year',
          phone: '+91 98231 11223', location: 'Karvand Naka, Shirpur', budget: 4500,
          food_pref: 'Pure Veg', sleep_pref: 'Early Riser & Quiet', study_pref: 'Quiet Solo Study',
          lifestyle_pref: 'Neat & Organized', bio: 'Senior studying Computer Engineering at RCPIT. Very tidy, loves making herbal tea, keeps weeknights quiet for coding.',
          avatar: '🌸', is_verified: 1, is_admin: 0
        },
        {
          id: 3, email: 'ajinkya.patil@rcpit.ac.in', password: 'password123',
          full_name: 'Ajinkya Patil', prn: '2022019876', gender: 'Male',
          age: 22, department: 'Mechanical Engineering', year_of_study: 'Third Year',
          phone: '+91 94220 55443', location: 'Nimzari Naka, Shirpur', budget: 5500,
          food_pref: 'Non-Veg', sleep_pref: 'Night Owl & Studious', study_pref: 'Group Study / Discussion',
          lifestyle_pref: 'Social & Active', bio: 'Mechanical engineering junior. Keep common spaces clean, enjoy weekend football, looking for flatmate near college gate.',
          avatar: '🎨', is_verified: 1, is_admin: 0
        },
        {
          id: 4, email: 'samira.k@rcpit.ac.in', password: 'password123',
          full_name: 'Samira Kulkarni', prn: '2023014321', gender: 'Female',
          age: 20, department: 'Information Technology', year_of_study: 'Second Year',
          phone: '+91 91580 77889', location: 'College Road, Shirpur', budget: 6000,
          food_pref: 'Pure Veg', sleep_pref: 'Early Riser & Quiet', study_pref: 'Library Goer',
          lifestyle_pref: 'Neat & Organized', bio: 'IT sophomore. Calm, respectful of quiet study hours, loves coding workshops and evening campus strolls.',
          avatar: '🐱', is_verified: 1, is_admin: 0
        },
        {
          id: 5, email: 'rohan.gaikwad@rcpit.ac.in', password: 'password123',
          full_name: 'Rohan Gaikwad', prn: '2022017765', gender: 'Male',
          age: 21, department: 'AI & Data Science', year_of_study: 'Third Year',
          phone: '+91 97654 33211', location: 'Subhash Nagar, Shirpur', budget: 5000,
          food_pref: 'Eggetarian', sleep_pref: 'Night Owl & Studious', study_pref: 'Quiet Solo Study',
          lifestyle_pref: 'Focused Student / Hybrid Work', bio: 'AI & DS enthusiast. Passionate about machine learning hackathons and gym sessions.',
          avatar: '🏀', is_verified: 1, is_admin: 0
        }
      ];
      localStorage.setItem('rf_local_users', JSON.stringify(localUsers));
    }

    let localListings = JSON.parse(localStorage.getItem('rf_local_listings') || 'null');
    if (!localListings) {
      localListings = [
        {
          id: 1, user_id: 2, title: 'Abhilata Building – 2 Sharing Room Near Karvand Naka',
          location: 'Karvand Naka, Shirpur', budget: 4500, room_type: 'Shared 2-sharing',
          amenities: 'High-speed WiFi, RO Water, Inverter Backup, Study Table, Mess 50m away',
          preferred_gender: 'Female only', is_available: 1,
          description: 'Spacious 2-sharing room in Abhilata Building, just 5 minutes walk from RCPIT main gate. Clean washroom, 24/7 water supply.',
          owner_name: 'Maya Patel', owner_avatar: '🌸', owner_verified: 1
        },
        {
          id: 2, user_id: 3, title: 'Ajinkya Apartment – Spacious Room for Boys',
          location: 'Nimzari Naka, Shirpur', budget: 5500, room_type: 'Shared 2-sharing',
          amenities: 'WiFi, Bike Parking, Attached Bathroom, RO Drinking Water',
          preferred_gender: 'Male only', is_available: 1,
          description: 'Second floor well-ventilated apartment room with attached washroom. Quiet atmosphere suitable for studying and project work.',
          owner_name: 'Ajinkya Patil', owner_avatar: '🎨', owner_verified: 1
        },
        {
          id: 3, user_id: 4, title: 'Asusde Residency – 1 Room in 2-BHK Flat',
          location: 'College Road, Shirpur', budget: 6000, room_type: '1 BHK',
          amenities: 'Furnished, Refrigerator, RO Water, High-speed WiFi, Covered Parking',
          preferred_gender: 'Female only', is_available: 1,
          description: 'Single occupancy room available in a premium 2-BHK apartment near College Road. Fully setup kitchen, peaceful surroundings.',
          owner_name: 'Samira Kulkarni', owner_avatar: '🐱', owner_verified: 1
        },
        {
          id: 4, user_id: 5, title: 'Gadhe Villa – Budget Friendly Boys Accommodation',
          location: 'Subhash Nagar, Shirpur', budget: 5000, room_type: 'Shared 3-sharing',
          amenities: 'WiFi, Hot Water Geyser, Individual Wardrobes, Power Backup',
          preferred_gender: 'Male only', is_available: 1,
          description: 'Affordable shared accommodation with friendly college mates. Regular cleaning, quiet study hours from 10 PM onwards.',
          owner_name: 'Rohan Gaikwad', owner_avatar: '🏀', owner_verified: 1
        }
      ];
      localStorage.setItem('rf_local_listings', JSON.stringify(localListings));
    }

    let localMessages = JSON.parse(localStorage.getItem('rf_local_messages') || '[]');
    let localFavorites = JSON.parse(localStorage.getItem('rf_local_favorites') || '[]');
    let localReports = JSON.parse(localStorage.getItem('rf_local_reports') || '[]');

    // Auth endpoints
    if (endpoint.startsWith('/auth/login')) {
      const emailOrPrn = (body.emailOrPrn || '').trim().toLowerCase();
      const password = body.password;
      const user = localUsers.find(u => (u.email.toLowerCase() === emailOrPrn || (u.prn && u.prn.toLowerCase() === emailOrPrn)));
      if (!user || user.password !== password) {
        throw new Error('Invalid email/PRN or password');
      }
      const token = 'local-jwt-token-' + user.id;
      const { password: _, ...safeUser } = user;
      return { success: true, message: 'Login successful', token, user: safeUser };
    }

    if (endpoint.startsWith('/auth/register')) {
      const email = (body.email || '').toLowerCase().trim();
      if (localUsers.find(u => u.email.toLowerCase() === email)) {
        throw new Error('Email is already registered');
      }
      const newId = Date.now();
      const avatars = ['🌟', '🎒', '✨', '☕', '🚀', '🌿', '🎧', '📚', '🎯'];
      const newUser = {
        id: newId,
        email,
        password: body.password,
        full_name: body.full_name,
        prn: body.prn || '',
        gender: body.gender || 'Prefer not to say',
        age: Number(body.age) || 20,
        department: body.department || 'Computer Engineering',
        year_of_study: 'Third Year',
        location: 'Shirpur',
        budget: Number(body.budget) || 5000,
        food_pref: 'Pure Veg',
        sleep_pref: 'Flexible / Moderate',
        study_pref: 'Quiet Solo Study',
        lifestyle_pref: 'Neat & Organized',
        bio: 'Student at RCPIT Shirpur.',
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        is_verified: email.endsWith('@rcpit.ac.in') ? 1 : 0,
        is_admin: 0
      };
      localUsers.push(newUser);
      localStorage.setItem('rf_local_users', JSON.stringify(localUsers));
      const token = 'local-jwt-token-' + newId;
      const { password: _, ...safeUser } = newUser;
      return { success: true, message: 'Registration successful', token, user: safeUser };
    }

    if (endpoint.startsWith('/auth/me')) {
      if (currentUser) return { success: true, user: currentUser };
      throw new Error('Not authenticated');
    }

    // Stats endpoint
    if (endpoint.startsWith('/stats')) {
      return {
        success: true,
        stats: {
          totalStudents: localUsers.length,
          totalListings: localListings.length,
          availableListings: localListings.filter(l => l.is_available).length,
          verifiedStudents: localUsers.filter(u => u.is_verified).length,
          totalFavorites: localFavorites.length,
          totalMessages: localMessages.length
        }
      };
    }

    // Profiles endpoints
    if (endpoint.startsWith('/profiles/verify') && method === 'POST') {
      if (currentUser) {
        currentUser.prn = body.prn;
        currentUser.is_verified = 1;
        localStorage.setItem('rf_user', JSON.stringify(currentUser));
        const idx = localUsers.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          localUsers[idx].prn = body.prn;
          localUsers[idx].is_verified = 1;
          localStorage.setItem('rf_local_users', JSON.stringify(localUsers));
        }
        return { success: true, message: 'Student credentials verified!', user: currentUser };
      }
    }

    if (endpoint.startsWith('/profiles/me') && method === 'PUT') {
      if (currentUser) {
        Object.assign(currentUser, body);
        localStorage.setItem('rf_user', JSON.stringify(currentUser));
        const idx = localUsers.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) {
          Object.assign(localUsers[idx], body);
          localStorage.setItem('rf_local_users', JSON.stringify(localUsers));
        }
        return { success: true, message: 'Profile updated', user: currentUser };
      }
    }

    if (endpoint.startsWith('/profiles')) {
      let peers = localUsers.filter(u => !currentUser || u.id !== currentUser.id);
      try {
        const url = new URL('http://dummy' + endpoint);
        const gender = url.searchParams.get('gender');
        if (gender && gender !== 'All' && gender !== 'all') {
          peers = peers.filter(p => (p.gender || '').toLowerCase() === gender.toLowerCase());
        }
      } catch (e) {}

      const scored = peers.map(p => {
        const comp = calculateClientCompatibility(currentUser || { budget: 5000, location: 'Shirpur' }, p);
        return { ...p, compatibilityScore: comp.score, compatibilityBreakdown: comp.breakdown };
      });
      return { success: true, count: scored.length, profiles: scored };
    }

    // Listings endpoints
    if (endpoint.startsWith('/listings/my')) {
      const my = localListings.filter(l => currentUser && l.user_id === currentUser.id);
      return { success: true, listings: my };
    }

    if (endpoint.startsWith('/listings') && method === 'POST') {
      const newListing = {
        id: Date.now(),
        user_id: currentUser ? currentUser.id : 2,
        title: body.title,
        location: body.location,
        budget: Number(body.budget),
        room_type: body.room_type,
        preferred_gender: body.preferred_gender || 'Any',
        amenities: body.amenities || '',
        description: body.description || '',
        is_available: 1,
        owner_name: currentUser ? currentUser.full_name : 'RCPIT Student',
        owner_avatar: currentUser ? currentUser.avatar : '🏠',
        owner_verified: currentUser ? currentUser.is_verified : 1
      };
      localListings.unshift(newListing);
      localStorage.setItem('rf_local_listings', JSON.stringify(localListings));
      return { success: true, listing: newListing };
    }

    if (endpoint.includes('/availability') && method === 'PATCH') {
      const match = endpoint.match(/\/listings\/(\d+)\/availability/);
      if (match) {
        const id = Number(match[1]);
        const item = localListings.find(l => l.id === id);
        if (item) item.is_available = item.is_available ? 0 : 1;
        localStorage.setItem('rf_local_listings', JSON.stringify(localListings));
        return { success: true, is_available: item ? item.is_available : 1 };
      }
    }

    if (endpoint.startsWith('/listings') && method === 'GET') {
      let resListings = localListings;
      try {
        const url = new URL('http://dummy' + endpoint);
        const gender = url.searchParams.get('gender');
        if (gender && gender !== 'All' && gender !== 'all') {
          if (gender.toLowerCase().includes('female') || gender.toLowerCase().includes('girl')) {
            resListings = resListings.filter(l => (l.preferred_gender || '').toLowerCase().includes('female') || (l.preferred_gender || '').toLowerCase() === 'any');
          } else if (gender.toLowerCase().includes('male') || gender.toLowerCase().includes('boy')) {
            resListings = resListings.filter(l => (l.preferred_gender || '').toLowerCase().includes('male') || (l.preferred_gender || '').toLowerCase() === 'any');
          }
        }
      } catch (e) {}
      return { success: true, count: resListings.length, listings: resListings };
    }

    // Favorites endpoints
    if (endpoint.startsWith('/favorites/ids')) {
      return { success: true, favoriteIds: localFavorites };
    }

    if (endpoint.startsWith('/favorites') && method === 'POST') {
      if (!localFavorites.includes(body.listing_id)) {
        localFavorites.push(body.listing_id);
        localStorage.setItem('rf_local_favorites', JSON.stringify(localFavorites));
      }
      return { success: true, isFavorited: true };
    }

    if (endpoint.startsWith('/favorites/') && method === 'DELETE') {
      const match = endpoint.match(/\/favorites\/(\d+)/);
      if (match) {
        const id = Number(match[1]);
        localFavorites = localFavorites.filter(fid => fid !== id);
        localStorage.setItem('rf_local_favorites', JSON.stringify(localFavorites));
      }
      return { success: true, isFavorited: false };
    }

    if (endpoint.startsWith('/favorites') && method === 'GET') {
      const favListings = localListings.filter(l => localFavorites.includes(l.id));
      return { success: true, count: favListings.length, favorites: favListings };
    }

    // Messages endpoints
    if (endpoint.startsWith('/messages/unread-count')) {
      return { success: true, unreadCount: 1 };
    }

    if (endpoint.startsWith('/messages/conversations')) {
      const partner = localUsers.find(u => !currentUser || u.id !== currentUser.id) || localUsers[1];
      return {
        success: true,
        conversations: [
          {
            partner_id: partner.id,
            partner_name: partner.full_name,
            partner_avatar: partner.avatar,
            partner_verified: partner.is_verified,
            last_message: 'Hi! Is the room still available for this semester?',
            last_message_time: new Date().toISOString(),
            unread_count: 0
          }
        ]
      };
    }

    if (endpoint.startsWith('/messages/thread')) {
      const match = endpoint.match(/\/messages\/thread\/(\d+)/);
      const partnerId = match ? Number(match[1]) : 2;
      const partner = localUsers.find(u => u.id === partnerId) || localUsers[1];
      const thread = localMessages.filter(m => (m.sender_id === partnerId || m.receiver_id === partnerId));
      if (thread.length === 0) {
        thread.push({
          id: 1, sender_id: partner.id, receiver_id: currentUser ? currentUser.id : 1,
          message_text: 'Hi! Is the room still available for this semester?',
          is_read: 1, created_at: new Date(Date.now() - 3600000).toISOString()
        });
      }
      return { success: true, partner, messages: thread };
    }

    if (endpoint.startsWith('/messages') && method === 'POST') {
      const newMsg = {
        id: Date.now(),
        sender_id: currentUser ? currentUser.id : 1,
        receiver_id: Number(body.receiver_id),
        message_text: body.message_text,
        is_read: 0,
        created_at: new Date().toISOString()
      };
      localMessages.push(newMsg);
      localStorage.setItem('rf_local_messages', JSON.stringify(localMessages));
      return { success: true, message: 'Message sent', data: newMsg };
    }

    // Reports
    if (endpoint.startsWith('/reports') && method === 'POST') {
      localReports.push({ id: Date.now(), ...body, status: 'pending', created_at: new Date().toISOString() });
      localStorage.setItem('rf_local_reports', JSON.stringify(localReports));
      return { success: true, message: 'Report submitted for review.' };
    }

    return { success: true };
  }

  async function apiRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      let res;
      try {
        res = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers
        });
      } catch (fetchErr) {
        // If relative /api failed and on local dev host, try absolute localhost:3000
        if (API_BASE !== 'http://127.0.0.1:3000/api' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          try {
            res = await fetch(`http://127.0.0.1:3000/api${endpoint}`, {
              ...options,
              headers
            });
            if (res) API_BASE = 'http://127.0.0.1:3000/api';
          } catch (retryErr) {
            // port 3000 not reachable, proceed to fallback
          }
        }
        if (!res) {
          console.warn(`Backend server unreachable. Using fallback for ${endpoint}`);
          return handleStaticFallback(endpoint, options);
        }
      }

      // If a static server responded with 405 Method Not Allowed or 404 Not Found
      if (res.status === 405 || (res.status === 404 && API_BASE === '/api')) {
        if (API_BASE !== 'http://127.0.0.1:3000/api' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          try {
            const retryRes = await fetch(`http://127.0.0.1:3000/api${endpoint}`, {
              ...options,
              headers
            });
            if (retryRes && retryRes.ok) {
              API_BASE = 'http://127.0.0.1:3000/api';
              return await retryRes.json();
            }
          } catch (e) {
            // port 3000 not reachable
          }
        }
        console.warn(`Host returned status ${res.status} on ${endpoint}. Using fallback.`);
        return handleStaticFallback(endpoint, options);
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' || (err.message && err.message.includes('405'))) {
        return handleStaticFallback(endpoint, options);
      }
      console.warn(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // ==========================================================================
  // 5. Navigation & View Routing
  // ==========================================================================
  function switchView(viewName, updateHash = true) {
    // If dashboard requires auth and user is logged out, show login modal
    if (viewName === 'dashboard' && !currentUser) {
      openAuthModal('login');
      showToast('Please sign in to access your student dashboard.', 'info');
      return;
    }

    viewSections.forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (updateHash && window.location.hash !== `#${viewName}`) {
      window.location.hash = viewName;
    }

    if (navMenu.classList.contains('open')) {
      navMenu.classList.remove('open');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Refresh view specific data
    if (viewName === 'search') {
      loadProfiles();
    } else if (viewName === 'listings') {
      loadListings();
    } else if (viewName === 'girls') {
      loadGirlsSection();
    } else if (viewName === 'boys') {
      loadBoysSection();
    } else if (viewName === 'dashboard') {
      loadDashboardData();
    } else if (viewName === 'home') {
      loadStats();
    }
  }

  function handleHashRouting() {
    const hash = window.location.hash.replace('#', '').trim().toLowerCase();
    if (['home', 'search', 'listings', 'dashboard', 'girls', 'boys'].includes(hash)) {
      switchView(hash, false);
    } else {
      switchView('home', false);
    }
  }

  window.addEventListener('hashchange', handleHashRouting);

  // Delegate data-view clicks across the entire document
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-view]');
    if (trigger) {
      e.preventDefault();
      const targetView = trigger.getAttribute('data-view');
      if (targetView) switchView(targetView);
    }
  });

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });
  }

  // ==========================================================================
  // 6. Authentication Handling
  // ==========================================================================
  function updateAuthUI() {
    if (currentUser) {
      navDashboardLink.classList.remove('hidden');
      navAuthContainer.innerHTML = `
        <div class="user-profile-badge" id="nav-user-dropdown" title="Open Student Dashboard">
          <span class="user-badge-avatar">${currentUser.avatar || '👤'}</span>
          <span>${escapeHtml(currentUser.full_name.split(' ')[0])}</span>
        </div>
      `;

      const userBadge = document.getElementById('nav-user-dropdown');
      if (userBadge) {
        userBadge.addEventListener('click', () => switchView('dashboard'));
      }

      if (authHintBanner) authHintBanner.classList.add('hidden');
      loadUnreadCount();
      loadFavoriteIds();
    } else {
      navDashboardLink.classList.add('hidden');
      navAuthContainer.innerHTML = `
        <button class="btn btn-primary btn-sm" id="nav-login-btn">Sign In / Register</button>
      `;

      const loginBtn = document.getElementById('nav-login-btn');
      if (loginBtn) {
        loginBtn.addEventListener('click', () => openAuthModal('login'));
      }

      if (authHintBanner) authHintBanner.classList.remove('hidden');
    }
  }

  function openAuthModal(initialTab = 'login') {
    authAlert.classList.add('hidden');
    if (initialTab === 'register') {
      tabBtnRegister.classList.add('active');
      tabBtnLogin.classList.remove('active');
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    } else {
      tabBtnLogin.classList.add('active');
      tabBtnRegister.classList.remove('active');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    }
    authModal.classList.remove('hidden');
  }

  function closeAuthModal() {
    authModal.classList.add('hidden');
  }

  tabBtnLogin.addEventListener('click', () => {
    tabBtnLogin.classList.add('active');
    tabBtnRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  tabBtnRegister.addEventListener('click', () => {
    tabBtnRegister.classList.add('active');
    tabBtnLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  authModalClose.addEventListener('click', closeAuthModal);
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  const hintLoginBtn = document.getElementById('hint-login-btn');
  if (hintLoginBtn) {
    hintLoginBtn.addEventListener('click', () => openAuthModal('login'));
  }

  // Login form submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailOrPrn = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      authAlert.classList.add('hidden');
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrPrn, password })
      });

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('rf_token', authToken);
      localStorage.setItem('rf_user', JSON.stringify(currentUser));

      closeAuthModal();
      updateAuthUI();
      showToast(`Welcome back, ${currentUser.full_name}!`, 'success');
      switchView('dashboard');
    } catch (err) {
      authAlert.textContent = err.message || 'Login failed. Please check credentials.';
      authAlert.className = 'alert alert-danger';
      authAlert.classList.remove('hidden');
    }
  });

  // 1-Click Demo Database Login
  document.querySelectorAll('.demo-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-demo-email');
      const pass = btn.getAttribute('data-demo-pass');
      if (email && pass) {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        if (emailInput && passInput) {
          emailInput.value = email;
          passInput.value = pass;
          showToast(`Loaded demo credentials for ${email}. Signing in...`, 'info');
          loginForm.requestSubmit();
        }
      }
    });
  });

  // Register form submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const prn = document.getElementById('reg-prn').value;
    const gender = document.getElementById('reg-gender').value;
    const age = document.getElementById('reg-age').value;
    const department = document.getElementById('reg-dept').value;
    const budget = document.getElementById('reg-budget').value;

    try {
      authAlert.classList.add('hidden');
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name, email, password, prn, gender, age, department, budget
        })
      });

      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('rf_token', authToken);
      localStorage.setItem('rf_user', JSON.stringify(currentUser));

      closeAuthModal();
      updateAuthUI();
      showToast('Account registered successfully! Welcome to Roommate Finder.', 'success');
      switchView('dashboard');
    } catch (err) {
      authAlert.textContent = err.message || 'Registration failed.';
      authAlert.className = 'alert alert-danger';
      authAlert.classList.remove('hidden');
    }
  });

  // Logout handler
  function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('rf_token');
    localStorage.removeItem('rf_user');
    favoriteListingIds.clear();
    updateAuthUI();
    showToast('You have been logged out.', 'info');
    switchView('home');
  }

  dashLogoutBtn.addEventListener('click', handleLogout);

  // ==========================================================================
  // 7. Live Statistics
  // ==========================================================================
  async function loadStats() {
    try {
      const data = await apiRequest('/stats');
      if (data && data.stats) {
        statStudents.textContent = data.stats.totalStudents || '0';
        statListings.textContent = data.stats.totalListings || '0';
        statVerified.textContent = data.stats.verifiedStudents || '0';
        statMessages.textContent = data.stats.totalMessages || '0';
      }
    } catch (err) {
      // Fallback display
      statStudents.textContent = '7+';
      statListings.textContent = '6+';
      statVerified.textContent = '5+';
      statMessages.textContent = '10+';
    }
  }

  // ==========================================================================
  // 8. Roommate Search & Multi-Filters
  // ==========================================================================
  async function loadProfiles() {
    resultsCount.textContent = 'Loading roommates...';
    roommatesGrid.innerHTML = '';
    noResultsBox.classList.add('hidden');

    const params = new URLSearchParams();
    if (filterKeyword.value.trim()) params.append('keyword', filterKeyword.value.trim());
    if (filterLocation.value !== 'all') params.append('location', filterLocation.value);
    if (filterGender.value !== 'all') params.append('gender', filterGender.value);
    if (filterFood.value !== 'all') params.append('food', filterFood.value);
    if (filterSleep.value !== 'all') params.append('sleep', filterSleep.value);
    if (filterStudy.value !== 'all') params.append('study', filterStudy.value);
    if (filterLifestyle.value !== 'all') params.append('lifestyle', filterLifestyle.value);
    if (filterVerified.checked) params.append('verifiedOnly', 'true');
    params.append('maxBudget', filterBudget.value);
    params.append('sortBy', filterSort.value);

    try {
      const data = await apiRequest(`/profiles?${params.toString()}`);
      cachedProfiles = data.profiles || [];
      renderRoommateCards(cachedProfiles);
    } catch (err) {
      resultsCount.textContent = 'Error loading roommates.';
      showToast('Could not fetch roommate profiles from server.', 'error');
    }
  }

  function renderRoommateCards(profiles, targetGrid = roommatesGrid, targetEmpty = noResultsBox, targetCount = resultsCount) {
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    if (profiles.length === 0) {
      targetGrid.classList.add('hidden');
      if (targetEmpty) targetEmpty.classList.remove('hidden');
      if (targetCount) targetCount.textContent = '0 roommates found matching filters.';
      return;
    }

    targetGrid.classList.remove('hidden');
    if (targetEmpty) targetEmpty.classList.add('hidden');
    if (targetCount) targetCount.textContent = `Showing ${profiles.length} available ${profiles.length === 1 ? 'roommate' : 'roommates'}`;

    profiles.forEach(profile => {
      const card = document.createElement('div');
      card.className = 'roommate-card';

      const compScore = profile.compatibilityScore || 75;
      let scoreClass = '';
      if (compScore < 60) scoreClass = 'lower';
      else if (compScore < 80) scoreClass = 'medium';

      card.innerHTML = `
        <div class="card-top">
          <div class="card-avatar">${profile.avatar || '👤'}</div>
          <div class="card-title-group">
            <h3>
              ${escapeHtml(profile.full_name)}, ${profile.age || 20}
              ${profile.is_verified ? '<span class="badge-verified" title="Verified RCPIT Student PRN">✓ Verified</span>' : ''}
            </h3>
            <span class="card-location">📍 ${escapeHtml(profile.location || 'Shirpur')}</span>
          </div>
        </div>

        <div class="card-meta-row">
          <span class="tag tag-budget">₹${(profile.budget || 5000).toLocaleString()}/mo</span>
          <div class="match-score-pill ${scoreClass}">
            <span>${compScore}%</span> Match
          </div>
        </div>

        <div class="card-pills">
          <span class="tag">🥗 ${escapeHtml(profile.food_pref || 'Any')}</span>
          <span class="tag">🌙 ${escapeHtml(profile.sleep_pref || 'Flexible')}</span>
          <span class="tag">📚 ${escapeHtml(profile.study_pref || 'Solo Study')}</span>
        </div>

        <p class="card-bio">${escapeHtml(profile.bio || 'Looking for roommate near RCPIT campus.')}</p>

        <div class="card-footer">
          <button class="btn btn-outline btn-sm flex-1 view-profile-btn" data-id="${profile.id}">
            View Details
          </button>
          <button class="btn btn-primary btn-sm msg-peer-btn" data-id="${profile.id}" data-name="${escapeHtml(profile.full_name)}">
            ✉️ Message
          </button>
        </div>
      `;

      card.querySelector('.view-profile-btn').addEventListener('click', () => openProfileModal(profile));
      card.querySelector('.msg-peer-btn').addEventListener('click', () => openMessageModal(profile.id, profile.full_name));

      targetGrid.appendChild(card);
    });
  }

  // Filter event listeners
  [filterKeyword, filterLocation, filterGender, filterSort, filterFood, filterSleep, filterStudy, filterLifestyle, filterVerified].forEach(el => {
    el.addEventListener('change', loadProfiles);
    if (el.tagName === 'INPUT' && el.type === 'text') {
      let debounce;
      el.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(loadProfiles, 300);
      });
    }
  });

  filterBudget.addEventListener('input', (e) => {
    budgetValueDisplay.textContent = `₹${parseInt(e.target.value).toLocaleString()}/mo`;
    loadProfiles();
  });

  function resetAllFilters() {
    filterKeyword.value = '';
    filterLocation.value = 'all';
    filterGender.value = 'all';
    filterFood.value = 'all';
    filterSleep.value = 'all';
    filterStudy.value = 'all';
    filterLifestyle.value = 'all';
    filterVerified.checked = false;
    filterBudget.value = 10000;
    filterSort.value = 'compatibility';
    budgetValueDisplay.textContent = '₹10,000/mo';
    loadProfiles();
  }

  resetFiltersBtn.addEventListener('click', resetAllFilters);
  noResultsResetBtn.addEventListener('click', resetAllFilters);

  // ==========================================================================
  // 9. Room Listings Management & View
  // ==========================================================================
  async function loadListings() {
    listingsResultsCount.textContent = 'Loading listings...';
    listingsGrid.innerHTML = '';
    noListingsBox.classList.add('hidden');

    const params = new URLSearchParams();
    if (listingFilterKeyword.value.trim()) params.append('keyword', listingFilterKeyword.value.trim());
    if (listingFilterType.value !== 'all') params.append('roomType', listingFilterType.value);
    if (listingFilterGender.value !== 'all') params.append('gender', listingFilterGender.value);
    params.append('sortBy', listingFilterSort.value);

    try {
      const data = await apiRequest(`/listings?${params.toString()}`);
      cachedListings = data.listings || [];
      renderListingCards(cachedListings);
    } catch (err) {
      listingsResultsCount.textContent = 'Error loading listings.';
      showToast('Could not fetch room listings.', 'error');
    }
  }

  function renderListingCards(listings, targetGrid = listingsGrid, targetEmpty = noListingsBox, targetCount = listingsResultsCount) {
    if (!targetGrid) return;
    targetGrid.innerHTML = '';

    if (listings.length === 0) {
      targetGrid.classList.add('hidden');
      if (targetEmpty) targetEmpty.classList.remove('hidden');
      if (targetCount) targetCount.textContent = '0 room listings found.';
      return;
    }

    targetGrid.classList.remove('hidden');
    if (targetEmpty) targetEmpty.classList.add('hidden');
    if (targetCount) targetCount.textContent = `Showing ${listings.length} available room ${listings.length === 1 ? 'listing' : 'listings'}`;

    listings.forEach(listing => {
      const card = document.createElement('div');
      card.className = 'listing-card';

      const isFav = favoriteListingIds.has(listing.id);
      const isOwner = currentUser && currentUser.id === listing.user_id;

      card.innerHTML = `
        <div class="card-top">
          <div class="card-avatar">${listing.owner_avatar || '🏠'}</div>
          <div class="card-title-group">
            <h3>${escapeHtml(listing.title)}</h3>
            <span class="card-location">📍 ${escapeHtml(listing.location)}</span>
          </div>
          <button class="btn-favorite ${isFav ? 'is-fav' : ''}" data-id="${listing.id}" title="${isFav ? 'Remove Favorite' : 'Save Favorite'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>

        <div class="card-meta-row">
          <span class="tag tag-budget">₹${listing.budget.toLocaleString()}/mo</span>
          <span class="${listing.is_available ? 'tag-available' : 'tag-occupied'}">
            ${listing.is_available ? '✓ Available' : '❌ Occupied'}
          </span>
        </div>

        <div class="card-pills">
          <span class="tag">🏠 ${escapeHtml(listing.room_type)}</span>
          <span class="tag">👥 Prefers: ${escapeHtml(listing.preferred_gender || 'Any')}</span>
          ${listing.owner_verified ? '<span class="badge-verified">✓ Verified Host</span>' : ''}
        </div>

        <p class="card-bio">${escapeHtml(listing.description || 'Shared accommodation near campus.')}</p>

        <div class="card-footer">
          <button class="btn btn-outline btn-sm flex-1 view-listing-btn" data-id="${listing.id}">
            View Details
          </button>
          ${!isOwner ? `
            <button class="btn btn-primary btn-sm contact-host-btn" data-user="${listing.user_id}" data-listing="${listing.id}" data-name="${escapeHtml(listing.owner_name)}">
              ✉️ Contact Host
            </button>
          ` : `
            <button class="btn btn-secondary btn-sm" disabled>Your Listing</button>
          `}
        </div>
      `;

      // Event listeners
      card.querySelector('.btn-favorite').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(listing.id);
      });

      card.querySelector('.view-listing-btn').addEventListener('click', () => {
        // Open modal showing listing & host info
        openProfileModal({
          id: listing.user_id,
          full_name: listing.owner_name,
          location: listing.location,
          budget: listing.budget,
          avatar: listing.owner_avatar,
          is_verified: listing.owner_verified,
          gender: listing.preferred_gender,
          department: listing.owner_department || 'Host Student',
          food_pref: listing.food_pref || 'Flexible',
          sleep_pref: listing.sleep_pref || 'Flexible',
          study_pref: listing.study_pref || 'Flexible',
          bio: `${listing.title}\n\n${listing.description}\n\nAmenities: ${listing.amenities || 'Standard'}`
        });
      });

      const contactBtn = card.querySelector('.contact-host-btn');
      if (contactBtn) {
        contactBtn.addEventListener('click', () => {
          openMessageModal(listing.user_id, listing.owner_name, listing.id);
        });
      }

      targetGrid.appendChild(card);
    });
  }

  [listingFilterKeyword, listingFilterType, listingFilterGender, listingFilterSort].forEach(el => {
    el.addEventListener('change', loadListings);
    if (el.tagName === 'INPUT') {
      let debounce;
      el.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(loadListings, 300);
      });
    }
  });

  noListingsResetBtn.addEventListener('click', () => {
    listingFilterKeyword.value = '';
    listingFilterType.value = 'all';
    listingFilterGender.value = 'all';
    listingFilterSort.value = 'newest';
    loadListings();
  });

  // ==========================================================================
  // 9b. Girls Section & Boys Section Handlers
  // ==========================================================================
  const girlsRoommatesGrid = document.getElementById('girls-roommates-grid');
  const girlsRoommatesEmpty = document.getElementById('girls-roommates-empty');
  const girlsRoommatesCount = document.getElementById('girls-roommates-count');
  const girlsListingsGrid = document.getElementById('girls-listings-grid');
  const girlsListingsEmpty = document.getElementById('girls-listings-empty');
  const girlsListingsCount = document.getElementById('girls-listings-count');
  const girlsRoommatesContainer = document.getElementById('girls-roommates-container');
  const girlsListingsContainer = document.getElementById('girls-listings-container');
  const girlsTabRoommatesBtn = document.getElementById('girls-tab-roommates-btn');
  const girlsTabListingsBtn = document.getElementById('girls-tab-listings-btn');
  const girlsPostBtn = document.getElementById('girls-post-btn');
  const girlsFilterKeyword = document.getElementById('girls-filter-keyword');
  const girlsFilterLocation = document.getElementById('girls-filter-location');
  const girlsFilterFood = document.getElementById('girls-filter-food');
  const girlsFilterBudget = document.getElementById('girls-filter-budget');
  const girlsBudgetDisplay = document.getElementById('girls-budget-display');
  const girlsFilterVerified = document.getElementById('girls-filter-verified');
  const girlsResetFilterBtn = document.getElementById('girls-reset-filter-btn');

  const boysRoommatesGrid = document.getElementById('boys-roommates-grid');
  const boysRoommatesEmpty = document.getElementById('boys-roommates-empty');
  const boysRoommatesCount = document.getElementById('boys-roommates-count');
  const boysListingsGrid = document.getElementById('boys-listings-grid');
  const boysListingsEmpty = document.getElementById('boys-listings-empty');
  const boysListingsCount = document.getElementById('boys-listings-count');
  const boysRoommatesContainer = document.getElementById('boys-roommates-container');
  const boysListingsContainer = document.getElementById('boys-listings-container');
  const boysTabRoommatesBtn = document.getElementById('boys-tab-roommates-btn');
  const boysTabListingsBtn = document.getElementById('boys-tab-listings-btn');
  const boysPostBtn = document.getElementById('boys-post-btn');
  const boysFilterKeyword = document.getElementById('boys-filter-keyword');
  const boysFilterLocation = document.getElementById('boys-filter-location');
  const boysFilterSleep = document.getElementById('boys-filter-sleep');
  const boysFilterBudget = document.getElementById('boys-filter-budget');
  const boysBudgetDisplay = document.getElementById('boys-budget-display');
  const boysFilterVerified = document.getElementById('boys-filter-verified');
  const boysResetFilterBtn = document.getElementById('boys-reset-filter-btn');

  async function loadGirlsSection() {
    // 1. Fetch female roommates
    const profileParams = new URLSearchParams();
    profileParams.append('gender', 'Female');
    if (girlsFilterKeyword && girlsFilterKeyword.value.trim()) profileParams.append('keyword', girlsFilterKeyword.value.trim());
    if (girlsFilterLocation && girlsFilterLocation.value !== 'All') profileParams.append('location', girlsFilterLocation.value);
    if (girlsFilterFood && girlsFilterFood.value !== 'All') profileParams.append('food_pref', girlsFilterFood.value);
    if (girlsFilterBudget) profileParams.append('maxBudget', girlsFilterBudget.value);
    if (girlsFilterVerified && girlsFilterVerified.checked) profileParams.append('is_verified', '1');

    try {
      const data = await apiRequest(`/profiles?${profileParams.toString()}`);
      const profiles = (data.profiles || []).filter(p => (p.gender || '').toLowerCase() === 'female');
      if (girlsRoommatesCount) girlsRoommatesCount.textContent = profiles.length;
      renderRoommateCards(profiles, girlsRoommatesGrid, girlsRoommatesEmpty, null);
    } catch (err) {
      console.error('Error fetching girls profiles:', err);
    }

    // 2. Fetch girls room listings
    const listingParams = new URLSearchParams();
    listingParams.append('gender', 'Female');
    if (girlsFilterKeyword && girlsFilterKeyword.value.trim()) listingParams.append('keyword', girlsFilterKeyword.value.trim());
    if (girlsFilterLocation && girlsFilterLocation.value !== 'All') listingParams.append('location', girlsFilterLocation.value);
    if (girlsFilterBudget) listingParams.append('max_budget', girlsFilterBudget.value);

    try {
      const data = await apiRequest(`/listings?${listingParams.toString()}`);
      const listings = (data.listings || []).filter(l => (l.preferred_gender || '').toLowerCase().includes('female') || (l.preferred_gender || '').toLowerCase() === 'any');
      if (girlsListingsCount) girlsListingsCount.textContent = listings.length;
      renderListingCards(listings, girlsListingsGrid, girlsListingsEmpty, null);
    } catch (err) {
      console.error('Error fetching girls listings:', err);
    }
  }

  async function loadBoysSection() {
    // 1. Fetch male roommates
    const profileParams = new URLSearchParams();
    profileParams.append('gender', 'Male');
    if (boysFilterKeyword && boysFilterKeyword.value.trim()) profileParams.append('keyword', boysFilterKeyword.value.trim());
    if (boysFilterLocation && boysFilterLocation.value !== 'All') profileParams.append('location', boysFilterLocation.value);
    if (boysFilterSleep && boysFilterSleep.value !== 'All') profileParams.append('sleep_pref', boysFilterSleep.value);
    if (boysFilterBudget) profileParams.append('maxBudget', boysFilterBudget.value);
    if (boysFilterVerified && boysFilterVerified.checked) profileParams.append('is_verified', '1');

    try {
      const data = await apiRequest(`/profiles?${profileParams.toString()}`);
      const profiles = (data.profiles || []).filter(p => (p.gender || '').toLowerCase() === 'male');
      if (boysRoommatesCount) boysRoommatesCount.textContent = profiles.length;
      renderRoommateCards(profiles, boysRoommatesGrid, boysRoommatesEmpty, null);
    } catch (err) {
      console.error('Error fetching boys profiles:', err);
    }

    // 2. Fetch boys room listings
    const listingParams = new URLSearchParams();
    listingParams.append('gender', 'Male');
    if (boysFilterKeyword && boysFilterKeyword.value.trim()) listingParams.append('keyword', boysFilterKeyword.value.trim());
    if (boysFilterLocation && boysFilterLocation.value !== 'All') listingParams.append('location', boysFilterLocation.value);
    if (boysFilterBudget) listingParams.append('max_budget', boysFilterBudget.value);

    try {
      const data = await apiRequest(`/listings?${listingParams.toString()}`);
      const listings = (data.listings || []).filter(l => (l.preferred_gender || '').toLowerCase().includes('male') || (l.preferred_gender || '').toLowerCase() === 'any');
      if (boysListingsCount) boysListingsCount.textContent = listings.length;
      renderListingCards(listings, boysListingsGrid, boysListingsEmpty, null);
    } catch (err) {
      console.error('Error fetching boys listings:', err);
    }
  }

  // Setup Girls & Boys subtabs
  if (girlsTabRoommatesBtn && girlsTabListingsBtn) {
    girlsTabRoommatesBtn.addEventListener('click', () => {
      girlsTabRoommatesBtn.classList.add('active', 'girls-tab-active');
      girlsTabListingsBtn.classList.remove('active', 'girls-tab-active');
      girlsRoommatesContainer.classList.remove('hidden');
      girlsListingsContainer.classList.add('hidden');
    });
    girlsTabListingsBtn.addEventListener('click', () => {
      girlsTabListingsBtn.classList.add('active', 'girls-tab-active');
      girlsTabRoommatesBtn.classList.remove('active', 'girls-tab-active');
      girlsListingsContainer.classList.remove('hidden');
      girlsRoommatesContainer.classList.add('hidden');
    });
  }

  if (boysTabRoommatesBtn && boysTabListingsBtn) {
    boysTabRoommatesBtn.addEventListener('click', () => {
      boysTabRoommatesBtn.classList.add('active', 'boys-tab-active');
      boysTabListingsBtn.classList.remove('active', 'boys-tab-active');
      boysRoommatesContainer.classList.remove('hidden');
      boysListingsContainer.classList.add('hidden');
    });
    boysTabListingsBtn.addEventListener('click', () => {
      boysTabListingsBtn.classList.add('active', 'boys-tab-active');
      boysTabRoommatesBtn.classList.remove('active', 'boys-tab-active');
      boysListingsContainer.classList.remove('hidden');
      boysRoommatesContainer.classList.add('hidden');
    });
  }

  // Girls filters listeners
  if (girlsFilterBudget && girlsBudgetDisplay) {
    girlsFilterBudget.addEventListener('input', () => {
      girlsBudgetDisplay.textContent = Number(girlsFilterBudget.value).toLocaleString();
      loadGirlsSection();
    });
  }
  [girlsFilterKeyword, girlsFilterLocation, girlsFilterFood, girlsFilterVerified].forEach(el => {
    if (el) {
      el.addEventListener('change', loadGirlsSection);
      if (el.tagName === 'INPUT' && el.type === 'text') {
        let debounce;
        el.addEventListener('input', () => {
          clearTimeout(debounce);
          debounce = setTimeout(loadGirlsSection, 300);
        });
      }
    }
  });
  if (girlsResetFilterBtn) {
    girlsResetFilterBtn.addEventListener('click', () => {
      if (girlsFilterKeyword) girlsFilterKeyword.value = '';
      if (girlsFilterLocation) girlsFilterLocation.value = 'All';
      if (girlsFilterFood) girlsFilterFood.value = 'All';
      if (girlsFilterBudget) {
        girlsFilterBudget.value = '10000';
        if (girlsBudgetDisplay) girlsBudgetDisplay.textContent = '10,000';
      }
      if (girlsFilterVerified) girlsFilterVerified.checked = true;
      loadGirlsSection();
    });
  }

  // Boys filters listeners
  if (boysFilterBudget && boysBudgetDisplay) {
    boysFilterBudget.addEventListener('input', () => {
      boysBudgetDisplay.textContent = Number(boysFilterBudget.value).toLocaleString();
      loadBoysSection();
    });
  }
  [boysFilterKeyword, boysFilterLocation, boysFilterSleep, boysFilterVerified].forEach(el => {
    if (el) {
      el.addEventListener('change', loadBoysSection);
      if (el.tagName === 'INPUT' && el.type === 'text') {
        let debounce;
        el.addEventListener('input', () => {
          clearTimeout(debounce);
          debounce = setTimeout(loadBoysSection, 300);
        });
      }
    }
  });
  if (boysResetFilterBtn) {
    boysResetFilterBtn.addEventListener('click', () => {
      if (boysFilterKeyword) boysFilterKeyword.value = '';
      if (boysFilterLocation) boysFilterLocation.value = 'All';
      if (boysFilterSleep) boysFilterSleep.value = 'All';
      if (boysFilterBudget) {
        boysFilterBudget.value = '10000';
        if (boysBudgetDisplay) boysBudgetDisplay.textContent = '10,000';
      }
      if (boysFilterVerified) boysFilterVerified.checked = false;
      loadBoysSection();
    });
  }

  // Girls & Boys Post Buttons
  if (girlsPostBtn) {
    girlsPostBtn.addEventListener('click', () => {
      if (!currentUser) {
        openAuthModal('login');
        showToast('Please sign in to post a listing.', 'info');
        return;
      }
      openListingModal();
      const prefGenderSelect = document.getElementById('listing-pref-gender');
      if (prefGenderSelect) prefGenderSelect.value = 'Female only';
    });
  }
  if (boysPostBtn) {
    boysPostBtn.addEventListener('click', () => {
      if (!currentUser) {
        openAuthModal('login');
        showToast('Please sign in to post a listing.', 'info');
        return;
      }
      openListingModal();
      const prefGenderSelect = document.getElementById('listing-pref-gender');
      if (prefGenderSelect) prefGenderSelect.value = 'Male only';
    });
  }

  // Section switcher pills on search and listings views
  document.querySelectorAll('.section-switch-pill[data-gender-choice]').forEach(pill => {
    pill.addEventListener('click', () => {
      const genderChoice = pill.getAttribute('data-gender-choice');
      const isSearchPill = pill.id.startsWith('search-pill');
      if (isSearchPill) {
        document.querySelectorAll('#view-search .section-switch-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (filterGender) {
          filterGender.value = genderChoice.toLowerCase() === 'all' ? 'all' : genderChoice;
          loadProfiles();
        }
      } else {
        document.querySelectorAll('#view-listings .section-switch-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (listingFilterGender) {
          if (genderChoice.toLowerCase() === 'all') listingFilterGender.value = 'all';
          else if (genderChoice.toLowerCase().includes('female')) listingFilterGender.value = 'Female only';
          else if (genderChoice.toLowerCase().includes('male')) listingFilterGender.value = 'Male only';
          loadListings();
        }
      }
    });
  });

  // ==========================================================================
  // 10. Favorites Management
  // ==========================================================================
  async function loadFavoriteIds() {
    if (!currentUser) return;
    try {
      const data = await apiRequest('/favorites/ids');
      if (data && data.favoriteIds) {
        favoriteListingIds = new Set(data.favoriteIds);
        dashFavCount.textContent = favoriteListingIds.size;
      }
    } catch (e) {
      console.warn('Could not fetch favorite IDs', e);
    }
  }

  async function toggleFavorite(listingId) {
    if (!currentUser) {
      openAuthModal('login');
      showToast('Please sign in to save favorite listings.', 'info');
      return;
    }

    const isFav = favoriteListingIds.has(listingId);
    try {
      if (isFav) {
        await apiRequest(`/favorites/${listingId}`, { method: 'DELETE' });
        favoriteListingIds.delete(listingId);
        showToast('Listing removed from favorites.', 'info');
      } else {
        await apiRequest('/favorites', {
          method: 'POST',
          body: JSON.stringify({ listing_id: listingId })
        });
        favoriteListingIds.add(listingId);
        showToast('Listing added to favorites! ❤️', 'success');
      }

      dashFavCount.textContent = favoriteListingIds.size;

      // Update UI button state if currently in listings or favorites view
      document.querySelectorAll(`.btn-favorite[data-id="${listingId}"]`).forEach(btn => {
        btn.classList.toggle('is-fav', !isFav);
        btn.innerHTML = !isFav ? '❤️' : '🤍';
      });

      const activeView = document.querySelector('.view-section.active');
      if (activeView && activeView.id === 'view-dashboard') {
        loadFavoritesTab();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update favorite', 'error');
    }
  }

  async function loadFavoritesTab() {
    if (!currentUser) return;
    favoritesGrid.innerHTML = '<p class="text-muted">Loading your favorites...</p>';

    try {
      const data = await apiRequest('/favorites');
      const favs = data.favorites || [];
      dashFavCount.textContent = favs.length;

      if (favs.length === 0) {
        favoritesGrid.innerHTML = `
          <div class="no-results" style="grid-column: 1 / -1;">
            <div class="no-results-icon">❤️</div>
            <h3>No favorites saved yet</h3>
            <p>Click the heart icon on any room listing to bookmark it here for quick access.</p>
            <button class="btn btn-primary btn-sm" data-view="listings">Browse Room Listings</button>
          </div>
        `;
        favoritesGrid.querySelector('button').addEventListener('click', () => switchView('listings'));
        return;
      }

      favoritesGrid.innerHTML = '';
      favs.forEach(listing => {
        const card = document.createElement('div');
        card.className = 'listing-card';
        card.innerHTML = `
          <div class="card-top">
            <div class="card-avatar">${listing.owner_avatar || '🏠'}</div>
            <div class="card-title-group">
              <h3>${escapeHtml(listing.title)}</h3>
              <span class="card-location">📍 ${escapeHtml(listing.location)}</span>
            </div>
            <button class="btn-favorite is-fav" data-id="${listing.id}" title="Remove Favorite">
              ❤️
            </button>
          </div>

          <div class="card-meta-row">
            <span class="tag tag-budget">₹${listing.budget.toLocaleString()}/mo</span>
            <span class="${listing.is_available ? 'tag-available' : 'tag-occupied'}">
              ${listing.is_available ? '✓ Available' : '❌ Occupied'}
            </span>
          </div>

          <p class="card-bio">${escapeHtml(listing.description || 'Shared student accommodation.')}</p>

          <div class="card-footer">
            <button class="btn btn-outline btn-sm flex-1 view-fav-btn" data-id="${listing.id}">
              View Listing
            </button>
            <button class="btn btn-danger btn-sm remove-fav-btn" data-id="${listing.id}">
              Remove
            </button>
          </div>
        `;

        card.querySelector('.remove-fav-btn').addEventListener('click', () => toggleFavorite(listing.id));
        card.querySelector('.btn-favorite').addEventListener('click', () => toggleFavorite(listing.id));
        card.querySelector('.view-fav-btn').addEventListener('click', () => {
          openProfileModal({
            id: listing.user_id,
            full_name: listing.owner_name,
            location: listing.location,
            budget: listing.budget,
            avatar: listing.owner_avatar,
            is_verified: listing.owner_verified,
            bio: `${listing.title}\n\n${listing.description}`
          });
        });

        favoritesGrid.appendChild(card);
      });
    } catch (err) {
      favoritesGrid.innerHTML = '<p class="text-danger">Failed to load saved favorites.</p>';
    }
  }

  // ==========================================================================
  // 11. Profile Modal & Compatibility Breakdown
  // ==========================================================================
  function openProfileModal(profile) {
    activeSelectedProfile = profile;

    modalAvatar.textContent = profile.avatar || '👤';
    modalName.textContent = `${profile.full_name}, ${profile.age || 20}`;
    modalLocation.textContent = `📍 ${profile.location || 'Shirpur'}`;
    modalBudget.textContent = `₹${(profile.budget || 5000).toLocaleString()}/mo`;
    modalGender.textContent = profile.gender || 'Any';
    modalDept.textContent = profile.department || 'RCPIT Student';
    modalFood.textContent = profile.food_pref || 'Any';
    modalSleep.textContent = profile.sleep_pref || 'Flexible';
    modalStudy.textContent = profile.study_pref || 'Flexible';
    modalBio.textContent = profile.bio || 'No bio provided.';

    if (profile.is_verified) {
      modalVerifiedBadge.classList.remove('hidden');
    } else {
      modalVerifiedBadge.classList.add('hidden');
    }

    // Render compatibility score & progress breakdown
    const compScore = profile.compatibilityScore || 82;
    modalCompScore.textContent = `${compScore}%`;

    const bd = profile.compatibilityBreakdown || {
      budget: 85, location: 80, food: 90, sleep: 75, study: 85, lifestyle: 80
    };

    modalCompBars.innerHTML = `
      <div class="comp-bar-item">
        <div class="comp-bar-label-row">
          <span>Budget Alignment</span>
          <strong>${bd.budget}%</strong>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width: ${bd.budget}%;"></div>
        </div>
      </div>

      <div class="comp-bar-item">
        <div class="comp-bar-label-row">
          <span>Location Match</span>
          <strong>${bd.location}%</strong>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width: ${bd.location}%;"></div>
        </div>
      </div>

      <div class="comp-bar-item">
        <div class="comp-bar-label-row">
          <span>Food Compatibility</span>
          <strong>${bd.food}%</strong>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width: ${bd.food}%;"></div>
        </div>
      </div>

      <div class="comp-bar-item">
        <div class="comp-bar-label-row">
          <span>Sleep Schedule</span>
          <strong>${bd.sleep}%</strong>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width: ${bd.sleep}%;"></div>
        </div>
      </div>

      <div class="comp-bar-item">
        <div class="comp-bar-label-row">
          <span>Study Habits</span>
          <strong>${bd.study}%</strong>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width: ${bd.study}%;"></div>
        </div>
      </div>

      <div class="comp-bar-item">
        <div class="comp-bar-label-row">
          <span>Lifestyle Vibe</span>
          <strong>${bd.lifestyle}%</strong>
        </div>
        <div class="comp-bar-track">
          <div class="comp-bar-fill" style="width: ${bd.lifestyle}%;"></div>
        </div>
      </div>
    `;

    modalContactBtn.textContent = `✉️ Send Message to ${profile.full_name.split(' ')[0]}`;
    profileModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeProfileModal() {
    profileModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  modalCloseBtn.addEventListener('click', closeProfileModal);
  modalDismissBtn.addEventListener('click', closeProfileModal);
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
  });

  modalContactBtn.addEventListener('click', () => {
    if (!activeSelectedProfile) return;
    const target = activeSelectedProfile;
    closeProfileModal();
    openMessageModal(target.id, target.full_name);
  });

  modalReportBtn.addEventListener('click', () => {
    if (!activeSelectedProfile) return;
    const target = activeSelectedProfile;
    closeProfileModal();
    openReportModal('user', target.id);
  });

  // ==========================================================================
  // 12. Direct Messaging & Chat Conversations
  // ==========================================================================
  function openMessageModal(recipientId, recipientName, listingId = null) {
    if (!currentUser) {
      openAuthModal('login');
      showToast('Please sign in to send messages.', 'info');
      return;
    }

    if (currentUser.id === Number(recipientId)) {
      showToast('You cannot send a message to yourself.', 'error');
      return;
    }

    msgRecipientId.value = recipientId;
    msgListingId.value = listingId || '';
    msgRecipientName.textContent = recipientName;
    document.getElementById('msg-text').value = '';
    messageModal.classList.remove('hidden');
  }

  function closeMessageModal() {
    messageModal.classList.add('hidden');
  }

  messageModalClose.addEventListener('click', closeMessageModal);
  msgCancelBtn.addEventListener('click', closeMessageModal);
  messageModal.addEventListener('click', (e) => {
    if (e.target === messageModal) closeMessageModal();
  });

  directMessageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const receiver_id = msgRecipientId.value;
    const listing_id = msgListingId.value || null;
    const message_text = document.getElementById('msg-text').value;

    try {
      await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id, message_text, listing_id })
      });

      closeMessageModal();
      showToast('Message sent successfully! 🚀', 'success');

      // Switch to dashboard messages tab
      switchView('dashboard');
      switchDashTab('tab-messages');
      loadConversations(Number(receiver_id));
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  });

  async function loadUnreadCount() {
    if (!currentUser) return;
    try {
      const data = await apiRequest('/messages/unread-count');
      const count = data.unreadCount || 0;
      if (count > 0) {
        unreadNavBadge.textContent = count;
        unreadNavBadge.classList.remove('hidden');
        dashMsgCount.textContent = count;
        dashMsgCount.classList.remove('hidden');
      } else {
        unreadNavBadge.classList.add('hidden');
        dashMsgCount.classList.add('hidden');
      }
    } catch (e) {
      console.warn('Could not fetch unread count', e);
    }
  }

  async function loadConversations(autoSelectPartnerId = null) {
    if (!currentUser) return;

    try {
      const data = await apiRequest('/messages/conversations');
      const convos = data.conversations || [];

      if (convos.length === 0) {
        conversationsList.innerHTML = '<p class="text-muted p-3">No conversations yet.</p>';
        chatEmptyState.classList.remove('hidden');
        chatActiveBox.classList.add('hidden');
        return;
      }

      conversationsList.innerHTML = '';
      convos.forEach(c => {
        const item = document.createElement('div');
        item.className = `conversation-item ${activeConversationPartnerId === c.partner_id ? 'active' : ''}`;
        item.innerHTML = `
          <div class="convo-avatar">${c.partner_avatar || '👤'}</div>
          <div class="convo-info">
            <div class="convo-name-row">
              <span class="convo-name">${escapeHtml(c.partner_name)}</span>
              <span class="convo-time">${formatTimeAgo(c.last_message_time)}</span>
            </div>
            <p class="convo-snippet">${escapeHtml(c.last_message)}</p>
          </div>
          ${c.unread_count > 0 ? `<span class="badge-pill">${c.unread_count}</span>` : ''}
        `;

        item.addEventListener('click', () => {
          document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          openConversationThread(c.partner_id);
        });

        conversationsList.appendChild(item);
      });

      if (autoSelectPartnerId) {
        openConversationThread(autoSelectPartnerId);
      } else if (!activeConversationPartnerId && convos.length > 0) {
        openConversationThread(convos[0].partner_id);
      }
    } catch (err) {
      conversationsList.innerHTML = '<p class="text-danger p-3">Failed to load conversations.</p>';
    }
  }

  async function openConversationThread(partnerId) {
    activeConversationPartnerId = partnerId;
    chatEmptyState.classList.add('hidden');
    chatActiveBox.classList.remove('hidden');

    try {
      const data = await apiRequest(`/messages/thread/${partnerId}`);
      const partner = data.partner;
      const messages = data.messages || [];

      if (partner) {
        chatPartnerAvatar.textContent = partner.avatar || '👤';
        chatPartnerName.textContent = partner.full_name;
        chatPartnerDept.textContent = partner.department || 'RCPIT Student';
      }

      renderThreadMessages(messages);
      loadUnreadCount();
    } catch (err) {
      chatMessagesBody.innerHTML = '<p class="text-danger text-center">Failed to load message thread.</p>';
    }
  }

  function renderThreadMessages(messages) {
    chatMessagesBody.innerHTML = '';

    if (messages.length === 0) {
      chatMessagesBody.innerHTML = '<p class="text-muted text-center" style="margin: auto;">Send a message to start chatting.</p>';
      return;
    }

    messages.forEach(msg => {
      const isOut = msg.sender_id === currentUser.id;
      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${isOut ? 'outgoing' : 'incoming'}`;
      bubble.innerHTML = `
        <div class="message-content">${escapeHtml(msg.message_text)}</div>
        <div class="message-meta">
          <span>${formatTimeAgo(msg.created_at)}</span>
          ${isOut ? `<span>${msg.is_read ? '✓✓' : '✓'}</span>` : ''}
        </div>
      `;
      chatMessagesBody.appendChild(bubble);
    });

    chatMessagesBody.scrollTop = chatMessagesBody.scrollHeight;
  }

  // Send message inside conversation
  chatSendForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeConversationPartnerId) return;

    const text = chatInputText.value.trim();
    if (!text) return;

    try {
      await apiRequest('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiver_id: activeConversationPartnerId,
          message_text: text
        })
      });

      chatInputText.value = '';
      openConversationThread(activeConversationPartnerId);
      loadConversations();
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  });

  // ==========================================================================
  // 13. Student Dashboard Tabs
  // ==========================================================================
  function switchDashTab(tabId) {
    dashNavButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    dashTabPanes.forEach(pane => {
      if (pane.id === tabId) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    if (tabId === 'tab-my-listings') {
      loadMyListings();
    } else if (tabId === 'tab-favorites') {
      loadFavoritesTab();
    } else if (tabId === 'tab-messages') {
      loadConversations();
    } else if (tabId === 'tab-admin') {
      loadAdminData();
    }
  }

  dashNavButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      if (tab) switchDashTab(tab);
    });
  });

  jumpToEditBtn.addEventListener('click', () => switchDashTab('tab-edit-profile'));

  async function loadDashboardData() {
    if (!currentUser) return;

    try {
      const data = await apiRequest('/auth/me');
      currentUser = data.user;
      localStorage.setItem('rf_user', JSON.stringify(currentUser));
    } catch (e) {
      // Use existing currentUser
    }

    renderDashboardProfile();
    populateEditProfileForm();
    renderVerificationStatus();

    if (currentUser.is_admin === 1) {
      dashAdminNavBtn.classList.remove('hidden');
    } else {
      dashAdminNavBtn.classList.add('hidden');
    }

    loadFavoriteIds();
    loadUnreadCount();
  }

  function renderDashboardProfile() {
    dashSidebarAvatar.textContent = currentUser.avatar || '👤';
    dashSidebarName.textContent = currentUser.full_name;
    dashSidebarDept.textContent = currentUser.department || 'RCPIT Student';

    if (currentUser.is_verified) {
      dashSidebarBadge.textContent = '✓ Verified Student';
      dashSidebarBadge.classList.remove('hidden');
    } else {
      dashSidebarBadge.textContent = '⚠️ Unverified';
    }

    dashSumName.textContent = currentUser.full_name;
    dashSumEmail.textContent = currentUser.email;
    dashSumPrn.textContent = currentUser.prn || 'Not provided';
    dashSumDept.textContent = `${currentUser.department || 'Engineering'} • ${currentUser.year_of_study || 'Student'}`;
    dashSumGender.textContent = `${currentUser.age || 20} yrs • ${currentUser.gender || 'Not specified'}`;
    dashSumLocation.textContent = currentUser.location || 'Shirpur';
    dashSumBudget.textContent = `₹${(currentUser.budget || 5000).toLocaleString()}/mo`;
    dashSumPhone.textContent = currentUser.phone || 'Not shared yet';

    dashSumFood.textContent = currentUser.food_pref || 'Any';
    dashSumSleep.textContent = currentUser.sleep_pref || 'Flexible';
    dashSumStudy.textContent = currentUser.study_pref || 'Flexible';
    dashSumLifestyle.textContent = currentUser.lifestyle_pref || 'Neat & Organized';
    dashSumBio.textContent = currentUser.bio || 'No bio added yet.';
  }

  function populateEditProfileForm() {
    document.getElementById('edit-name').value = currentUser.full_name || '';
    document.getElementById('edit-phone').value = currentUser.phone || '';
    document.getElementById('edit-age').value = currentUser.age || 20;
    document.getElementById('edit-gender').value = currentUser.gender || 'Female';
    document.getElementById('edit-dept').value = currentUser.department || 'Computer Engineering';
    document.getElementById('edit-year').value = currentUser.year_of_study || 'Third Year';
    document.getElementById('edit-location').value = currentUser.location || 'Karvand Naka, Shirpur';
    document.getElementById('edit-budget').value = currentUser.budget || 5000;
    document.getElementById('edit-food').value = currentUser.food_pref || 'Pure Veg';
    document.getElementById('edit-sleep').value = currentUser.sleep_pref || 'Flexible / Moderate';
    document.getElementById('edit-study').value = currentUser.study_pref || 'Quiet Solo Study';
    document.getElementById('edit-lifestyle').value = currentUser.lifestyle_pref || 'Neat & Organized';
    document.getElementById('edit-bio').value = currentUser.bio || '';
  }

  editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatePayload = {
      full_name: document.getElementById('edit-name').value,
      phone: document.getElementById('edit-phone').value,
      age: document.getElementById('edit-age').value,
      gender: document.getElementById('edit-gender').value,
      department: document.getElementById('edit-dept').value,
      year_of_study: document.getElementById('edit-year').value,
      location: document.getElementById('edit-location').value,
      budget: document.getElementById('edit-budget').value,
      food_pref: document.getElementById('edit-food').value,
      sleep_pref: document.getElementById('edit-sleep').value,
      study_pref: document.getElementById('edit-study').value,
      lifestyle_pref: document.getElementById('edit-lifestyle').value,
      bio: document.getElementById('edit-bio').value
    };

    try {
      const data = await apiRequest('/profiles/me', {
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      });

      currentUser = data.user;
      localStorage.setItem('rf_user', JSON.stringify(currentUser));
      updateAuthUI();
      renderDashboardProfile();
      showToast('Profile and living habits updated successfully! 🎉', 'success');
      switchDashTab('tab-profile');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  });

  // ==========================================================================
  // 14. Verification Workflow
  // ==========================================================================
  function renderVerificationStatus() {
    if (currentUser.is_verified) {
      verificationStatusBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 2rem;">🛡️</span>
          <div>
            <h3 style="color: #065f46; margin-bottom: 0.2rem;">Verified RCPIT Student</h3>
            <p class="text-muted" style="margin: 0;">Verified with University PRN: <strong>${escapeHtml(currentUser.prn || '')}</strong></p>
          </div>
        </div>
      `;
      document.getElementById('verification-form-wrap').classList.add('hidden');
    } else {
      verificationStatusBox.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 2rem;">⚠️</span>
          <div>
            <h3 style="color: #92400e; margin-bottom: 0.2rem;">Verification Pending</h3>
            <p class="text-muted" style="margin: 0;">Submit your university PRN number below to earn the Verified Student badge on your roommate profile.</p>
          </div>
        </div>
      `;
      document.getElementById('verification-form-wrap').classList.remove('hidden');
      if (currentUser.prn) {
        document.getElementById('verify-prn').value = currentUser.prn;
      }
    }
  }

  verificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prn = document.getElementById('verify-prn').value;
    const department = document.getElementById('verify-dept').value;
    const year_of_study = document.getElementById('verify-year').value;

    try {
      const data = await apiRequest('/profiles/verify', {
        method: 'POST',
        body: JSON.stringify({ prn, department, year_of_study })
      });

      currentUser.is_verified = 1;
      currentUser.prn = prn;
      localStorage.setItem('rf_user', JSON.stringify(currentUser));

      renderVerificationStatus();
      updateAuthUI();
      showToast('Congratulations! Your RCPIT PRN has been verified. 🛡️', 'success');
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    }
  });

  // ==========================================================================
  // 15. Listing Creation & Management in Dashboard
  // ==========================================================================
  async function loadMyListings() {
    if (!currentUser) return;
    myListingsContainer.innerHTML = '<p class="text-muted">Loading your listings...</p>';

    try {
      const data = await apiRequest('/listings/my');
      const listings = data.listings || [];

      if (listings.length === 0) {
        myListingsContainer.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">🏠</div>
            <h3>You have not posted any room listings</h3>
            <p>If you have an extra bed, shared room, or flat opening in Shirpur, create a listing to find roommates!</p>
            <button class="btn btn-primary btn-sm" id="empty-create-listing-btn">+ Create Listing</button>
          </div>
        `;
        document.getElementById('empty-create-listing-btn').addEventListener('click', openCreateListingModal);
        return;
      }

      myListingsContainer.innerHTML = '';
      listings.forEach(l => {
        const item = document.createElement('div');
        item.className = 'dash-card';
        item.style.marginBottom = '1.25rem';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div>
              <h3>${escapeHtml(l.title)}</h3>
              <p class="text-muted" style="margin: 0.25rem 0;">📍 ${escapeHtml(l.location)} • ₹${l.budget.toLocaleString()}/mo • ${escapeHtml(l.room_type)}</p>
              <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; align-items: center;">
                <span class="${l.is_available ? 'tag-available' : 'tag-occupied'}">
                  ${l.is_available ? '✓ Available' : '❌ Occupied'}
                </span>
                <span class="text-muted" style="font-size: 0.8rem;">❤️ Saved by ${l.favorites_count || 0} students</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm toggle-avail-btn" data-id="${l.id}">
                ${l.is_available ? 'Mark Occupied' : 'Mark Available'}
              </button>
              <button class="btn btn-secondary btn-sm edit-listing-btn" data-id="${l.id}">
                ✏️ Edit
              </button>
              <button class="btn btn-danger btn-sm delete-listing-btn" data-id="${l.id}">
                🗑️ Delete
              </button>
            </div>
          </div>
          <p class="dash-bio-text" style="margin-top: 0.75rem;">${escapeHtml(l.description || '')}</p>
        `;

        item.querySelector('.toggle-avail-btn').addEventListener('click', async () => {
          try {
            await apiRequest(`/listings/${l.id}/availability`, { method: 'PATCH' });
            showToast('Listing availability updated.', 'success');
            loadMyListings();
          } catch (e) {
            showToast('Failed to toggle availability', 'error');
          }
        });

        item.querySelector('.edit-listing-btn').addEventListener('click', () => openEditListingModal(l));

        item.querySelector('.delete-listing-btn').addEventListener('click', async () => {
          if (!confirm('Are you sure you want to permanently remove this listing?')) return;
          try {
            await apiRequest(`/listings/${l.id}`, { method: 'DELETE' });
            showToast('Listing removed successfully.', 'info');
            loadMyListings();
          } catch (e) {
            showToast('Failed to delete listing', 'error');
          }
        });

        myListingsContainer.appendChild(item);
      });
    } catch (err) {
      myListingsContainer.innerHTML = '<p class="text-danger">Failed to load listings.</p>';
    }
  }

  function openCreateListingModal() {
    if (!currentUser) {
      openAuthModal('login');
      showToast('Please sign in to post a room listing.', 'info');
      return;
    }
    listingModalTitle.textContent = 'Post a Room Listing';
    listingEditId.value = '';
    listingForm.reset();
    listingModal.classList.remove('hidden');
  }

  function openEditListingModal(listing) {
    listingModalTitle.textContent = 'Edit Room Listing';
    listingEditId.value = listing.id;
    document.getElementById('listing-title').value = listing.title;
    document.getElementById('listing-location').value = listing.location;
    document.getElementById('listing-budget').value = listing.budget;
    document.getElementById('listing-room-type').value = listing.room_type;
    document.getElementById('listing-pref-gender').value = listing.preferred_gender || 'Any';
    document.getElementById('listing-amenities').value = listing.amenities || '';
    document.getElementById('listing-desc').value = listing.description || '';
    listingModal.classList.remove('hidden');
  }

  function closeListingModal() {
    listingModal.classList.add('hidden');
  }

  listingModalClose.addEventListener('click', closeListingModal);
  listingModal.addEventListener('click', (e) => {
    if (e.target === listingModal) closeListingModal();
  });

  const heroCreateBtn = document.getElementById('hero-create-btn');
  if (heroCreateBtn) heroCreateBtn.addEventListener('click', openCreateListingModal);

  const openCreateListingBtn = document.getElementById('open-create-listing-btn');
  if (openCreateListingBtn) openCreateListingBtn.addEventListener('click', openCreateListingModal);

  const listingsViewCreateBtn = document.getElementById('listings-view-create-btn');
  if (listingsViewCreateBtn) listingsViewCreateBtn.addEventListener('click', openCreateListingModal);

  const dashCreateListingBtn = document.getElementById('dash-create-listing-btn');
  if (dashCreateListingBtn) dashCreateListingBtn.addEventListener('click', openCreateListingModal);

  listingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = listingEditId.value;
    const payload = {
      title: document.getElementById('listing-title').value,
      location: document.getElementById('listing-location').value,
      budget: document.getElementById('listing-budget').value,
      room_type: document.getElementById('listing-room-type').value,
      preferred_gender: document.getElementById('listing-pref-gender').value,
      amenities: document.getElementById('listing-amenities').value,
      description: document.getElementById('listing-desc').value
    };

    try {
      if (editId) {
        await apiRequest(`/listings/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Listing updated successfully! 🎉', 'success');
      } else {
        await apiRequest('/listings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Room listing published successfully! 🚀', 'success');
      }

      closeListingModal();
      const activeView = document.querySelector('.view-section.active');
      if (activeView && activeView.id === 'view-dashboard') {
        loadMyListings();
      } else {
        switchView('listings');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save listing', 'error');
    }
  });

  // ==========================================================================
  // 16. Reporting System
  // ==========================================================================
  function openReportModal(targetType, targetId) {
    if (!currentUser) {
      openAuthModal('login');
      showToast('Please sign in to submit a moderation report.', 'info');
      return;
    }
    reportTargetType.value = targetType;
    reportTargetId.value = targetId;
    reportForm.reset();
    reportModal.classList.remove('hidden');
  }

  function closeReportModal() {
    reportModal.classList.add('hidden');
  }

  reportModalClose.addEventListener('click', closeReportModal);
  reportCancelBtn.addEventListener('click', closeReportModal);
  reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) closeReportModal();
  });

  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const target_type = reportTargetType.value;
    const target_id = reportTargetId.value;
    const reason = document.getElementById('report-reason').value;
    const details = document.getElementById('report-details').value;

    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({ target_type, target_id, reason, details })
      });
      closeReportModal();
      showToast('Report submitted. Campus admins will review it promptly. 🛡️', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit report', 'error');
    }
  });

  // ==========================================================================
  // 17. Admin Controls & Moderation
  // ==========================================================================
  async function loadAdminData() {
    if (!currentUser || currentUser.is_admin !== 1) return;

    try {
      // 1. Overview
      const overviewData = await apiRequest('/admin/overview');
      const stats = overviewData.overview || {};
      const adminStatsRow = document.getElementById('admin-stats-row');
      adminStatsRow.innerHTML = `
        <div class="admin-stat-card">
          <div class="admin-stat-val">${stats.totalStudents || 0}</div>
          <div class="admin-stat-lbl">Registered Students</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-val">${stats.totalListings || 0}</div>
          <div class="admin-stat-lbl">Active Listings</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-val">${stats.pendingReports || 0}</div>
          <div class="admin-stat-lbl">Pending Reports</div>
        </div>
        <div class="admin-stat-card">
          <div class="admin-stat-val">${stats.verifiedStudents || 0}</div>
          <div class="admin-stat-lbl">Verified Students</div>
        </div>
      `;

      // 2. Reports
      const reportsData = await apiRequest('/reports');
      const reports = reportsData.reports || [];
      const reportsBody = document.getElementById('admin-reports-body');
      if (reports.length === 0) {
        reportsBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No reports submitted.</td></tr>';
      } else {
        reportsBody.innerHTML = '';
        reports.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>#${r.id}</td>
            <td>${escapeHtml(r.reporter_name)}</td>
            <td><span class="tag">${escapeHtml(r.target_type)}</span></td>
            <td>#${r.target_id}</td>
            <td>${escapeHtml(r.reason)}</td>
            <td><strong>${r.status}</strong></td>
            <td>
              ${r.status === 'pending' ? `
                <button class="btn btn-outline btn-xs resolve-rep-btn" data-id="${r.id}">Resolve</button>
                <button class="btn btn-secondary btn-xs dismiss-rep-btn" data-id="${r.id}">Dismiss</button>
              ` : '<span>Closed</span>'}
            </td>
          `;

          const resolveBtn = tr.querySelector('.resolve-rep-btn');
          if (resolveBtn) {
            resolveBtn.addEventListener('click', async () => {
              await apiRequest(`/reports/${r.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'resolved' })
              });
              showToast('Report marked as resolved.', 'success');
              loadAdminData();
            });
          }

          const dismissBtn = tr.querySelector('.dismiss-rep-btn');
          if (dismissBtn) {
            dismissBtn.addEventListener('click', async () => {
              await apiRequest(`/reports/${r.id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: 'dismissed' })
              });
              showToast('Report dismissed.', 'info');
              loadAdminData();
            });
          }

          reportsBody.appendChild(tr);
        });
      }

      // 3. Users
      const usersData = await apiRequest('/admin/users');
      const users = usersData.users || [];
      const usersBody = document.getElementById('admin-users-body');
      usersBody.innerHTML = '';
      users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${u.id}</td>
          <td>${escapeHtml(u.full_name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.prn || 'N/A')}</td>
          <td>${u.is_verified ? '<span class="badge-verified">Verified</span>' : '<span class="text-muted">No</span>'}</td>
          <td>
            <button class="btn btn-outline btn-xs toggle-user-verify-btn" data-id="${u.id}">
              ${u.is_verified ? 'Unverify' : 'Verify'}
            </button>
            ${u.id !== currentUser.id ? `
              <button class="btn btn-danger btn-xs del-user-btn" data-id="${u.id}">Delete</button>
            ` : ''}
          </td>
        `;

        tr.querySelector('.toggle-user-verify-btn').addEventListener('click', async () => {
          await apiRequest(`/admin/users/${u.id}/verify`, { method: 'PATCH' });
          showToast('User verification updated.', 'info');
          loadAdminData();
        });

        const delBtn = tr.querySelector('.del-user-btn');
        if (delBtn) {
          delBtn.addEventListener('click', async () => {
            if (!confirm(`Delete student account for ${u.full_name}?`)) return;
            await apiRequest(`/admin/users/${u.id}`, { method: 'DELETE' });
            showToast('User removed.', 'info');
            loadAdminData();
          });
        }

        usersBody.appendChild(tr);
      });
    } catch (err) {
      showToast('Admin data fetch error', 'error');
    }
  }

  // ==========================================================================
  // 18. Utilities
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  }

  // ==========================================================================
  // 19. Initial Startup Execution
  // ==========================================================================
  updateAuthUI();
  handleHashRouting();
  loadStats();

  // Background polling for unread messages (every 15s when active)
  setInterval(() => {
    if (currentUser) {
      loadUnreadCount();
      const chatPane = document.getElementById('tab-messages');
      if (chatPane && chatPane.classList.contains('active') && activeConversationPartnerId) {
        openConversationThread(activeConversationPartnerId);
      }
    }
  }, 15000);

});
