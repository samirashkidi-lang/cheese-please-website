/* ═══════════════════════════════════════════
   Bar Ten Admin — Shared JS
   ═══════════════════════════════════════════ */

// Auth guard — redirect to login if not authenticated
function requireAuth() {
  if (!sessionStorage.getItem('admin_user')) {
    window.location.href = 'index.html';
  }
}

// Set active nav item based on current page
function setActiveNav() {
  const page = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.page === page) item.classList.add('active');
  });
}

// Show logged in user
function showUser() {
  const el = document.getElementById('sidebarUser');
  if (el) el.textContent = sessionStorage.getItem('admin_user') || '';
}

// Logout
function logout() {
  sessionStorage.removeItem('admin_user');
  window.location.href = 'index.html';
}

// Toast notification
function toast(msg, type = '') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Format currency
function formatMoney(n) {
  return '$' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format time
function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Simple local storage DB (will be replaced with Supabase)
const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem('bt_' + key)) || []; }
    catch { return []; }
  },
  set(key, val) {
    localStorage.setItem('bt_' + key, JSON.stringify(val));
  },
  add(key, item) {
    const arr = DB.get(key);
    item.id = item.id || Date.now().toString();
    item.createdAt = item.createdAt || new Date().toISOString();
    arr.unshift(item);
    DB.set(key, arr);
    return item;
  },
  update(key, id, updates) {
    const arr = DB.get(key);
    const idx = arr.findIndex(i => i.id == id);
    if (idx > -1) { arr[idx] = { ...arr[idx], ...updates }; DB.set(key, arr); }
  },
  delete(key, id) {
    const arr = DB.get(key).filter(i => i.id != id);
    DB.set(key, arr);
  }
};

// Seed demo data if empty
function seedDemoData() {
  if (DB.get('reservations').length === 0) {
    const names = ['Sarah Mitchell', 'Marcus Thompson', 'Jennifer Lee', 'David Rodriguez', 'Ashley Kim'];
    names.forEach((name, i) => {
      DB.add('reservations', {
        name,
        email: name.toLowerCase().replace(' ', '.') + '@gmail.com',
        phone: `(813) 555-0${100 + i}`,
        party_size: [2,4,2,3,6][i],
        date: new Date(Date.now() + (i+1) * 86400000).toISOString().split('T')[0],
        time: ['7:00 PM','6:00 PM','7:00 PM','5:00 PM','8:00 PM'][i],
        occasion: ['Date Night','Birthday','Anniversary','Just a night out','Girls Night'][i],
        status: ['pending','confirmed','pending','confirmed','pending'][i],
        notes: i === 1 ? 'Birthday cake surprise please!' : '',
      });
    });
  }

  if (DB.get('orders').length === 0) {
    const orders = [
      { name: 'Emily Jenkins',  items: 'Grand Board x1',         amount: 127.00, status: 'accepted' },
      { name: 'Anna Glover',    items: 'Cheese Flight x2, Wine', amount: 201.00, status: 'accepted' },
      { name: 'Jessica Elliott',items: 'Charcuterie Board x1',   amount: 162.00, status: 'accepted' },
      { name: 'Sue MacIsaac',   items: 'Wings + Drinks x3',      amount: 169.00, status: 'pending'  },
    ];
    orders.forEach(o => DB.add('orders', { ...o, createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() }));
  }

  if (DB.get('inquiries').length === 0) {
    DB.add('inquiries', { type: 'Catering', name: 'Rachel Green', email: 'rachel@email.com', phone: '(813) 555-0201', date: '2026-04-15', guests: 30, message: 'Corporate event, need cheese boards for 30 people.', status: 'new' });
    DB.add('inquiries', { type: 'Private Party', name: 'Tom Wilson', email: 'tom@email.com', phone: '(813) 555-0202', date: '2026-03-22', guests: 12, message: 'Birthday party for my wife.', status: 'new' });
    DB.add('inquiries', { type: 'Catering', name: 'Lisa Park',  email: 'lisa@email.com', phone: '(813) 555-0203', date: '2026-04-01', guests: 50, message: 'Wedding shower catering.', status: 'contacted' });
  }
}

// Sidebar HTML — shared across all pages
function renderSidebar(activePage) {
  const nav = [
    { label: null, items: [
      { icon: '🏠', text: 'Dashboard',   page: 'dashboard.html' },
    ]},
    { label: 'Sales & Inquiries', items: [
      { icon: '📅', text: 'Reservations', page: 'reservations.html', badge: () => DB.get('reservations').filter(r=>r.status==='pending').length },
      { icon: '🛒', text: 'Online Orders', page: 'orders.html', badge: () => DB.get('orders').filter(o=>o.status==='pending').length },
      { icon: '🎉', text: 'Catering & Events', page: 'inquiries.html', badge: () => DB.get('inquiries').filter(i=>i.status==='new').length },
    ]},
    { label: 'Menu & Content', items: [
      { icon: '🧀', text: 'Menu Manager',   page: 'menu.html' },
      { icon: '⭐', text: 'Specials',       page: 'specials.html' },
      { icon: '📸', text: 'Events',         page: 'events.html' },
    ]},
    { label: 'Marketing', items: [
      { icon: '📱', text: 'Social Posts',   page: 'social.html' },
      { icon: '📧', text: 'Email Campaigns',page: 'emails.html' },
    ]},
    { label: 'Settings', items: [
      { icon: '🕐', text: 'Hours',          page: 'hours.html' },
      { icon: '👥', text: 'Users',          page: 'users.html' },
      { icon: '⚙️', text: 'Settings',       page: 'settings.html' },
    ]},
  ];

  let html = `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-name">🧀 Bar Ten Admin</div>
        <div class="sidebar-brand-sub">Cheese Please Tampa</div>
      </div>
      <nav class="sidebar-nav">
  `;

  nav.forEach(section => {
    if (section.label) html += `<div class="nav-section">${section.label}</div>`;
    section.items.forEach(item => {
      const badgeCount = item.badge ? item.badge() : 0;
      const isActive = item.page === activePage;
      html += `<a href="${item.page}" class="nav-item${isActive ? ' active' : ''}">
        <span class="nav-icon">${item.icon}</span>
        ${item.text}
        ${badgeCount > 0 ? `<span class="nav-badge">${badgeCount}</span>` : ''}
      </a>`;
    });
  });

  html += `
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebarUser"></div>
        <button class="btn-logout" onclick="logout()">Log Out</button>
      </div>
    </aside>
    <div id="toast" class="toast"></div>
  `;

  document.body.insertAdjacentHTML('afterbegin', html);
  showUser();
}
