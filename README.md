# Kindle Notes Parser 📚

A modern, browser-based web application for parsing and analyzing your Kindle "My Clippings.txt" file. Upload your notes file and instantly organize, search, and explore your highlights. The parsing and analysis is performed in your browser, your content does not leave your computer.

## 🚀 Live Demo

**[Try it now!](https://mrtlhfr.github.io/kindle-notes/)** 

Upload your Kindle notes and start exploring right away!

No installation required - just upload your Kindle notes file and start exploring!

## 🌟 Features

- **🌐 Modern Web Interface**: Single-page application with drag & drop upload
- **📱 No Installation Required**: Runs entirely in your browser
- **Parse Kindle notes**: Automatically extract book titles, authors, highlights, bookmarks, and metadata  
- **📚 Organize by book**: Group notes by book title for easy browsing
- **🔍 Real-time Search**: Find notes containing specific keywords across all content
- **📊 Statistical Dashboard**: Get insights into your reading habits
- **📋 Export capabilities**: Copy to clipboard or download as text files
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **🔒 Privacy-first**: All processing happens client-side, no data leaves your device
- **🎨 Dark/Light Theme**: Automatic system preference detection with manual toggle

## 📁 Project Structure

### 🏗️ Development Files (Modular)
```
src/
├── index.html              # Clean HTML structure
├── styles.css              # All CSS styles (~400 lines)
└── js/
    ├── models.js           # KindleNote data model
    ├── parser.js           # Core parsing logic
    ├── app.js              # UI management & interactions  
    └── main.js             # Application initialization
```

### 📦 Production Files
- `kindle-notes-web-app.html` - **Single-file app** (built from src/)
- `package.json` - npm configuration and scripts
- `scripts/build.js` - Build script to combine modules

### 📚 Data
- `my-clippings.txt` - Your Kindle notes file (export from Kindle)

## Quick Start 🚀

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm start          # Opens browser automatically at http://localhost:8080
```

### 3. Upload Your Notes
Simply **drag & drop** your `My Clippings.txt` file into the browser!

## 📋 Available Scripts

### 🚀 Development
| Command | Description | Serves | Port | Auto-open |
|---------|-------------|--------|------|-----------|
| `npm run dev` | **Development mode** (modular) | `src/` | 8080 | ✅ |
| `npm run dev:watch` | Development with live-reload | `src/` | 8080 | ✅ |

### 🏗️ Production  
| Command | Description | Output |
|---------|-------------|---------|
| `npm run build` | **Build single-file app** | `kindle-notes-web-app.html` |
| `npm run build:serve` | Build and serve | Combined file |
| `npm start` | Serve production app | Single file |
| `npm run preview` | Preview on different port | Single file |

### 💡 Development Workflow
```bash
# 1. Develop with modular files (easier to maintain)
npm run dev

# 2. Build for production (single file for easy deployment)
npm run build

# 3. Test production build
npm start
```

## 🎯 Why Modular + Single File?

### ✅ **Development Benefits**
- **📝 Better Code Organization**: Separate concerns (models, parsing, UI)
- **🔧 Easier Maintenance**: Find and fix issues in specific modules  
- **👥 Team Collaboration**: Multiple developers can work on different files
- **🛠️ Better Tooling**: IDE support, syntax highlighting, debugging

### ✅ **Deployment Benefits**  
- **📦 Single File Deploy**: `kindle-notes-web-app.html` works anywhere
- **🌐 No Dependencies**: Production app has no external file dependencies
- **🚀 Easy Sharing**: One file to send, upload, or host
- **📱 Offline Ready**: Self-contained file works without internet

## 🌐 How to Use the Web App

1. **📁 Upload**: Drag and drop your `My Clippings.txt` file or click to browse
2. **📊 Overview**: See your reading statistics - total notes, books, highlights, etc.
3. **🔍 Search**: Use the search box to find specific books, authors, or content
4. **🏷️ Filter**: Filter by note type (All, Highlights, Bookmarks, Notes)
5. **📚 Browse**: Click on any book card to view all its notes
6. **📋 Export**: Copy highlights to clipboard or download as text files

## 🎯 Key Features

### 📊 Statistics Dashboard
- Total notes, books, highlights, and bookmarks count
- Visual overview of your reading activity
- Instant statistics calculation

### 🔍 Advanced Search & Filtering
- **Real-time search** across all content
- Search by book title, author, or note content
- **Filter by type**: View only highlights, bookmarks, or notes
- **Instant results** as you type

### 📚 Book Organization
- Books sorted by number of notes (most active first)
- Clean book titles with author extraction
- Note counts and type breakdown per book
- Click to view detailed notes from any book

### 📝 Note Management
- **Location-based sorting**: Notes ordered by their position in the book
- **Type identification**: Clear badges for Highlights, Bookmarks, and Notes
- **Date information**: When each note was created
- **Clean display**: Formatted content with proper spacing

### 📋 Export & Copy Features
- **One-click copy**: Copy all highlights from a book to clipboard
- **Bulk export**: Download all highlights as a text file
- **Easy sharing**: Perfect for creating study materials or sharing insights

### 🎨 Theme System
- **Automatic Detection**: Respects your system's light/dark mode preference
- **Manual Toggle**: Click the theme button (🌙/☀️) to switch between modes
- **Persistent Preferences**: Your theme choice is saved and restored
- **Smooth Transitions**: Elegant theme switching with CSS transitions
- **Comprehensive Styling**: All UI elements adapt to the selected theme

## 📄 Supported File Format

The app expects the standard Kindle "My Clippings.txt" format:

```
Book_Title (Author Name)
- Your Highlight on Location 123-125 | Added on Monday, January 1, 2024 12:00:00 PM

This is the highlighted text from the book.
==========
```

## 🛠️ Requirements

- **Modern Web Browser**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **Node.js 14+**: For development server
- **No additional dependencies**: Everything runs in your browser

## 💡 Tips

1. **Export from Kindle**: Connect your Kindle to computer and copy `documents/My Clippings.txt`
2. **File Size**: The app can handle large files
3. **Search**: Use the search function to quickly find notes on specific topics
4. **Export**: Use copy/export features to create study materials or share insights
5. **Backup**: Keep a backup of your `My Clippings.txt` file
6. **Mobile**: The app works great on tablets and phones for reading on-the-go

## 🚀 Deployment Options

Since this is a static web application, you can deploy it anywhere:

### Static Hosting Services
- **Netlify**: Drag & drop `kindle-notes-web-app.html`
- **Vercel**: Deploy from GitHub repository
- **GitHub Pages**: Upload the HTML file
- **Firebase Hosting**: Deploy as a static site

### Local Development
```bash
# Clone or download the repository
npm install
npm start
```

## 🔧 Troubleshooting

**Common Issues:**

1. **File won't upload**: Make sure it's a `.txt` file and follows Kindle's format
2. **Empty results**: Check if your file contains the standard Kindle separators (`==========`)
3. **Slow performance**: For very large files (>5MB), processing may take a few seconds
4. **Browser compatibility**: Use a modern browser for best performance

**Getting Help:**

If you encounter issues:
1. Check that your `My Clippings.txt` file follows the standard Kindle format
2. Try with a smaller file first to test functionality
3. Ensure your browser supports modern JavaScript features

## License 📝

Free to use and modify for personal use. Happy reading! 📖