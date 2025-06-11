// public/background.js
const API_BASE_URL = 'http://localhost:3000/api';

let currentTab = null;
let startTime = null;
let userId = null;
let sessionId = null;

// Generate session ID
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Initialize session
async function initializeSession() {
  try {
    let stored = null;

    // Keep checking until userId is set in chrome.storage.local
    while (!stored) {
      const result = await chrome.storage.local.get("userid");
      stored = result.userid;
      if (!stored) {
        await new Promise(resolve => setTimeout(resolve, 500)); // wait 500ms
      }
    }

    userId = stored;
    sessionId = generateSessionId();
    console.log('Session initialized for user:', userId);

  } catch (error) {
    console.error('Error initializing session:', error);
  }
}

async function sendTimeData(url, title, timeSpent) {
  if (!userId || !sessionId || timeSpent < 5) return; // Only track if more than 5 seconds

  try {
    const response = await fetch(`${API_BASE_URL}/TrackTime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        url,
        title,
        timeSpent,
        sessionId
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Time tracked:', { url, timeSpent, category: data.category });
    } else {
      console.error('Failed to track time:', response.status);
    }
  } catch (error) {
    console.error('Error sending time data:', error);
  }
}

// Handle tab updates
function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Track time for previous tab
    if (currentTab && startTime && currentTab.id !== tabId) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      sendTimeData(currentTab.url, currentTab.title || '', timeSpent);
    }

    // Start tracking new tab
    currentTab = {
      id: tabId,
      url: tab.url,
      title: tab.title || ''
    };
    startTime = Date.now();
  }
}

// Handle tab activation
function handleTabActivation(activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && !tab.url.startsWith('chrome://')) {
      // Track time for previous tab
      if (currentTab && startTime && currentTab.id !== activeInfo.tabId) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        sendTimeData(currentTab.url, currentTab.title || '', timeSpent);
      }

      // Start tracking new tab
      currentTab = {
        id: activeInfo.tabId,
        url: tab.url,
        title: tab.title || ''
      };
      startTime = Date.now();
    }
  });
}

// Handle window focus changes
function handleWindowFocus(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    if (currentTab && startTime) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      sendTimeData(currentTab.url, currentTab.title || '', timeSpent);
      startTime = null;
    }
  } else {
    // Browser gained focus
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
      if (tabs[0] && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
        currentTab = {
          id: tabs[0].id,
          url: tabs[0].url,
          title: tabs[0].title || ''
        };
        startTime = Date.now();
      }
    });
  }
}

// Periodic save (every 30 seconds)
function periodicSave() {
  if (currentTab && startTime) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    if (timeSpent >= 30) {
      sendTimeData(currentTab.url, currentTab.title || '', timeSpent);
      startTime = Date.now(); // Reset timer
    }
  }
}

// Event listeners
chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.tabs.onActivated.addListener(handleTabActivation);
chrome.windows.onFocusChanged.addListener(handleWindowFocus);

// Periodic save every 30 seconds
setInterval(periodicSave, 30000);

// Initialize when extension starts
chrome.runtime.onStartup.addListener(initializeSession);
chrome.runtime.onInstalled.addListener(initializeSession);

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setUserId') {
    userId = request.userId;
    sessionId = generateSessionId();
    chrome.storage.local.set({ userId: userId });
    sendResponse({ success: true });

  } else if (request.action === 'getUserId') {
    sendResponse({ userId: userId });

  } else if (request.action === 'titleChanged' || request.action === 'pageLoaded') {
    // Update current tab URL and title for SPA support (e.g., YouTube)
    if (sender.tab && currentTab && sender.tab.id === currentTab.id) {
      currentTab.url = request.url;
      currentTab.title = request.title;
      console.log('SPA navigation detected. Updated currentTab:', currentTab);
    }
  }
});

// Initialize immediately
initializeSession();
