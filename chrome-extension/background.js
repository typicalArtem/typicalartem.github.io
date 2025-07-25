// Background service worker for Social Media Downloader
chrome.runtime.onInstalled.addListener(() => {
  console.log('Social Media Downloader installed');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'DOWNLOAD_MEDIA':
      handleDownload(message.data, sendResponse);
      return true; // Keep message channel open for async response
    
    case 'GET_PAGE_INFO':
      getPageInfo(sender.tab.id, sendResponse);
      return true;
    
    case 'SAVE_DOWNLOAD_HISTORY':
      saveDownloadHistory(message.data);
      break;
    
    case 'GET_DOWNLOAD_HISTORY':
      getDownloadHistory(sendResponse);
      return true;
  }
});

// Handle download functionality
async function handleDownload(data, sendResponse) {
  try {
    const { url, platform, quality, format, title, thumbnail } = data;
    
    // Show download started notification
    showNotification('Download Started', `Starting download from ${platform}`);
    
    // Generate filename
    const filename = generateFilename(title, platform, format);
    
    // For this demo, we'll use a placeholder download URL
    // In a real implementation, you would need to:
    // 1. Extract the actual media URL from the platform
    // 2. Handle different qualities and formats
    // 3. Deal with authentication and rate limiting
    
    const downloadUrl = await extractMediaUrl(url, platform, quality, format);
    
    if (downloadUrl) {
      // Start the download
      chrome.downloads.download({
        url: downloadUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          showNotification('Download Failed', chrome.runtime.lastError.message, 'error');
        } else {
          // Save to download history
          const historyItem = {
            id: downloadId,
            title: title,
            platform: platform,
            url: url,
            thumbnail: thumbnail,
            timestamp: Date.now(),
            filename: filename
          };
          
          saveDownloadHistory(historyItem);
          sendResponse({ success: true, downloadId: downloadId });
          showNotification('Download Started', `Downloading: ${title}`);
          
          // Monitor download progress
          monitorDownload(downloadId, title);
        }
      });
    } else {
      sendResponse({ success: false, error: 'Could not extract media URL' });
      showNotification('Download Failed', 'Could not extract media URL', 'error');
    }
    
  } catch (error) {
    console.error('Download error:', error);
    sendResponse({ success: false, error: error.message });
    showNotification('Download Failed', error.message, 'error');
  }
}

// Extract media URL from platform (placeholder implementation)
async function extractMediaUrl(pageUrl, platform, quality, format) {
  // This is a placeholder implementation
  // In a real extension, you would need to:
  // 1. Use platform-specific APIs or methods to extract media URLs
  // 2. Handle authentication, rate limiting, and terms of service
  // 3. Support different qualities and formats
  
  console.log(`Extracting ${format} from ${platform} at ${quality} quality`);
  
  // For demo purposes, return a placeholder URL
  // In reality, this would involve complex extraction logic
  switch (platform) {
    case 'youtube':
      // YouTube extraction would require yt-dlp or similar
      return `https://example.com/demo-video.mp4`;
    
    case 'instagram':
      // Instagram extraction would need to handle stories, posts, reels
      return `https://example.com/demo-instagram.mp4`;
    
    case 'tiktok':
      // TikTok extraction would need to handle their API
      return `https://example.com/demo-tiktok.mp4`;
    
    default:
      throw new Error('Unsupported platform');
  }
}

// Generate appropriate filename
function generateFilename(title, platform, format) {
  const sanitizedTitle = title.replace(/[^\w\s-]/g, '').trim();
  const timestamp = new Date().toISOString().slice(0, 10);
  const extension = format === 'audio' ? 'mp3' : 'mp4';
  
  return `${platform}_${sanitizedTitle}_${timestamp}.${extension}`;
}

// Monitor download progress
function monitorDownload(downloadId, title) {
  chrome.downloads.onChanged.addListener(function listener(delta) {
    if (delta.id === downloadId) {
      if (delta.state && delta.state.current === 'complete') {
        showNotification('Download Complete', `${title} has been downloaded`);
        chrome.downloads.onChanged.removeListener(listener);
      } else if (delta.state && delta.state.current === 'interrupted') {
        showNotification('Download Failed', `${title} download was interrupted`, 'error');
        chrome.downloads.onChanged.removeListener(listener);
      }
    }
  });
}

// Get page information from active tab
async function getPageInfo(tabId, sendResponse) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url;
    let platform = 'unknown';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
    } else if (url.includes('instagram.com')) {
      platform = 'instagram';
    } else if (url.includes('tiktok.com')) {
      platform = 'tiktok';
    }
    
    sendResponse({
      url: url,
      platform: platform,
      title: tab.title
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Save download to history
async function saveDownloadHistory(item) {
  try {
    const result = await chrome.storage.local.get('downloadHistory');
    const history = result.downloadHistory || [];
    
    // Add new item to beginning of array
    history.unshift(item);
    
    // Keep only last 50 downloads
    if (history.length > 50) {
      history.splice(50);
    }
    
    await chrome.storage.local.set({ downloadHistory: history });
  } catch (error) {
    console.error('Error saving download history:', error);
  }
}

// Get download history
async function getDownloadHistory(sendResponse) {
  try {
    const result = await chrome.storage.local.get('downloadHistory');
    sendResponse({ history: result.downloadHistory || [] });
  } catch (error) {
    sendResponse({ history: [], error: error.message });
  }
}

// Show notification
function showNotification(title, message, type = 'info') {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: title,
    message: message
  });
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup automatically due to manifest configuration
});

// Clean up old downloads from history periodically
chrome.alarms.create('cleanupHistory', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupHistory') {
    cleanupOldHistory();
  }
});

async function cleanupOldHistory() {
  try {
    const result = await chrome.storage.local.get('downloadHistory');
    const history = result.downloadHistory || [];
    
    // Remove items older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const cleanHistory = history.filter(item => item.timestamp > thirtyDaysAgo);
    
    await chrome.storage.local.set({ downloadHistory: cleanHistory });
  } catch (error) {
    console.error('Error cleaning up history:', error);
  }
}