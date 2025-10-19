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
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
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
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('Please select a .txt file');
            return;
        }

        this.showLoading();

        try {
            const content = await this.readFile(file);
            this.parser.parseFile(content);
            this.displayResults();
        } catch (error) {
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
    }

    /**
     * Display statistics dashboard
     */
    displayStatistics() {
        const stats = this.parser.getStatistics();
        const statsGrid = document.getElementById('statsGrid');
        
        statsGrid.innerHTML = `
            <div class="stat-item">
                <span class="stat-number">${stats.totalNotes}</span>
                <span class="stat-label">Total Notes</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.totalBooks}</span>
                <span class="stat-label">Books</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.highlights}</span>
                <span class="stat-label">Highlights</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.bookmarks}</span>
                <span class="stat-label">Bookmarks</span>
            </div>
            <div class="stat-item">
                <span class="stat-number">${stats.notes}</span>
                <span class="stat-label">Notes</span>
            </div>
        `;

        document.getElementById('statsCard').style.display = 'block';
    }

    /**
     * Display books grid
     * @param {Object} booksToShow - Books to display (optional)
     */
    displayBooks(booksToShow = null) {
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
                <div class="book-card" onclick="app.showBookNotes('${this.escapeHtml(title)}')">
                    <div class="book-title">${this.escapeHtml(cleanTitle)}</div>
                    <div class="book-author">by ${this.escapeHtml(author)}</div>
                    <div class="book-stats">
                        <span class="book-stat">${notes.length} total</span>
                        <span class="book-stat">${highlightCount} highlights</span>
                        <span class="book-stat">${bookmarkCount} bookmarks</span>
                        <span class="book-stat">${noteCount} notes</span>
                    </div>
                </div>
            `;
        }).join('');
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
            <h2 class="book-title">${this.escapeHtml(cleanTitle)}</h2>
            <p class="book-author">by ${this.escapeHtml(author)}</p>
            <div class="book-stats">
                <span class="book-stat">${notes.length} notes • Sorted by location</span>
            </div>
            <button class="btn btn-success" onclick="app.copyBookHighlights('${this.escapeHtml(bookTitle)}')">
                📋 Copy All Highlights
            </button>
        `;

        // Display notes
        const notesContainer = document.getElementById('notesContainer');
        notesContainer.innerHTML = sortedNotes.map(note => {
            const noteClass = note.noteType.toLowerCase();
            const content = note.content.trim() || '[No content]';
            const isEmpty = !note.content.trim();
            
            return `
                <div class="note ${noteClass}">
                    <div class="note-meta">
                        <div>
                            <span class="note-type-badge ${noteClass}">${note.noteType}</span>
                            <span style="margin-left: 10px; font-weight: bold; color: #2980b9;">Location ${note.location}</span>
                        </div>
                        <span style="font-style: italic;">${note.dateAdded.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                    <div class="note-content ${isEmpty ? 'empty-note' : ''}">
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