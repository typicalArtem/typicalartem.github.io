# Social Media Downloader Chrome Extension

A Chrome extension that allows you to download content from YouTube, Instagram, and TikTok directly from the browser.

## 🚀 Features

- **YouTube Support**: Download videos in various qualities (720p, 480p, 360p) and formats (MP4, MP3)
- **Instagram Support**: Download images, videos, and stories from Instagram posts
- **TikTok Support**: Download TikTok videos with original quality
- **Modern UI**: Beautiful, responsive popup interface with gradient design
- **Download History**: Keep track of your recent downloads
- **Quality Selection**: Choose from different video qualities and formats
- **Real-time Notifications**: Get notified when downloads start and complete
- **Content Detection**: Automatically detects downloadable content on supported platforms

## 📋 Installation

### Method 1: Manual Installation (Developer Mode)

1. **Download the Extension**
   - Clone or download this repository
   - Extract the files to a folder on your computer

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" toggle in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the `chrome-extension` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Social Media Downloader" and click the pin icon

### Method 2: Chrome Web Store (Future)

This extension will be available on the Chrome Web Store after review and approval.

## 🎯 Usage

### YouTube Downloads

1. Navigate to any YouTube video
2. Look for the blue "Download" button next to other action buttons
3. Click the button to start downloading, or use the popup for more options
4. Choose quality and format from the extension popup

### Instagram Downloads

1. Navigate to Instagram feed or specific posts
2. Download buttons will appear on posts with media content
3. Click to download images or videos directly
4. Works on feed, explore page, and individual posts

### TikTok Downloads

1. Navigate to TikTok feed or specific videos
2. Download buttons will appear on video containers
3. Click to download videos with original quality
4. Works on For You page, Following feed, and individual videos

### Extension Popup

1. Click the extension icon in the toolbar
2. View current page detection and download options
3. Select quality and format preferences
4. View download history and manage settings

## ⚙️ Configuration

### Quality Options
- **Best Quality**: Highest available resolution
- **720p**: HD quality (when available)
- **480p**: Standard quality
- **360p**: Lower quality for faster downloads

### Format Options
- **Video (MP4)**: Full video with audio
- **Audio Only (MP3)**: Extract audio only (YouTube)

## 🔧 Technical Details

### Architecture

The extension consists of several components:

1. **Manifest v3**: Modern Chrome extension configuration
2. **Background Service Worker**: Handles downloads and communication
3. **Content Scripts**: Inject download buttons on supported sites
4. **Popup Interface**: User interface for settings and downloads
5. **CSS Styling**: Modern, responsive design

### File Structure

```
chrome-extension/
├── manifest.json              # Extension configuration
├── background.js              # Background service worker
├── popup.html                 # Popup interface HTML
├── popup.js                   # Popup interface JavaScript
├── styles/
│   ├── popup.css             # Popup styling
│   └── content.css           # Content script styling
├── content-scripts/
│   ├── youtube.js            # YouTube content script
│   ├── instagram.js          # Instagram content script
│   └── tiktok.js             # TikTok content script
├── icons/
│   ├── icon-16.png           # 16x16 icon
│   ├── icon-48.png           # 48x48 icon
│   └── icon-128.png          # 128x128 icon
└── README.md                 # This file
```

### Permissions

The extension requests the following permissions:

- `activeTab`: Access to the current tab for content detection
- `storage`: Store download history and settings
- `downloads`: Download files to the user's computer
- `host_permissions`: Access to YouTube, Instagram, and TikTok domains

## ⚠️ Important Notes

### Legal Considerations

- **Respect Copyright**: Only download content you have permission to download
- **Terms of Service**: Be aware of platform terms of service regarding downloading
- **Personal Use**: This extension is intended for personal use only
- **Fair Use**: Understand fair use guidelines in your jurisdiction

### Technical Limitations

- **Platform Changes**: Social media platforms frequently change their structure
- **Rate Limiting**: Platforms may limit download frequency
- **Quality Availability**: Not all qualities are available for all content
- **Authentication**: Some content may require user authentication

### Current Implementation

This is a **demonstration version** with placeholder download functionality. For a production version, you would need to:

1. **Implement Real Extraction**: Use libraries like yt-dlp or platform APIs
2. **Handle Authentication**: Implement proper user authentication
3. **Add Error Handling**: Robust error handling for various scenarios
4. **Optimize Performance**: Implement caching and optimization
5. **Add Security**: Implement security measures and validation

## 🛠️ Development

### Prerequisites

- Chrome/Chromium browser
- Basic knowledge of JavaScript, HTML, CSS
- Understanding of Chrome Extension APIs

### Local Development

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test the changes on supported platforms

### Building for Production

1. Replace placeholder icons with real PNG files
2. Implement real download extraction logic
3. Add proper error handling and validation
4. Test thoroughly on all supported platforms
5. Submit to Chrome Web Store for review

## 🐛 Troubleshooting

### Common Issues

1. **Download Button Not Appearing**
   - Refresh the page
   - Check if you're on a supported platform
   - Ensure the extension is enabled

2. **Downloads Not Working**
   - Check Chrome download permissions
   - Verify internet connection
   - Check browser console for errors

3. **Extension Not Loading**
   - Verify all files are in the correct location
   - Check manifest.json syntax
   - Look for errors in `chrome://extensions/`

### Debug Mode

1. Enable Developer mode in Chrome extensions
2. Click "Inspect views" on the extension
3. Check console for error messages
4. Use Chrome DevTools for debugging

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is provided for educational purposes. Please ensure compliance with:

- Platform terms of service
- Copyright laws
- Local regulations regarding content downloading

## 🔄 Updates

### Version 1.0.0
- Initial release
- Support for YouTube, Instagram, TikTok
- Basic download functionality
- Modern popup interface
- Download history tracking

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review console errors
3. Create an issue in the repository
4. Provide detailed information about the problem

---

**Disclaimer**: This extension is for educational and personal use only. Users are responsible for ensuring compliance with platform terms of service and applicable laws regarding content downloading.