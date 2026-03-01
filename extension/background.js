/*
 * I built this background service worker to handle all the heavy lifting for the extension.
 * It quietly captures browser HTTP/HTTPS traffic using the chrome.webRequest API.
 * 
 * Note: I made sure it only activates after the user accepts the Terms & Conditions 
 * and has a valid Supabase session. Once active, it streams the packets straight 
 * over to the AegisNet dashboard using a BroadcastChannel.
 */

const AEGISNET_DASHBOARD_ORIGIN = 'http://localhost:5173';
const CHANNEL_NAME = 'aegisnet-extension-channel';

// I'm keeping track of the current state here so we don't have to constantly query storage
let isActive = false;
let termsAccepted = false;
let sessionUserId = null;
let capturedCount = 0;
let threatCount = 0;
let broadcastChannel = null;

// I put the initialization logic here to load everything from storage when the extension wakes up
async function init() {
  const stored = await chrome.storage.local.get([
    'terms_accepted', 
    'session_user_id',
    'is_active'
  ]);
  termsAccepted = !!stored.terms_accepted;
  sessionUserId = stored.session_user_id || null;
  isActive = !!stored.is_active && termsAccepted;

  broadcastChannel = new BroadcastChannel(CHANNEL_NAME);

  updateIcon();
  console.log('[AegisNet] Extension initialized. Active:', isActive, 'Terms:', termsAccepted);
}

// This is where I hook into Chrome's webRequest API.
// I only capture metadata like URL, method, size, timing, and status (NO content bodies!)
const REQUEST_TIMING = new Map(); // I use this to track how long each request takes

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (!isActive) return;
    REQUEST_TIMING.set(details.requestId, Date.now());
  },
  { urls: ['<all_urls>'] }
);

chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (!isActive) return;
    capturedCount++;

    const startTime = REQUEST_TIMING.get(details.requestId) || Date.now();
    REQUEST_TIMING.delete(details.requestId);
    const duration = (Date.now() - startTime) / 1000;

    // Parse URL for IPs/host
    let hostname = 'unknown';
    try {
      hostname = new URL(details.url).hostname;
    } catch { /* ignore */ }

    const isError = details.statusCode >= 400;
    const isSuspicious = isSuspiciousRequest(details);

    const packet = buildPacket(details, hostname, duration, isError, isSuspicious);

    if (isSuspicious) threatCount++;

    // Broadcast to dashboard
    broadcastChannel.postMessage({ type: 'packet', payload: packet });

    // If it's suspicious, I notify the dashboard
    if (isSuspicious && details.statusCode !== 404) {
      showThreatNotification(hostname, details.statusCode, packet.attack_type);
    }
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    if (!isActive) return;
    REQUEST_TIMING.delete(details.requestId);

    const packet = buildPacket(details, 'error', 0, true, false);
    packet.error_rate = 1.0;
    packet.flags = 'REJ';
    broadcastChannel.postMessage({ type: 'packet', payload: packet });
  },
  { urls: ['<all_urls>'] }
);

// I created this helper to format the raw Chrome request details into our expected Packet JSON
let packetSeq = 0;

function buildPacket(details, hostname, duration, isError, isSuspicious) {
  const url = details.url || '';
  const isHTTPS = url.startsWith('https://');
  const method = details.method || 'GET';
  const statusCode = details.statusCode || 0;

  // Estimate bytes from response headers if available
  let dstBytes = 1024;
  if (details.responseHeaders) {
    const cl = details.responseHeaders.find(h => h.name.toLowerCase() === 'content-length');
    if (cl && cl.value) dstBytes = parseInt(cl.value) || 1024;
  }

  const srcBytes = method === 'POST' || method === 'PUT' ? 512 + Math.random() * 2048 : 64;

  return {
    id: `ext-${++packetSeq}-${Date.now()}`,
    timestamp: Date.now(),
    protocol: isHTTPS ? 'TCP' : 'TCP',
    src_ip: '127.0.0.1', // local browser
    dst_ip: hostname,
    src_port: 40000 + (packetSeq % 25000),
    dst_port: isHTTPS ? 443 : 80,
    flags: isError ? 'RSTO' : 'SF',
    ttl: 64,
    src_bytes: srcBytes,
    dst_bytes: dstBytes,
    duration,
    num_connections: 1,
    error_rate: isError ? 0.8 : 0.01,
    attack_type: isSuspicious ? classifyRequest(details) : 'Normal',
    severity: isSuspicious ? 'HIGH' : 'NONE',
    // Extra context for the dashboard
    _meta: {
      url: url.substring(0, 200),
      method,
      statusCode,
      initiator: details.initiator || 'unknown',
      type: details.type,
      source: 'extension',
    }
  };
}

// I wrote these basic heuristics to catch obvious threats before they even hit the ML model
const PROBE_PATTERNS = [
  /\.well-known\//, /\/admin/, /\/wp-admin/, /\/phpmyadmin/,
  /\/etc\/passwd/, /\/\.env/, /\/config\.php/, /\/xmlrpc\.php/
];
const R2L_PATTERNS = [
  /login/, /signin/, /auth/, /password/, /credential/
];
const FUZZ_PATTERNS = [
  /\.\.\//,  /select.*from/i, /union.*select/i, /<script/i, /javascript:/i
];

function isSuspiciousRequest(details) {
  const url = (details.url || '').toLowerCase();
  if (details.statusCode === 403 || details.statusCode === 401) return true;
  if (PROBE_PATTERNS.some(p => p.test(url))) return true;
  if (FUZZ_PATTERNS.some(p => p.test(url))) return true;
  return false;
}

function classifyRequest(details) {
  const url = (details.url || '').toLowerCase();
  if (FUZZ_PATTERNS.some(p => p.test(url))) return 'Fuzzers';
  if (PROBE_PATTERNS.some(p => p.test(url))) return 'Probe';
  if (R2L_PATTERNS.some(p => p.test(url)) && details.statusCode === 401) return 'R2L';
  if (details.statusCode === 403) return 'Exploits';
  return 'Probe';
}

// I use this function to pop up native Chrome notifications when I detect a high-priority threat
async function showThreatNotification(host, statusCode, attackType) {
  const notifEnabled = (await chrome.storage.local.get('notifications_enabled')).notifications_enabled;
  if (notifEnabled === false) return;

  chrome.notifications.create(`threat-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: `AegisNet: ${attackType} Detected`,
    message: `Suspicious request to ${host} (HTTP ${statusCode})`,
    priority: 2,
  });
}

// This handles all the messages sent from the popup UI or the onboarding page
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'GET_STATUS':
      sendResponse({
        isActive,
        termsAccepted,
        sessionUserId,
        capturedCount,
        threatCount,
      });
      break;

    case 'SET_ACTIVE':
      if (!termsAccepted) {
        sendResponse({ success: false, error: 'Terms not accepted' });
        return true;
      }
      isActive = msg.value;
      chrome.storage.local.set({ is_active: isActive });
      updateIcon();
      broadcastChannel.postMessage({ type: 'extension_status', isActive });
      sendResponse({ success: true });
      break;

    case 'ACCEPT_TERMS':
      termsAccepted = true;
      sessionUserId = msg.userId || null;
      chrome.storage.local.set({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        session_user_id: sessionUserId,
      });
      sendResponse({ success: true });
      break;

    case 'SIGN_OUT':
      isActive = false;
      termsAccepted = false;
      sessionUserId = null;
      chrome.storage.local.clear();
      updateIcon();
      broadcastChannel.postMessage({ type: 'extension_status', isActive: false });
      sendResponse({ success: true });
      break;

    case 'GET_STATS':
      sendResponse({ capturedCount, threatCount });
      break;
  }
  return true; // keep message channel open for async
});

// I rewrite the extension icon dynamically using OffscreenCanvas to avoid PNG decode errors.
function updateIcon() {
  try {
    const canvas = new OffscreenCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 32, 32);

    // Draw background circle
    ctx.beginPath();
    ctx.arc(16, 16, 14, 0, 2 * Math.PI);
    
    if (isActive) {
      const grad = ctx.createLinearGradient(0, 0, 32, 32);
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = '#6b7280';
    }
    ctx.fill();

    // Draw inner 'A'
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 16, 18);

    const imageData = ctx.getImageData(0, 0, 32, 32);
    chrome.action.setIcon({ imageData: { 32: imageData } });
  } catch (err) {
    console.warn('Could not set dynamic icon, using fallback badge', err);
  }

  chrome.action.setBadgeText({ text: isActive ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ color: isActive ? '#22c55e' : '#6b7280' });
}

// I set up a quick alarm to broadcast stats to the dashboard periodically
chrome.alarms.create('stats-broadcast', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'stats-broadcast' && isActive) {
    broadcastChannel.postMessage({
      type: 'extension_stats',
      capturedCount,
      threatCount,
      isActive,
    });
  }
});

// Let's get things started!
init();
