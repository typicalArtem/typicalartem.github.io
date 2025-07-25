// Popup script for Social Media Downloader
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize popup
  await initializePopup();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load download history
  await loadDownloadHistory();
});

// Initialize popup based on current tab
async function initializePopup() {
  try {
    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showPlatformInfo('❌', 'Unable to access current tab');
      return;
    }
    
    // Check if we're on a supported platform
    const pageInfo = await getPageInfo(tab.id);
    
    if (pageInfo.error) {
      showPlatformInfo('❌', 'Error loading page information');
      return;
    }
    
    updateUIForPlatform(pageInfo);
    
  } catch (error) {
    console.error('Error initializing popup:', error);
    showPlatformInfo('❌', 'Error initializing extension');
  }
}

// Get page information from background script
function getPageInfo(tabId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'GET_PAGE_INFO'
    }, resolve);
  });
}

// Update UI based on detected platform
function updateUIForPlatform(pageInfo) {
  const { platform, url, title } = pageInfo;
  
  const platformInfo = document.getElementById('platformInfo');
  const downloadSection = document.getElementById('downloadSection');
  
  switch (platform) {
    case 'youtube':
      showDownloadSection('🎥', 'YouTube Video Detected', title, getYouTubeThumbnail(url));
      break;
    
    case 'instagram':
      showDownloadSection('📷', 'Instagram Content Detected', title, null);
      break;
    
    case 'tiktok':
      showDownloadSection('🎵', 'TikTok Video Detected', title, null);
      break;
    
    default:
      showPlatformInfo('🌐', 'Navigate to YouTube, Instagram, or TikTok to start downloading');
      break;
  }
}

// Show platform information
function showPlatformInfo(icon, message) {
  const platformInfo = document.getElementById('platformInfo');
  const downloadSection = document.getElementById('downloadSection');
  
  platformInfo.style.display = 'block';
  downloadSection.style.display = 'none';
  
  platformInfo.querySelector('.platform-icon').textContent = icon;
  platformInfo.querySelector('p').textContent = message;
}

// Show download section
function showDownloadSection(icon, title, videoTitle, thumbnail) {
  const platformInfo = document.getElementById('platformInfo');
  const downloadSection = document.getElementById('downloadSection');
  const mediaPreview = document.getElementById('mediaPreview');
  
  platformInfo.style.display = 'none';
  downloadSection.style.display = 'block';
  
  // Update media preview
  mediaPreview.innerHTML = '';
  
  if (thumbnail) {
    const img = document.createElement('img');
    img.src = thumbnail;
    img.alt = 'Video thumbnail';
    mediaPreview.appendChild(img);
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = `${icon}<br>${title}`;
    mediaPreview.appendChild(placeholder);
  }
  
  // Update title if available
  if (videoTitle && videoTitle !== 'undefined') {
    const titleElement = document.createElement('div');
    titleElement.style.marginTop = '10px';
    titleElement.style.fontSize = '12px';
    titleElement.style.color = '#666';
    titleElement.style.textAlign = 'center';
    titleElement.textContent = truncateText(videoTitle, 50);
    mediaPreview.appendChild(titleElement);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Download button
  const downloadBtn = document.getElementById('downloadBtn');
  downloadBtn.addEventListener('click', handleDownload);
  
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  settingsBtn.addEventListener('click', () => {
    showStatus('Settings feature coming soon!', 'info');
  });
  
  // Help button
  const helpBtn = document.getElementById('helpBtn');
  helpBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/your-repo/social-media-downloader' });
  });
}

// Handle download request
async function handleDownload() {
  const downloadBtn = document.getElementById('downloadBtn');
  const qualitySelect = document.getElementById('qualitySelect');
  const formatSelect = document.getElementById('formatSelect');
  
  // Disable button and show loading state
  downloadBtn.disabled = true;
  downloadBtn.classList.add('loading');
  downloadBtn.querySelector('.btn-text').textContent = 'Processing...';
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageInfo = await getPageInfo(tab.id);
    
    // Prepare download data
    const downloadData = {
      url: pageInfo.url,
      platform: pageInfo.platform,
      quality: qualitySelect.value,
      format: formatSelect.value,
      title: pageInfo.title || 'Unknown',
      thumbnail: getYouTubeThumbnail(pageInfo.url)
    };
    
    // Send download request to background script
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA',
        data: downloadData
      }, resolve);
    });
    
    if (response.success) {
      showStatus('Download started successfully!', 'success');
      await loadDownloadHistory(); // Refresh history
    } else {
      showStatus(`Download failed: ${response.error}`, 'error');
    }
    
  } catch (error) {
    console.error('Download error:', error);
    showStatus(`Error: ${error.message}`, 'error');
  } finally {
    // Reset button state
    downloadBtn.disabled = false;
    downloadBtn.classList.remove('loading');
    downloadBtn.querySelector('.btn-text').textContent = 'Download';
  }
}

// Load and display download history
async function loadDownloadHistory() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'GET_DOWNLOAD_HISTORY'
      }, resolve);
    });
    
    const historyList = document.getElementById('historyList');
    
    if (response.history && response.history.length > 0) {
      historyList.innerHTML = '';
      
      response.history.slice(0, 5).forEach(item => {
        const historyItem = createHistoryItem(item);
        historyList.appendChild(historyItem);
      });
    } else {
      historyList.innerHTML = '<p class="empty-state">No downloads yet</p>';
    }
    
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

// Create history item element
function createHistoryItem(item) {
  const div = document.createElement('div');
  div.className = 'history-item';
  
  const platform = document.createElement('div');
  platform.className = `platform ${item.platform}`;
  platform.textContent = getPlatformIcon(item.platform);
  
  const details = document.createElement('div');
  details.className = 'details';
  
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = truncateText(item.title, 30);
  
  const time = document.createElement('div');
  time.className = 'time';
  time.textContent = formatTime(item.timestamp);
  
  details.appendChild(title);
  details.appendChild(time);
  
  div.appendChild(platform);
  div.appendChild(details);
  
  return div;
}

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  
  // Hide after 3 seconds
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}

// Utility functions
function getPlatformIcon(platform) {
  const icons = {
    youtube: 'YT',
    instagram: 'IG',
    tiktok: 'TT'
  };
  return icons[platform] || '??';
}

function getYouTubeThumbnail(url) {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
}

function extractYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function formatTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}