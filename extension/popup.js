/**
 * AegisNet AI Extension — Popup Script
 */

const SUPABASE_URL = 'https://your-project-id.supabase.co'; // replaced by .env at build
const TERMS_PAGE_URL = 'onboarding.html';

// Elements
const statusDot = document.getElementById('status-dot');
const logoDot = document.getElementById('logo-dot');
const statusText = document.getElementById('status-text');
const termsPanel = document.getElementById('terms-panel');
const mainControls = document.getElementById('main-controls');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statCaptured = document.getElementById('stat-captured');
const statThreats = document.getElementById('stat-threats');
const signOutBtn = document.getElementById('sign-out-btn');
const openTermsBtn = document.getElementById('open-terms-btn');

// ── Load status from background ──────────────────────────────────────────────
async function loadStatus() {
  const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

  statCaptured.textContent = stats.capturedCount.toLocaleString();
  statThreats.textContent = stats.threatCount.toLocaleString();

  if (!status.termsAccepted) {
    // Show terms required state
    termsPanel.classList.remove('hidden');
    startBtn.classList.add('hidden');
    stopBtn.classList.add('hidden');
    setStatus('waiting', 'Agree to <strong>Terms & Conditions</strong> to activate');
    return;
  }

  // Terms accepted — show controls
  termsPanel.classList.add('hidden');
  signOutBtn.classList.remove('hidden');

  if (status.isActive) {
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    setStatus('active', '<strong>Monitoring Active</strong> — capturing traffic');
  } else {
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    setStatus('inactive', 'Ready — click <strong>Start</strong> to begin');
  }
}

function setStatus(state, html) {
  statusDot.className = `status-dot ${state}`;
  logoDot.className = `logo-dot ${state === 'active' ? 'active' : 'inactive'}`;
  statusText.innerHTML = html;
}

// ── Button handlers ───────────────────────────────────────────────────────────
startBtn.addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'SET_ACTIVE', value: true });
  if (res.success) {
    setStatus('active', '<strong>Monitoring Active</strong> — capturing traffic');
    startBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
  } else {
    alert('Could not activate: ' + (res.error || 'Unknown error'));
  }
});

stopBtn.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'SET_ACTIVE', value: false });
  setStatus('inactive', 'Monitoring paused — click <strong>Start</strong> to resume');
  stopBtn.classList.add('hidden');
  startBtn.classList.remove('hidden');
});

openTermsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL(TERMS_PAGE_URL) });
  window.close();
});

signOutBtn.addEventListener('click', async () => {
  if (confirm('Sign out and deactivate monitoring?')) {
    await chrome.runtime.sendMessage({ type: 'SIGN_OUT' });
    loadStatus();
  }
});

// ── Live stats update ─────────────────────────────────────────────────────────
setInterval(async () => {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  statCaptured.textContent = stats.capturedCount.toLocaleString();
  statThreats.textContent = stats.threatCount.toLocaleString();
}, 2000);

// ── Init ──────────────────────────────────────────────────────────────────────
loadStatus();
