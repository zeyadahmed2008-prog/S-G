let currentUser = null;
let events = JSON.parse(localStorage.getItem('sg_events') || '[]');
let reservations = JSON.parse(localStorage.getItem('sg_reservations') || '[]');
let adminIpa = localStorage.getItem('sg_instapay_ipa') || 'yourname@instapay'; // You set this in dashboard

// Auth
document.getElementById('loginBtn').addEventListener('click', () => login(false));
document.getElementById('signupBtn').addEventListener('click', () => login(true));
document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  showSection('authSection');
  document.getElementById('userInfo').innerHTML = '';
  document.getElementById('logoutBtn').style.display = 'none';
});

function login(isSignup) {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('pass').value;
  if (!email || !pass) return alert('Fill email & password');

  let users = JSON.parse(localStorage.getItem('sg_users') || '{}');
  if (isSignup) {
    if (users[email]) return alert('Email already exists');
    users[email] = {pass, reservations: []};
    localStorage.setItem('sg_users', JSON.stringify(users));
    alert('Signup success! Now login');
  } else {
    if (!users[email] || users[email].pass !== pass) return alert('Wrong email/password');
    currentUser = email;
    document.getElementById('userInfo').textContent = `Welcome ${email}`;
    document.getElementById('logoutBtn').style.display = 'block';
    showEvents();
    showMyTickets();
  }
}

function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Events List
function showEvents() {
  showSection('eventsSection');
  const list = document.getElementById('eventsList');
  list.innerHTML = '';
  events.forEach((ev, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${ev.name}</strong> - ${ev.venue} <br> ${ev.date} ${ev.time} | ${ev.price} EGP/ticket`;
    li.onclick = () => openSeats(i);
    list.appendChild(li);
  });
}

// Seat Map
let selectedSeats = [];
let currentEventIndex = -1;

function openSeats(index) {
  currentEventIndex = index;
  const ev = events[index];
  document.getElementById('eventTitle').textContent = ev.name;
  document.getElementById('eventDetails').innerHTML = `${ev.venue} | ${ev.date} ${ev.time} | Price: ${ev.price} EGP`;
  showSection('seatSection');
  renderSeatMap(ev);
}

function renderSeatMap(ev) {
  const map = document.getElementById('seatMap');
  map.innerHTML = '<div class="screen">Stage / Screen</div>';
  selectedSeats = [];
  updatePrice();

  // Simple 10x10 grid
  for (let row = 1; row <= 10; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'seat-row';
    for (let col = 1; col <= 10; col++) {
      const seatId = `${row}-${col}`;
      const reserved = reservations.some(r => r.eventIndex === currentEventIndex && r.seats.includes(seatId) && r.status === 'approved');
      const seat = document.createElement('div');
      seat.className = 'seat available';
      if (reserved) seat.className = 'seat reserved';
      seat.textContent = seatId;
      seat.onclick = () => {
        if (reserved) return;
        if (seat.classList.contains('selected')) {
          seat.classList.remove('selected');
          selectedSeats = selectedSeats.filter(s => s !== seatId);
        } else if (selectedSeats.length < 10) {
          seat.classList.add('selected');
          selectedSeats.push(seatId);
        } else alert('Max 10 seats');
        updatePrice();
        document.getElementById('selectedCount').textContent = selectedSeats.length;
      };
      rowDiv.appendChild(seat);
    }
    map.appendChild(rowDiv);
  }
}

function updatePrice() {
  const price = events[currentEventIndex]?.price || 0;
  document.getElementById('totalPrice').textContent = (selectedSeats.length * price) + ' EGP';
}

// Reserve
document.getElementById('reserveBtn').addEventListener('click', () => {
  if (selectedSeats.length === 0) return alert('Select seats');
  const amount = selectedSeats.length * events[currentEventIndex].price;
  const ref = 'ORDER-' + Date.now();
  const res = {
    user: currentUser,
    eventIndex: currentEventIndex,
    seats: selectedSeats,
    amount,
    ref,
    status: 'pending'
  };
  reservations.push(res);
  localStorage.setItem('sg_reservations', JSON.stringify(reservations));

  document.getElementById('payAmount').textContent = amount + ' EGP';
  document.getElementById('adminIpa').textContent = adminIpa;
  document.getElementById('orderRef').textContent = ref;
  showSection('paymentSection');
});

// My Tickets
function showMyTickets() {
  const div = document.getElementById('myTickets');
  div.innerHTML = '<h3>Your Tickets</h3>';
  const userRes = reservations.filter(r => r.user === currentUser && r.status === 'approved');
  if (userRes.length === 0) return div.innerHTML += '<p>No tickets yet</p>';

  userRes.forEach(r => {
    const ev = events[r.eventIndex];
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'card';
    ticketDiv.innerHTML = `<h3>${ev.name} - ${r.seats.length} Tickets</h3>`;
    r.seats.forEach(seat => {
      const qrDiv = document.createElement('div');
      qrDiv.id = 'qr-' + seat + '-' + r.ref;
      ticketDiv.appendChild(qrDiv);
      new QRCode(qrDiv, {
        text: `Event: ${ev.name}\nSeat: ${seat}\nGuest: ${currentUser}\nRef: ${r.ref}`,
        width: 200,
        height: 200
      });
    });
    div.appendChild(ticketDiv);
  });
}

// Init
if (currentUser) {
  document.getElementById('userInfo').textContent = `Welcome ${currentUser}`;
  document.getElementById('logoutBtn').style.display = 'block';
  showEvents();
  showMyTickets();
} else {
  showSection('authSection');
}
document.getElementById('adminIpa').textContent = adminIpa; // For payment page