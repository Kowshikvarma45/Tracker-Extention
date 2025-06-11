// public/content.js

let lastActivityTime = Date.now();
let isActive = true;
let lastHref = location.href;
let lastTitle = document.title;

// Track user activity
function trackActivity() {
  lastActivityTime = Date.now();
  if (!isActive) {
    isActive = true;
    chrome.runtime.sendMessage({ action: 'userActive' });
  }
}

// Check for inactivity (no mouse/keyboard activity for 2 minutes)
function checkInactivity() {
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;

  if (timeSinceLastActivity > 120000 && isActive) { // 2 minutes
    isActive = false;
    chrome.runtime.sendMessage({ action: 'userInactive' });
  }
}

// Add event listeners for user activity
document.addEventListener('mousemove', trackActivity, { passive: true });
document.addEventListener('keypress', trackActivity, { passive: true });
document.addEventListener('click', trackActivity, { passive: true });
document.addEventListener('scroll', trackActivity, { passive: true });

// Check for inactivity every 30 seconds
setInterval(checkInactivity, 30000);

// Watch for SPA navigation via URL or title change
const observer = new MutationObserver(() => {
  const currentHref = location.href;
  const currentTitle = document.title;

  if (currentHref !== lastHref || currentTitle !== lastTitle) {
    lastHref = currentHref;
    lastTitle = currentTitle;
    chrome.runtime.sendMessage({
      action: 'titleChanged',
      title: currentTitle,
      url: currentHref
    });
  }
});

// Observe mutations in <body> and <title> (SPA-safe)
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}
observer.observe(document.head, { childList: true, subtree: true });

// Send initial page info
chrome.runtime.sendMessage({
  action: 'pageLoaded',
  title: document.title,
  url: location.href
});
