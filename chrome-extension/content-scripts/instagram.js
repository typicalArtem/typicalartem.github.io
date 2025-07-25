// Instagram content script for Social Media Downloader
(function() {
  'use strict';
  
  let downloadButtons = [];
  let processedPosts = new Set();
  
  // Initialize the script
  function init() {
    console.log('Instagram downloader initialized');
    
    // Wait for the page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handlePageLoad);
    } else {
      handlePageLoad();
    }
    
    // Listen for navigation changes (Instagram is a SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        setTimeout(handlePageLoad, 1000);
      }
    }).observe(document, { subtree: true, childList: true });
    
    // Listen for new posts being loaded
    const observer = new MutationObserver(handleDOMChanges);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Handle page load and navigation
  function handlePageLoad() {
    setTimeout(() => {
      if (isPostPage()) {
        addDownloadButtonToPost();
      } else if (isFeedPage()) {
        addDownloadButtonsToFeed();
      }
    }, 1500); // Wait for Instagram to load elements
  }
  
  // Handle DOM changes to catch dynamically loaded content
  function handleDOMChanges(mutations) {
    let shouldCheck = false;
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          if (node.matches && (
            node.matches('article') || 
            node.querySelector('article') ||
            node.matches('[role="main"]')
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
  
  // Check if we're on a post page
  function isPostPage() {
    return location.pathname.startsWith('/p/') || location.pathname.startsWith('/reel/');
  }
  
  // Check if we're on the feed page
  function isFeedPage() {
    return location.pathname === '/' || location.pathname.startsWith('/explore/');
  }
  
  // Add download button to a single post page
  function addDownloadButtonToPost() {
    const article = document.querySelector('article[role="main"], article');
    if (article && !hasDownloadButton(article)) {
      addDownloadButtonToArticle(article);
    }
  }
  
  // Add download buttons to feed posts
  function addDownloadButtonsToFeed() {
    const articles = document.querySelectorAll('article');
    
    articles.forEach(article => {
      if (!hasDownloadButton(article)) {
        addDownloadButtonToArticle(article);
      }
    });
  }
  
  // Check if article already has a download button
  function hasDownloadButton(article) {
    return article.querySelector('.social-downloader-btn') !== null;
  }
  
  // Add download button to a specific article
  function addDownloadButtonToArticle(article) {
    try {
      const mediaInfo = getMediaInfo(article);
      if (!mediaInfo) return;
      
      const postId = getPostId(article);
      if (!postId || processedPosts.has(postId)) return;
      
      processedPosts.add(postId);
      
      // Find appropriate container for the button
      const container = findButtonContainer(article);
      if (!container) return;
      
      // Create and add download button
      const downloadButton = createDownloadButton(mediaInfo);
      container.appendChild(downloadButton);
      downloadButtons.push(downloadButton);
      
      console.log('Download button added for Instagram post:', postId);
      
    } catch (error) {
      console.error('Error adding download button:', error);
    }
  }
  
  // Find appropriate container for the download button
  function findButtonContainer(article) {
    // Try to find the action buttons container
    const selectors = [
      'section > div > div', // Action buttons container
      'section > div', // Alternative container
      'section', // Fallback to section
      'div[role="button"]', // Button containers
    ];
    
    for (const selector of selectors) {
      const containers = article.querySelectorAll(selector);
      for (const container of containers) {
        // Look for containers with like/comment buttons
        if (container.querySelector('svg') && 
            container.closest('section') &&
            !container.querySelector('.social-downloader-btn')) {
          return container;
        }
      }
    }
    
    // Fallback: create our own container
    const section = article.querySelector('section');
    if (section) {
      const div = document.createElement('div');
      div.style.padding = '8px 16px';
      section.appendChild(div);
      return div;
    }
    
    return null;
  }
  
  // Create the download button element
  function createDownloadButton(mediaInfo) {
    const button = document.createElement('button');
    button.className = 'social-downloader-btn social-downloader-instagram';
    button.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      <span>Download</span>
    `;
    
    button.addEventListener('click', (event) => handleDownloadClick(event, mediaInfo));
    
    return button;
  }
  
  // Handle download button click
  async function handleDownloadClick(event, mediaInfo) {
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
          platform: 'instagram',
          quality: 'best',
          format: mediaInfo.type === 'video' ? 'video' : 'image',
          title: mediaInfo.caption || 'Instagram Post',
          thumbnail: mediaInfo.thumbnail,
          mediaUrl: mediaInfo.url
        }
      });
      
      if (response.success) {
        showToast('Download Started', `Downloading Instagram ${mediaInfo.type}`, 'success');
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
  
  // Extract media information from article
  function getMediaInfo(article) {
    try {
      let mediaUrl = null;
      let type = 'image';
      let thumbnail = null;
      
      // Try to find video first
      const video = article.querySelector('video');
      if (video && video.src) {
        mediaUrl = video.src;
        type = 'video';
        thumbnail = video.poster;
      } else {
        // Look for image
        const img = article.querySelector('img[src*="scontent"], img[alt]');
        if (img && img.src) {
          mediaUrl = img.src;
          type = 'image';
          thumbnail = img.src;
        }
      }
      
      if (!mediaUrl) return null;
      
      // Try to get caption
      let caption = '';
      const captionElement = article.querySelector('[data-testid="post-description"], span[dir="auto"]');
      if (captionElement) {
        caption = captionElement.textContent.trim();
      }
      
      return {
        url: mediaUrl,
        type: type,
        caption: caption,
        thumbnail: thumbnail
      };
      
    } catch (error) {
      console.error('Error extracting media info:', error);
      return null;
    }
  }
  
  // Get post ID from URL or article
  function getPostId(article) {
    // Try to get from URL if on post page
    const match = location.pathname.match(/\/p\/([^\/]+)/);
    if (match) {
      return match[1];
    }
    
    // Try to get from article link
    const link = article.querySelector('a[href*="/p/"]');
    if (link) {
      const linkMatch = link.href.match(/\/p\/([^\/]+)/);
      if (linkMatch) {
        return linkMatch[1];
      }
    }
    
    // Generate a unique ID based on image src or other attributes
    const img = article.querySelector('img');
    if (img && img.src) {
      return btoa(img.src).slice(0, 10);
    }
    
    return null;
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
    if (message.type === 'GET_MEDIA_INFO') {
      const articles = document.querySelectorAll('article');
      const mediaInfoList = [];
      
      articles.forEach(article => {
        const mediaInfo = getMediaInfo(article);
        if (mediaInfo) {
          mediaInfoList.push(mediaInfo);
        }
      });
      
      sendResponse({ mediaList: mediaInfoList });
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
    processedPosts.clear();
  });
  
  // Initialize when script loads
  init();
  
})();