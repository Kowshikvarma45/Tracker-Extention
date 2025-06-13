let lastActivityTime = Date.now();
let isActive = true;
let lastHref = location.href;
let lastTitle = document.title;

function trackActivity() {
  lastActivityTime = Date.now();
  if (!isActive) {
    isActive = true;
    chrome.runtime.sendMessage({ action: 'userActive' });
  }
}

function checkInactivity() {
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastActivityTime;

  if (timeSinceLastActivity > 120000 && isActive) { // 2 minutes
    isActive = false;
    chrome.runtime.sendMessage({ action: 'userInactive' });
  }
}

document.addEventListener('mousemove', trackActivity, { passive: true });
document.addEventListener('keypress', trackActivity, { passive: true });
document.addEventListener('click', trackActivity, { passive: true });
document.addEventListener('scroll', trackActivity, { passive: true });

setInterval(checkInactivity, 30000);

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

if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
}
observer.observe(document.head, { childList: true, subtree: true });

chrome.runtime.sendMessage({
  action: 'pageLoaded',
  title: document.title,
  url: location.href
});
