/* ═══════════════════════════════════════════════════════════
   Bar Ten & Cheese Please — Main App JS
   ═══════════════════════════════════════════════════════════ */

// ─── BYO BOARD ORDER BUTTONS ──────────────────────────────
document.querySelectorAll('.byo-order-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const item   = btn.dataset.item;
    const amount = parseFloat(btn.dataset.amount);
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
      const resp = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item, amount }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Could not create checkout');
      }
    } catch (err) {
      btn.textContent = 'Order Now';
      btn.disabled = false;
      alert('Sorry, something went wrong. Please call us to order: 612.607.2422');
    }
  });
});

// ─── NAV: scroll effect + mobile toggle ───────────────────
const nav       = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ─── MENU TABS ────────────────────────────────────────────
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ─── FLIGHT BUILDER ───────────────────────────────────────
const selections = { cheese: [], acc: [], drink: [] };

document.querySelectorAll('.flight-items').forEach(group => {
  const groupName = group.dataset.group;
  const max       = parseInt(group.dataset.max, 10);

  group.querySelectorAll('.flight-item').forEach(item => {
    item.addEventListener('click', () => {
      const val = item.dataset.item;
      const arr = selections[groupName];
      const idx = arr.indexOf(val);

      if (idx > -1) {
        arr.splice(idx, 1);
        item.classList.remove('selected');
      } else if (arr.length < max) {
        arr.push(val);
        item.classList.add('selected');
      } else {
        // Swap oldest selection
        const oldest = arr.shift();
        group.querySelector(`[data-item="${oldest}"]`)?.classList.remove('selected');
        arr.push(val);
        item.classList.add('selected');
      }
      updateFlightSummary();
    });
  });
});

function updateFlightSummary() {
  const summary = document.getElementById('flightSummary');
  const btn     = document.getElementById('flightBook');
  const all     = [...selections.cheese, ...selections.acc, ...selections.drink];

  if (all.length === 0) {
    summary.innerHTML = "Nothing selected yet — pick your cheeses above!";
    return;
  }

  const parts = [];
  if (selections.cheese.length) parts.push(`<span>Cheeses:</span> ${selections.cheese.join(', ')}`);
  if (selections.acc.length)    parts.push(`<span>Add-ons:</span> ${selections.acc.join(', ')}`);
  if (selections.drink.length)  parts.push(`<span>Pairing:</span> ${selections.drink[0]}`);

  summary.innerHTML = parts.join(' · ');

  // Pass selections to reservation form as hidden note
  const notesInput = document.getElementById('resNotes');
  if (notesInput && !notesInput.value.includes('Flight:')) {
    notesInput.value = `Flight: ${all.join(', ')}`;
  }
}

// ─── RESERVATION FORM ─────────────────────────────────────
const resForm    = document.getElementById('reservationForm');
const formSuccess = document.getElementById('formSuccess');

// Set min date to today
const dateInput = document.getElementById('resDate');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

resForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = resForm.querySelector('.form-submit');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  const data = Object.fromEntries(new FormData(resForm));

  try {
    // Save to Supabase database
    const dbResp = await fetch('/.netlify/functions/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    // Also send to Netlify Forms as backup
    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'form-name': 'reservation', ...data }).toString(),
    }).catch(() => {});

    if (dbResp.ok) {
      resForm.style.display     = 'none';
      formSuccess.style.display = 'block';

      // If newsletter checked, send to mailing list endpoint
      if (data.newsletter) {
        fetch('/.netlify/functions/subscribe', {
          method: 'POST',
          body: JSON.stringify({ email: data.email, name: data.name }),
        }).catch(() => {});
      }
    } else {
      throw new Error('Submission failed');
    }
  } catch (err) {
    // Fallback: mailto
    const subject = encodeURIComponent(`Reservation Request — ${data.name}`);
    const body    = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || 'N/A'}\n` +
      `Party: ${data.party_size}\nDate: ${data.date}\nTime: ${data.time}\n` +
      `Occasion: ${data.occasion || 'N/A'}\nNotes: ${data.notes || 'N/A'}`
    );
    window.location.href = `mailto:hello@cheesepleasetampa.com?subject=${subject}&body=${body}`;
  }

  btn.textContent = 'Confirm Reservation →';
  btn.disabled    = false;
});

// ─── AI CHATBOT ───────────────────────────────────────────
const chatFab      = document.getElementById('chatFab');
const chatWindow   = document.getElementById('chatWindow');
const chatClose    = document.getElementById('chatClose');
const chatMessages = document.getElementById('chatMessages');
const chatInput    = document.getElementById('chatInput');
const chatSend     = document.getElementById('chatSend');

chatFab.addEventListener('click',   () => chatWindow.classList.add('open'));
chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});
chatSend.addEventListener('click', sendChat);

// Local knowledge base for instant answers (no API call needed)
const LOCAL_KB = [
  { q: /hour|open|close|when/i,           a: "We're open Mon–Thu 4 PM–11 PM and Fri–Sat 4 PM–12 AM. Closed Sundays." },
  { q: /address|location|where|direction/i, a: "We're at 4205 S MacDill Ave, Suite H, Tampa FL 33611 — right in South Tampa!" },
  { q: /park/i,                            a: "There's a free parking lot right in front of the building. Plenty of space!" },
  { q: /reserv|book|table/i,               a: "You can book right here on our website! Scroll up to the 'Reserve a Table' section, or click the button in the nav." },
  { q: /friday|tasting|8 course/i,         a: "Our Friday Wine & Cheese Tasting is every Friday 7–8:30 PM — 8 courses of rare cheese paired with wine. It's our most popular event! Reservations required." },
  { q: /saturday|happy hour/i,             a: "Saturday is Cheese Happy Hour — discounted flights and wine all night. No reservation needed, just walk in!" },
  { q: /wednesday|wine down/i,             a: "Wine Down Wednesday: 50% off select wine. Come in any Wednesday 4–11 PM!" },
  { q: /thursday|ladies|lady/i,            a: "Ladies Night is every Thursday — 20% off wine bottles for ladies, plus $4 beers and $6 vodka drinks!" },
  { q: /wing/i,                            a: "Yes! We have a wings special every day — 5 full wings + fries for just $10. All day, every day." },
  { q: /grilled cheese/i,                  a: "We make grilled cheese sandwiches with your choice of premium imported cheese on sourdough. Honestly life-changing 🧀" },
  { q: /cater|party|event|group|private/i, a: "We do private events! Birthdays, corporate events, weddings, showers — scroll down to our Private Events section or fill out the reservation form with details." },
  { q: /price|cost|how much|expensive/i,   a: "Cheese flights start from $16, wine by the glass from $9, and our famous wings are $10. Very reasonable for the quality!" },
  { q: /parking/i,                         a: "Free parking lot right in front — super easy." },
  { q: /vegan|vegetarian|gluten|allerg/i,  a: "We can accommodate most dietary needs! Just mention your allergies when you make a reservation and we'll take care of you." },
  { q: /kid|child|family|age/i,            a: "We're a bar, so we're 21+ after 9 PM. Before that, all ages are welcome with a parent or guardian!" },
  { q: /delivery|uber|doordash|order/i,    a: "We're on Uber Eats for delivery! Search 'Bar Ten' in your app. Or come in and experience the full cheese bar — much better in person 😄" },
  { q: /instagram|social|follow/i,         a: "Follow us on Instagram @bartentampa for daily specials, cheese facts, and behind-the-scenes content!" },
];

async function sendChat() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMsg(text, 'user');
  chatInput.value = '';

  // Check local KB first (instant response)
  const local = LOCAL_KB.find(k => k.q.test(text));
  if (local) {
    setTimeout(() => addMsg(local.a, 'bot'), 300);
    return;
  }

  // Show typing indicator
  const typing = addTyping();

  try {
    const resp = await fetch('/.netlify/functions/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ message: text }),
    });
    const data = await resp.json();
    typing.remove();
    addMsg(data.reply || "I'm not sure about that — give us a call or stop by and we'll answer any question!", 'bot');
  } catch {
    typing.remove();
    addMsg("Hmm, I'm having trouble connecting right now. Call us or stop by — we'd love to see you!", 'bot');
  }
}

function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function addTyping() {
  const div = document.createElement('div');
  div.className = 'chat-msg bot chat-typing';
  div.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// ─── VIP SIGNUP FORM ──────────────────────────────────────
const vipForm    = document.getElementById('vipForm');
const vipSuccess = document.getElementById('vipSuccess');

if (vipForm) {
  vipForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = vipForm.querySelector('.vip-submit');
    btn.textContent = 'Joining...';
    btn.disabled = true;

    const data = {
      name:  document.getElementById('vipName').value.trim(),
      email: document.getElementById('vipEmail').value.trim(),
      phone: document.getElementById('vipPhone').value.trim() || null,
    };

    try {
      const resp = await fetch('/.netlify/functions/vip-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (resp.ok) {
        vipForm.style.display    = 'none';
        vipSuccess.style.display = 'flex';
      } else {
        throw new Error('failed');
      }
    } catch {
      btn.textContent = 'Join the VIP List';
      btn.disabled = false;
      alert('Something went wrong. Please try again!');
    }
  });
}

// ─── SCROLL ANIMATIONS ────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity    = '1';
      e.target.style.transform  = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.special-card, .event-card, .catering-card, .review-card, .menu-item').forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});
