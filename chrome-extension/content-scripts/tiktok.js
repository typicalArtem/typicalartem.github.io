// TikTok content script for Social Media Downloader
(function() {
  'use strict';
  
  let downloadButtons = [];
  let processedVideos = new Set();
  
  // Initialize the script
  function init() {
    console.log('TikTok downloader initialized');
    
    // Wait for the page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handlePageLoad);
    } else {
      handlePageLoad();
    }
    
    // Listen for navigation changes (TikTok is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(handlePageLoad, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Listen for new videos being loaded
    const observer = new MutationObserver(handleDOMChanges);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Handle page load and navigation
  function handlePageLoad() {
    setTimeout(() => {
      if (isVideoPage()) {
        addDownloadButtonToVideo();
      } else if (isFeedPage()) {
        addDownloadButtonsToFeed();
      }
    }, 1500); // Wait for TikTok to load elements
  }
  
  // Handle DOM changes to catch dynamically loaded content
  function handleDOMChanges(mutations) {
    let shouldCheck = false;
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          if (node.matches && (
            node.matches('[data-e2e="video-wrapper"]') || 
            node.querySelector('[data-e2e="video-wrapper"]') ||
            node.matches('video') ||
            node.querySelector('video')
          )) {
            shouldCheck = true;
          }
        }
      });
    });
    
    if (shouldCheck) {
      setTimeout(addDownloadButtonsToFeed, 500);
    }
  }
  
  // Check if we're on a video page
  function isVideoPage() {
    return location.pathname.startsWith('/@') && location.pathname.includes('/video/');
  }
  
  // Check if we're on the feed page
  function isFeedPage() {
    return location.pathname === '/' || location.pathname.startsWith('/foryou') || location.pathname.startsWith('/@');
  }
  
  // Add download button to a single video page
  function addDownloadButtonToVideo() {
    const videoContainer = document.querySelector('[data-e2e="video-wrapper"], .video-card-container');
    if (videoContainer && !hasDownloadButton(videoContainer)) {
      addDownloadButtonToContainer(videoContainer);
    }
  }
  
  // Add download buttons to feed videos
  function addDownloadButtonsToFeed() {
    const videoContainers = document.querySelectorAll('[data-e2e="video-wrapper"], .video-card-container, [data-e2e="video-player-container"]');
    
    videoContainers.forEach(container => {
      if (!hasDownloadButton(container)) {
        addDownloadButtonToContainer(container);
      }
    });
  }
  
  // Check if container already has a download button
  function hasDownloadButton(container) {
    return container.querySelector('.social-downloader-btn') !== null;
  }
  
  // Add download button to a specific video container
  function addDownloadButtonToContainer(container) {
    try {
      const videoInfo = getVideoInfo(container);
      if (!videoInfo) return;
      
      const videoId = getVideoId(container);
      if (!videoId || processedVideos.has(videoId)) return;
      
      processedVideos.add(videoId);
      
      // Find appropriate container for the button
      const buttonContainer = findButtonContainer(container);
      if (!buttonContainer) return;
      
      // Create and add download button
      const downloadButton = createDownloadButton(videoInfo);
      buttonContainer.appendChild(downloadButton);
      downloadButtons.push(downloadButton);
      
      console.log('Download button added for TikTok video:', videoId);
      
    } catch (error) {
      console.error('Error adding download button:', error);
    }
  }
  
  // Find appropriate container for the download button
  function findButtonContainer(videoContainer) {
    // Try to find the action buttons area
    const selectors = [
      '[data-e2e="video-actions"]', // Action buttons area
      '.video-actions', // Alternative selector
      '[data-e2e="browse-video-desc"]', // Description area
      '.video-meta', // Video metadata area
    ];
    
    for (const selector of selectors) {
      const container = videoContainer.querySelector(selector);
      if (container) {
        return container;
      }
    }
    
    // Look for right side action buttons
    const rightActions = videoContainer.querySelector('.video-card-browse, [data-e2e="video-right-actions"]');
    if (rightActions) {
      return rightActions;
    }
    
    // Fallback: create our own container
    const video = videoContainer.querySelector('video');
    if (video && video.parentElement) {
      const div = document.createElement('div');
      div.className = 'social-downloader-tiktok';
      div.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 100;
      `;
      video.parentElement.style.position = 'relative';
      video.parentElement.appendChild(div);
      return div;
    }
    
    return null;
  }
  
  // Create the download button element
  function createDownloadButton(videoInfo) {
    const button = document.createElement('button');
    button.className = 'social-downloader-btn social-downloader-tiktok';
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>Download</span>
    `;
    
    button.addEventListener('click', (event) => handleDownloadClick(event, videoInfo));
    
    return button;
  }
  
  // Handle download button click
  async function handleDownloadClick(event, videoInfo) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    
    // Show loading state
    button.classList.add('loading');
    button.disabled = true;
    
    try {
      // Send download request to background script
      const response = await sendMessage({
        type: 'DOWNLOAD_MEDIA',
        data: {
          url: location.href,
          platform: 'tiktok',
          quality: 'best',
          format: 'video',
          title: videoInfo.description || 'TikTok Video',
          thumbnail: videoInfo.thumbnail,
          mediaUrl: videoInfo.videoUrl
        }
      });
      
      if (response.success) {
        showToast('Download Started', `Downloading TikTok video`, 'success');
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
  
  // Extract video information from container
  function getVideoInfo(container) {
    try {
      let videoUrl = null;
      let thumbnail = null;
      let description = '';
      
      // Try to find video element
      const video = container.querySelector('video');
      if (video) {
        videoUrl = video.src || video.currentSrc;
        thumbnail = video.poster;
      }
      
      if (!videoUrl) return null;
      
      // Try to get description
      const descSelectors = [
        '[data-e2e="browse-video-desc"]',
        '.video-meta-caption',
        '.tt-video-meta-caption',
        '[data-e2e="video-desc"]'
      ];
      
      for (const selector of descSelectors) {
        const descElement = container.querySelector(selector) || document.querySelector(selector);
        if (descElement && descElement.textContent) {
          description = descElement.textContent.trim();
          break;
        }
      }
      
      // Try to get author info
      let author = '';
      const authorSelectors = [
        '[data-e2e="browse-username"]',
        '.author-uniqueId',
        '.tt-video-meta-author'
      ];
      
      for (const selector of authorSelectors) {
        const authorElement = container.querySelector(selector) || document.querySelector(selector);
        if (authorElement && authorElement.textContent) {
          author = authorElement.textContent.trim();
          break;
        }
      }
      
      return {
        videoUrl: videoUrl,
        thumbnail: thumbnail,
        description: description,
        author: author
      };
      
    } catch (error) {
      console.error('Error extracting video info:', error);
      return null;
    }
  }
  
  // Get video ID from URL or container
  function getVideoId(container) {
    // Try to get from URL if on video page
    const match = location.pathname.match(/\/video\/(\d+)/);
    if (match) {
      return match[1];
    }
    
    // Try to get from video element
    const video = container.querySelector('video');
    if (video && video.src) {
      // Generate ID from video URL
      return btoa(video.src).slice(0, 10);
    }
    
    // Try to get from data attributes
    const dataId = container.getAttribute('data-video-id') || 
                  container.querySelector('[data-video-id]')?.getAttribute('data-video-id');
    if (dataId) {
      return dataId;
    }
    
    // Generate a unique ID based on position or other attributes
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
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
      const containers = document.querySelectorAll('[data-e2e="video-wrapper"], .video-card-container');
      const videoInfoList = [];
      
      containers.forEach(container => {
        const videoInfo = getVideoInfo(container);
        if (videoInfo) {
          videoInfoList.push(videoInfo);
        }
      });
      
      sendResponse({ videoList: videoInfoList });
    }
  });
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    downloadButtons.forEach(button => {
      if (button.parentElement) {
        button.parentElement.removeChild(button);
      }
    });
    downloadButtons = [];
    processedVideos.clear();
  });
  
  // Initialize when script loads
  init();
  
})();