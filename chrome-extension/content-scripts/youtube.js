// YouTube content script for Social Media Downloader
(function() {
  'use strict';
  
  let downloadButton = null;
  let currentVideoId = null;
  
  // Initialize the script
  function init() {
    console.log('YouTube downloader initialized');
    
    // Wait for the page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handlePageLoad);
    } else {
      handlePageLoad();
    }
    
    // Listen for navigation changes (YouTube is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        handlePageLoad();
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  // Handle page load and navigation
  function handlePageLoad() {
    setTimeout(() => {
      if (isVideoPage()) {
        addDownloadButton();
      } else {
        removeDownloadButton();
      }
    }, 1000); // Wait for YouTube to load elements
  }
  
  // Check if we're on a video page
  function isVideoPage() {
    return location.pathname === '/watch' && location.search.includes('v=');
  }
  
  // Add download button to the page
  function addDownloadButton() {
    // Remove existing button if present
    removeDownloadButton();
    
    const videoId = getVideoId();
    if (!videoId || videoId === currentVideoId) {
      return;
    }
    
    currentVideoId = videoId;
    
    // Find the target container (next to subscribe button)
    const container = findButtonContainer();
    if (!container) {
      console.log('Could not find button container');
      return;
    }
    
    // Create download button
    downloadButton = createDownloadButton();
    container.appendChild(downloadButton);
    
    console.log('Download button added for video:', videoId);
  }
  
  // Find appropriate container for the download button
  function findButtonContainer() {
    // Try multiple selectors as YouTube's structure changes frequently
    const selectors = [
      '#actions-inner', // New layout
      '#menu-container', // Alternative layout
      '#top-level-buttons', // Another layout
      '.ytd-video-primary-info-renderer #menu', // Older layout
      '.ytd-menu-renderer' // Fallback
    ];
    
    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container) {
        return container;
      }
    }
    
    // If no container found, try to find subscribe button and insert after
    const subscribeButton = document.querySelector('#subscribe-button');
    if (subscribeButton && subscribeButton.parentElement) {
      return subscribeButton.parentElement;
    }
    
    return null;
  }
  
  // Create the download button element
  function createDownloadButton() {
    const button = document.createElement('button');
    button.className = 'social-downloader-btn social-downloader-youtube';
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>Download</span>
    `;
    
    button.addEventListener('click', handleDownloadClick);
    
    return button;
  }
  
  // Handle download button click
  async function handleDownloadClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    
    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    
    try {
      const videoData = getVideoData();
      
      if (!videoData) {
        showToast('Error', 'Could not extract video information', 'error');
        return;
      }
      
      // Send download request to background script
      const response = await sendMessage({
        type: 'DOWNLOAD_MEDIA',
        data: {
          url: location.href,
          platform: 'youtube',
          quality: 'best',
          format: 'video',
          title: videoData.title,
          thumbnail: videoData.thumbnail
        }
      });
      
      if (response.success) {
        showToast('Download Started', `Downloading: ${videoData.title}`, 'success');
      } else {
        showToast('Download Failed', response.error || 'Unknown error', 'error');
      }
      
    } catch (error) {
      console.error('Download error:', error);
      showToast('Download Failed', error.message, 'error');
    } finally {
      // Reset button state
      button.classList.remove('loading');
      button.disabled = false;
    }
  }
  
  // Get video ID from URL
  function getVideoId() {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('v');
  }
  
  // Extract video data from the page
  function getVideoData() {
    const videoId = getVideoId();
    if (!videoId) return null;
    
    // Try to get title from various selectors
    let title = 'Unknown Video';
    const titleSelectors = [
      'h1.ytd-video-primary-info-renderer',
      '.ytd-video-primary-info-renderer h1',
      '#container h1',
      'h1.title'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent) {
        title = titleElement.textContent.trim();
        break;
      }
    }
    
    // Get thumbnail URL
    const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    return {
      videoId,
      title,
      thumbnail,
      url: location.href
    };
  }
  
  // Remove download button
  function removeDownloadButton() {
    if (downloadButton && downloadButton.parentElement) {
      downloadButton.parentElement.removeChild(downloadButton);
      downloadButton = null;
    }
  }
  
  // Send message to background script
  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
  
  // Show toast notification
  function showToast(title, message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.social-downloader-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `social-downloader-toast ${type}`;
    toast.innerHTML = `
      <div class="social-downloader-toast-title">${title}</div>
      <div class="social-downloader-toast-message">${message}</div>
    `;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 4000);
  }
  
  // Handle extension updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_VIDEO_INFO') {
      const videoData = getVideoData();
      sendResponse(videoData);
    }
  });
  
  // Initialize when script loads
  init();
  
})();