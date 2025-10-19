/**
 * KindleNotesApp
 * Main application class that handles UI interactions and file processing
 */

class KindleNotesApp {
    constructor() {
        this.parser = new KindleNotesParser();
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners for the application
     */
    initializeEventListeners() {
        // File upload events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Keyboard support for upload area
        uploadArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInput.click();
            }
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
            uploadArea.setAttribute('aria-label', 'Drop file here to upload');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
            uploadArea.setAttribute('aria-label', 'Upload Kindle notes file');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            uploadArea.setAttribute('aria-label', 'Upload Kindle notes file');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });

        // Search and filter events
        document.getElementById('searchBox').addEventListener('input', (e) => {
            this.filterBooks(e.target.value, document.getElementById('typeFilter').value);
        });

        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.filterBooks(document.getElementById('searchBox').value, e.target.value);
        });

        // Button events
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showBooksView();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('exportAllBtn').addEventListener('click', () => {
            this.exportAllHighlights();
        });
    }

    /**
     * Handle file upload and processing
     * @param {File} file - Selected file
     */
    async handleFile(file) {
        const totalStartTime = performance.now();
        console.log(`📁 Processing file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('Please select a .txt file');
            return;
        }

        this.showLoading();

        try {
            const readStartTime = performance.now();
            const content = await this.readFile(file);
            const readTime = performance.now() - readStartTime;
            console.log(`📖 File read in ${readTime.toFixed(2)}ms`);
            
            this.parser.parseFile(content);
            
            const displayStartTime = performance.now();
            this.displayResults();
            const displayTime = performance.now() - displayStartTime;
            console.log(`🎨 UI rendered in ${displayTime.toFixed(2)}ms`);
            
            const totalTime = performance.now() - totalStartTime;
            console.log(`🏁 Total processing time: ${totalTime.toFixed(2)}ms`);
            console.log(`📊 Performance breakdown: Read(${((readTime/totalTime)*100).toFixed(1)}%) + Parse(${(((window.lastParsingStats?.processingTime || 0)/totalTime)*100).toFixed(1)}%) + Display(${((displayTime/totalTime)*100).toFixed(1)}%)`);
            
        } catch (error) {
            console.error('❌ File processing failed:', error);
            alert('Error reading file: ' + error.message);
            this.hideLoading();
        }
    }

    /**
     * Read file content as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    /**
     * Show loading state
     */
    showLoading() {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
        this.hideResults();
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'block';
    }

    /**
     * Display parsed results
     */
    displayResults() {
        this.hideLoading();
        this.displayStatistics();
        this.displayBooks();
        this.showResults();
        
        // Announce results to screen readers
        const stats = this.parser.getStatistics();
        this.announceToScreenReader(`Processing complete. Found ${stats.totalNotes} notes from ${stats.totalBooks} books.`);
    }

    /**
     * Display statistics dashboard
     */
    displayStatistics() {
        const statsStartTime = performance.now();
        const stats = this.parser.getStatistics();
        const statsGrid = document.getElementById('statsGrid');
        
        statsGrid.innerHTML = `
            <div class="stat-item" role="listitem" aria-label="${stats.totalNotes} total notes">
                <span class="stat-number" aria-hidden="true">${stats.totalNotes}</span>
                <span class="stat-label" aria-hidden="true">Total Notes</span>
            </div>
            <div class="stat-item" role="listitem" aria-label="${stats.totalBooks} books">
                <span class="stat-number" aria-hidden="true">${stats.totalBooks}</span>
                <span class="stat-label" aria-hidden="true">Books</span>
            </div>
            <div class="stat-item" role="listitem" aria-label="${stats.highlights} highlights">
                <span class="stat-number" aria-hidden="true">${stats.highlights}</span>
                <span class="stat-label" aria-hidden="true">Highlights</span>
            </div>
            <div class="stat-item" role="listitem" aria-label="${stats.bookmarks} bookmarks">
                <span class="stat-number" aria-hidden="true">${stats.bookmarks}</span>
                <span class="stat-label" aria-hidden="true">Bookmarks</span>
            </div>
            <div class="stat-item" role="listitem" aria-label="${stats.notes} notes">
                <span class="stat-number" aria-hidden="true">${stats.notes}</span>
                <span class="stat-label" aria-hidden="true">Notes</span>
            </div>
        `;

        document.getElementById('statsCard').style.display = 'block';
        const statsTime = performance.now() - statsStartTime;
        console.log(`📊 Statistics rendered in ${statsTime.toFixed(2)}ms`);
    }

    /**
     * Display books grid
     * @param {Object} booksToShow - Books to display (optional)
     */
    displayBooks(booksToShow = null) {
        const booksStartTime = performance.now();
        const books = booksToShow || this.parser.books;
        const booksGrid = document.getElementById('booksGrid');

        if (Object.keys(books).length === 0) {
            booksGrid.innerHTML = '<div class="no-results">No books found matching your search criteria.</div>';
            return;
        }

        // Sort books by note count (descending)
        const sortedBooks = Object.entries(books).sort((a, b) => b[1].length - a[1].length);

        booksGrid.innerHTML = sortedBooks.map(([title, notes]) => {
            const author = notes[0].author;
            const cleanTitle = this.parser.cleanBookTitle(title, author);
            const highlightCount = notes.filter(n => n.noteType === 'Highlight').length;
            const bookmarkCount = notes.filter(n => n.noteType === 'Bookmark').length;
            const noteCount = notes.filter(n => n.noteType === 'Note').length;

            return `
                <div class="book-card" 
                     role="listitem"
                     tabindex="0"
                     onclick="app.showBookNotes('${this.escapeHtml(title)}')"
                     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();app.showBookNotes('${this.escapeHtml(title)}');}"
                     aria-label="View notes for ${this.escapeHtml(cleanTitle)} by ${this.escapeHtml(author)}, ${notes.length} notes total">
                    <div class="book-title">${this.escapeHtml(cleanTitle)}</div>
                    <div class="book-author">by ${this.escapeHtml(author)}</div>
                    <div class="book-stats">
                        <span class="book-stat" role="text">${notes.length} total</span>
                        <span class="book-stat" role="text">${highlightCount} highlights</span>
                        <span class="book-stat" role="text">${bookmarkCount} bookmarks</span>
                        <span class="book-stat" role="text">${noteCount} notes</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const booksTime = performance.now() - booksStartTime;
        console.log(`📚 Books grid rendered in ${booksTime.toFixed(2)}ms (${Object.keys(books).length} books)`);
    }

    /**
     * Show detailed notes view for a specific book
     * @param {string} bookTitle - Title of the book
     */
    showBookNotes(bookTitle) {
        const notes = this.parser.books[bookTitle];
        if (!notes) return;

        const sortedNotes = this.parser.sortNotesByLocation(notes);
        const author = notes[0].author;
        const cleanTitle = this.parser.cleanBookTitle(bookTitle, author);

        // Update header
        const notesHeader = document.getElementById('notesHeader');
        notesHeader.innerHTML = `
            <h2 class="book-title" id="book-title">${this.escapeHtml(cleanTitle)}</h2>
            <p class="book-author">by ${this.escapeHtml(author)}</p>
            <div class="book-stats">
                <span class="book-stat">${notes.length} notes • Sorted by location</span>
            </div>
            <button class="btn btn-success" 
                    onclick="app.copyBookHighlights('${this.escapeHtml(bookTitle)}')"
                    aria-label="Copy all highlights from ${this.escapeHtml(cleanTitle)}">
                📋 Copy All Highlights
            </button>
        `;
        
        // Update page title and announce to screen readers
        this.updatePageTitle(`${cleanTitle} - Kindle Notes Parser`);
        this.announceToScreenReader(`Viewing ${notes.length} notes from ${cleanTitle} by ${author}`);

        // Display notes
        const notesContainer = document.getElementById('notesContainer');
        notesContainer.innerHTML = sortedNotes.map((note, index) => {
            const noteClass = note.noteType.toLowerCase();
            const content = note.content.trim() || '[No content]';
            const isEmpty = !note.content.trim();
            const formattedDate = note.dateAdded.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            return `
                <div class="note ${noteClass}" 
                     role="listitem" 
                     aria-labelledby="note-heading-${index}"
                     tabindex="0">
                    <div class="note-meta">
                        <div>
                            <span class="note-type-badge ${noteClass}" aria-label="${note.noteType} note">${note.noteType}</span>
                            <span style="margin-left: 10px; font-weight: bold; color: var(--accent-primary);">Location ${note.location}</span>
                        </div>
                        <span style="font-style: italic;" aria-label="Added on ${formattedDate}">${formattedDate}</span>
                    </div>
                    <div id="note-heading-${index}" class="sr-only">
                        ${note.noteType} at location ${note.location} from ${formattedDate}
                    </div>
                    <div class="note-content ${isEmpty ? 'empty-note' : ''}" role="text">
                        ${this.escapeHtml(content)}
                    </div>
                </div>
            `;
        }).join('');

        this.showNotesView();
    }

    /**
     * Filter books by search query and type
     * @param {string} query - Search query
     * @param {string} typeFilter - Type filter
     */
    filterBooks(query, typeFilter) {
        const filteredBooks = this.parser.getBooksBySearch(query, typeFilter);
        this.displayBooks(filteredBooks);
    }

    /**
     * Copy all highlights from a book to clipboard
     * @param {string} bookTitle - Title of the book
     */
    copyBookHighlights(bookTitle) {
        const notes = this.parser.books[bookTitle];
        const highlights = notes.filter(n => n.noteType === 'Highlight' && n.content.trim());
        const highlightsText = highlights.map(n => n.content.trim()).join('\n\n');

        if (!highlightsText) {
            alert('No highlights found in this book.');
            return;
        }

        this.copyToClipboard(highlightsText).then(() => {
            const btn = event.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '✅ Copied to Clipboard!';
            btn.classList.add('copy-success');
            
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('copy-success');
            }, 2000);
        }).catch(() => {
            alert('Could not copy to clipboard. Please select and copy the text manually.');
        });
    }

    /**
     * Export all highlights to a downloadable file
     */
    exportAllHighlights() {
        const allHighlights = this.parser.notes
            .filter(n => n.noteType === 'Highlight' && n.content.trim())
            .map(n => `${this.parser.cleanBookTitle(n.bookTitle, n.author)}\n${n.content.trim()}`)
            .join('\n\n---\n\n');

        if (!allHighlights) {
            alert('No highlights found to export.');
            return;
        }

        this.downloadTextFile('all_kindle_highlights.txt', allHighlights);
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise} Copy promise
     */
    async copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    }

    /**
     * Download text as file
     * @param {string} filename - File name
     * @param {string} content - File content
     */
    downloadTextFile(filename, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Show results view
     */
    showResults() {
        document.getElementById('controls').style.display = 'block';
        document.getElementById('results').style.display = 'block';
        document.getElementById('notesView').style.display = 'none';
        
        // Reset page title when showing main results
        this.updatePageTitle('Kindle Notes Parser - Web App');
    }

    /**
     * Show books view
     */
    showBooksView() {
        document.getElementById('results').style.display = 'block';
        document.getElementById('notesView').style.display = 'none';
    }

    /**
     * Show notes view
     */
    showNotesView() {
        document.getElementById('results').style.display = 'none';
        document.getElementById('notesView').style.display = 'block';
    }

    /**
     * Hide all result views
     */
    hideResults() {
        document.getElementById('statsCard').style.display = 'none';
        document.getElementById('controls').style.display = 'none';
        document.getElementById('results').style.display = 'none';
        document.getElementById('notesView').style.display = 'none';
    }

    /**
     * Reset application to initial state
     */
    reset() {
        this.hideResults();
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('searchBox').value = '';
        document.getElementById('typeFilter').value = 'all';
        document.getElementById('fileInput').value = '';
    }

    /**
     * Get performance summary for the current session
     * @returns {Object} Performance statistics
     */
    getPerformanceSummary() {
        if (window.lastParsingStats) {
            return {
                ...window.lastParsingStats,
                timestamp: new Date().toISOString(),
                averageNotesPerBook: (window.lastParsingStats.notesCount / window.lastParsingStats.booksCount).toFixed(1),
                memoryEstimate: `${(window.lastParsingStats.fileSize / 1024 / 1024).toFixed(2)}MB processed`
            };
        }
        return null;
    }

    /**
     * Log performance summary to console
     */
    logPerformanceSummary() {
        const summary = this.getPerformanceSummary();
        if (summary) {
            console.log('📋 Performance Summary:');
            console.table(summary);
        }
    }

    /**
     * Announce message to screen readers using live region
     * @param {string} message - Message to announce
     * @param {string} priority - 'polite' or 'assertive'
     */
    announceToScreenReader(message, priority = 'polite') {
        // Create or update live region
        let liveRegion = document.getElementById('live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'live-region';
            liveRegion.setAttribute('aria-live', priority);
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'sr-only';
            document.body.appendChild(liveRegion);
        }
        
        // Clear and set new message
        liveRegion.textContent = '';
        setTimeout(() => {
            liveRegion.textContent = message;
        }, 100);
    }

    /**
     * Update page title for screen readers and browser tab
     * @param {string} title - New page title
     */
    updatePageTitle(title) {
        document.title = title;
    }

    /**
     * Escape HTML characters in text
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KindleNotesApp;
}