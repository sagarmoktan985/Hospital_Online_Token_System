// =============================================
//   HOSPITAL QUEUE MANAGEMENT — queue.js
// =============================================

// ===== STATE =====
let tokenCounter  = 0;   // Auto-incrementing token number
let currentToken  = 0;   // Currently being served
let queue         = [];  // Array of { token, name, dept, time }
let servedCount   = 0;   // Total patients served today
let selectedDept  = 'General';

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  // Set today's date on load (optional display)
  const today = new Date();
  document.title = `Queue — ${today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`;
});

// ===== SELECT DEPARTMENT =====
function selectDept(btn, dept) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  selectedDept = dept;
}

// ===== GET TOKEN =====
function getToken() {
  const nameInput = document.getElementById('patientName');
  const name = nameInput.value.trim();

  if (!name) {
    showToast('⚠️', 'Please enter the patient\'s full name.');
    nameInput.focus();
    return;
  }

  if (name.length < 2) {
    showToast('⚠️', 'Name must be at least 2 characters.');
    return;
  }

  // Generate token
  tokenCounter++;
  const tokenNum = tokenCounter;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const patient = {
    token: tokenNum,
    name:  name,
    dept:  selectedDept,
    time:  timeStr,
  };

  queue.push(patient);

  // Set first serving if none
  if (currentToken === 0) {
    currentToken = tokenNum;
  }

  // Update token display
  showTokenResult(patient);
  updateUI();

  // Clear input
  nameInput.value = '';

  showToast('✅', `Token #${tokenNum} issued to ${name}`);
}

// ===== SHOW TOKEN RESULT =====
function showTokenResult(patient) {
  const resultDiv = document.getElementById('tokenResult');
  resultDiv.classList.remove('visible');

  // Force reflow for re-animation
  void resultDiv.offsetWidth;

  document.getElementById('tokenNumber').textContent      = patient.token;
  document.getElementById('tokenPatientName').textContent = patient.name;
  document.getElementById('tokenDeptBadge').textContent   = patient.dept;
  document.getElementById('tokenDeptName').textContent    = patient.dept;

  // People ahead = queue length - 1 (excluding themselves)
  const ahead = queue.length - 1;
  document.getElementById('peopleAhead').textContent = ahead > 0 ? ahead : '0';

  // Estimated wait: 10 min per person ahead
  const waitMins = ahead * 10;
  document.getElementById('estimatedWait').textContent = waitMins > 0 ? `~${waitMins} min` : 'Next up!';

  resultDiv.classList.add('visible');
}

// ===== NEXT PATIENT =====
function nextPatient() {
  if (queue.length === 0) {
    showToast('ℹ️', 'No patients in the queue.');
    return;
  }

  // Remove first patient from queue (they are being served)
  const served = queue.shift();
  servedCount++;

  // Set next token to serve
  if (queue.length > 0) {
    currentToken = queue[0].token;
  } else {
    currentToken = 0;
  }

  updateUI();
  showToast('✅', `${served.name} has been called.`);
}

// ===== CLEAR ALL =====
function clearAll() {
  if (queue.length === 0) {
    showToast('ℹ️', 'Queue is already empty.');
    return;
  }

  if (!confirm(`Clear all ${queue.length} patient(s) from the queue?`)) return;

  queue = [];
  currentToken = 0;
  updateUI();
  showToast('🗑️', 'Queue cleared.');
}

// ===== UPDATE UI =====
function updateUI() {
  renderNowServing();
  renderQueue();
  updateStats();
}

// ===== RENDER NOW SERVING =====
function renderNowServing() {
  const badge      = document.getElementById('nowServingBadge');
  const nameEl     = document.getElementById('servingName');
  const deptEl     = document.getElementById('servingDept');
  const avatarEl   = document.getElementById('servingAvatar');
  const statusEl   = document.getElementById('servingStatus');
  const nextBtn    = document.getElementById('nextBtn');

  if (queue.length > 0) {
    const serving = queue[0];
    badge.textContent      = serving.token;
    nameEl.textContent     = serving.name;
    deptEl.textContent     = serving.dept + ' Department';
    avatarEl.textContent   = getInitials(serving.name);
    statusEl.textContent   = 'Serving';
    statusEl.className     = 'serving-status status-serving';
    nextBtn.disabled       = false;
  } else {
    badge.textContent      = '—';
    nameEl.textContent     = 'No patients in queue';
    deptEl.textContent     = '';
    avatarEl.textContent   = '—';
    statusEl.textContent   = '';
    statusEl.className     = 'serving-status';
    nextBtn.disabled       = true;
  }
}

// ===== RENDER QUEUE LIST =====
function renderQueue() {
  const listEl     = document.getElementById('queueList');
  const emptyEl    = document.getElementById('queueEmpty');
  const countBadge = document.getElementById('queueCountBadge');

  countBadge.textContent = queue.length;

  if (queue.length === 0) {
    listEl.innerHTML = '';
    listEl.appendChild(emptyEl);
    emptyEl.style.display = 'flex';
    return;
  }

  emptyEl.style.display = 'none';

  listEl.innerHTML = queue.map((p, index) => {
    const isFirst = index === 0;
    const waitMins = index * 10;
    const waitLabel = index === 0 ? 'Serving now' : `~${waitMins} min wait`;

    return `
      <div class="queue-item ${isFirst ? 'first-item' : ''}">
        <div class="queue-pos">${index + 1}</div>
        <div class="queue-avatar" style="background: ${getAvatarColor(p.name)}">${getInitials(p.name)}</div>
        <div class="queue-info">
          <div class="queue-name">${escapeHtml(p.name)}</div>
          <div class="queue-meta">
            <span>${escapeHtml(p.dept)}</span>
            <span>•</span>
            <span>${p.time}</span>
            <span>•</span>
            <span>${waitLabel}</span>
          </div>
        </div>
        <div class="queue-token-num">#${p.token}</div>
      </div>
    `;
  }).join('');
}

// ===== UPDATE STATS =====
function updateStats() {
  const total   = tokenCounter;
  const waiting = queue.length;
  const avgWait = waiting > 0 ? Math.round(waiting * 10 / waiting) : 0;

  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statServed').textContent  = servedCount;
  document.getElementById('statWaiting').textContent = waiting;
  document.getElementById('statAvgWait').textContent = avgWait + ' min';
}

// ===== HELPERS =====

function getInitials(name) {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

function getAvatarColor(name) {
  const colors = [
    'rgba(74,158,255,0.6)',
    'rgba(52,201,126,0.6)',
    'rgba(245,166,35,0.6)',
    'rgba(167,139,250,0.6)',
    'rgba(240,107,107,0.6)',
    'rgba(14,165,233,0.6)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ===== TOAST =====
function showToast(icon, message) {
  const toast   = document.getElementById('toast');
  const iconEl  = document.getElementById('toastIcon');
  const msgEl   = document.getElementById('toastMsg');

  iconEl.textContent = icon;
  msgEl.textContent  = message;

  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
