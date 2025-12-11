let events = JSON.parse(localStorage.getItem('sg_events') || '[]');

function saveEvents() {
  localStorage.setItem('sg_events', JSON.stringify(events));
  updateDashboard();
}

function updateDashboard() {
  document.getElementById('eventCount').textContent = events.length;
  document.getElementById('inviteCount').textContent = events.reduce((a, e) => a + (e.tickets || 0), 0);

  const list = document.getElementById('eventList');
  list.innerHTML = '';
  events.forEach((event, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <strong>${event.name}</strong> at ${event.venue}<br>
        <small>${event.date} ${event.time} | Price: ${event.price || 0} EGP</small>
      </div>
      <button onclick="deleteEvent(${i})">Delete</button>
    `;
    list.appendChild(li);
  });
}

function deleteEvent(i) {
  if (confirm('Delete this event?')) {
    events.splice(i, 1);
    saveEvents();
  }
}

document.getElementById('saveEvent')?.addEventListener('click', () => {
  const name = document.getElementById('eventName').value.trim();
  const venue = document.getElementById('venue').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const price = document.getElementById('price').value || 0;
  const description = document.getElementById('description').value.trim();
  const dressCode = document.getElementById('dressCode').value.trim();

  if (!name || !venue || !date || !time) {
    alert('Please fill required fields');
    return;
  }

  events.push({ name, venue, date, time, price, description, dressCode, tickets: 0 });
  saveEvents();
  alert('Event created successfully!');
  
  // Clear form
  document.querySelectorAll('#saveEvent').forEach(input => input.value = '');
});

document.getElementById('changePass')?.addEventListener('click', () => {
  const newP = document.getElementById('newPass').value.trim();
  if (newP && newP.length >= 6) {
    localStorage.setItem("sg_admin_password", newP);
    alert("Password updated!");
  } else {
    alert("Password too short (min 6 chars)");
  }
});

// Init
updateDashboard();