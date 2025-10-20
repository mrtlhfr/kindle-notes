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
     * Validate file before processing
     * @param {File} file - File to validate
     * @returns {Object} Validation result {valid: boolean, error?: string, title?: string}
     */
    validateFile(file) {
        // Check if file exists
        if (!file) {
            return {
                valid: false,
                error: 'No file was selected. Please choose a file to upload.',
                title: 'No File Selected'
            };
        }

        // File type validation (more comprehensive)
        const fileName = file.name.toLowerCase();
        const allowedExtensions = ['.txt'];
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            return {
                valid: false,
                error: `Invalid file type. Please select a .txt file. Your file: "${file.name}"`,
                title: 'Invalid File Type'
            };
        }

        // File size validation (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
            return {
                valid: false,
                error: `File too large (${fileSizeMB}MB). Maximum file size is 50MB. Please try with a smaller file.`,
                title: 'File Size Limit Exceeded'
            };
        }

        // Minimum file size check (empty file detection)
        if (file.size === 0) {
            return {
                valid: false,
                error: 'The selected file is empty. Please choose a file that contains Kindle notes.',
                title: 'Empty File'
            };
        }

        // Very small file warning (likely not a proper Kindle notes file)
        if (file.size < 100) { // Less than 100 bytes
            return {
                valid: false,
                error: 'This file appears to be too small to contain Kindle notes. A typical My Clippings.txt file should be at least a few hundred bytes.',
                title: 'File Too Small'
            };
        }

        return { valid: true };
    }

    /**
     * Validate file content format
     * @param {string} content - File content to validate
     * @returns {Object} Validation result {valid: boolean, error?: string, title?: string, warning?: string}
     */
    validateContent(content) {
        // Check if content exists and is not just whitespace
        if (!content || content.trim().length === 0) {
            return {
                valid: false,
                error: 'The file appears to be empty or contains only whitespace. Please check that your My Clippings.txt file contains notes.',
                title: 'Empty File Content'
            };
        }

        // Check for proper Kindle format (contains separators)
        const separators = content.match(/==========/g);
        if (!separators || separators.length === 0) {
            return {
                valid: false,
                error: 'This file does not appear to be a valid Kindle My Clippings.txt file. Kindle notes should be separated by "==========" lines.',
                title: 'Invalid File Format'
            };
        }

        // Check for reasonable content structure
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        if (lines.length < 3) {
            return {
                valid: false,
                error: 'This file does not contain enough content to be a valid Kindle notes file. Each note should have at least a title, metadata, and content.',
                title: 'Insufficient Content'
            };
        }

        // Look for typical Kindle patterns
        const hasKindlePatterns = /- Your (Highlight|Note|Bookmark) on/i.test(content) ||
                                /Added on \w+day,/i.test(content) ||
                                /Location \d+/i.test(content);

        if (!hasKindlePatterns) {
            return {
                valid: true,
                warning: 'This file may not be in the standard Kindle format, but we\'ll try to parse it. If you get unexpected results, please ensure you\'re using the My Clippings.txt file from your Kindle device.'
            };
        }

        return { valid: true };
    }

    /**
     * Handle file upload and processing with comprehensive error handling
     * @param {File} file - Selected file
     */
    async handleFile(file) {
        const totalStartTime = performance.now();
        
        // Clear any existing notifications
        this.clearNotifications();
        
        // Log file info for debugging
        if (file) {
            console.log(`📁 Processing file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        }

        // Step 1: File validation
        const fileValidation = this.validateFile(file);
        if (!fileValidation.valid) {
            this.showError(fileValidation.error, fileValidation.title);
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Step 2: Read file content
            const readStartTime = performance.now();
            const content = await this.readFile(file);
            const readTime = performance.now() - readStartTime;
            console.log(`📖 File read in ${readTime.toFixed(2)}ms`);

            // Step 3: Content validation
            const contentValidation = this.validateContent(content);
            if (!contentValidation.valid) {
                this.hideLoading();
                this.showError(contentValidation.error, contentValidation.title);
                return;
            }

            // Show warning if content format is questionable
            if (contentValidation.warning) {
                this.showWarning(contentValidation.warning, 'Format Warning');
            }

            // Step 4: Parse the content
            const parseStartTime = performance.now();
            this.parser.parseFile(content);
            const parseTime = performance.now() - parseStartTime;
            console.log(`⚡ Parsing completed in ${parseTime.toFixed(2)}ms`);

            // Step 5: Validate parsing results
            if (this.parser.notes.length === 0) {
                this.hideLoading();
                this.showError(
                    'No valid Kindle notes were found in this file. Please ensure you\'re using the correct "My Clippings.txt" file from your Kindle device. The file should contain highlights, notes, or bookmarks separated by "==========" lines.',
                    'No Notes Found'
                );
                
                // Provide helpful guidance
                setTimeout(() => {
                    this.showInfo(
                        'To export your notes: Connect your Kindle to your computer, navigate to the "documents" folder, and copy the "My Clippings.txt" file.',
                        'How to Get Your Notes',
                        10000
                    );
                }, 1000);
                return;
            }

            // Step 6: Display results
            const displayStartTime = performance.now();
            this.displayResults();
            const displayTime = performance.now() - displayStartTime;
            console.log(`🎨 UI rendered in ${displayTime.toFixed(2)}ms`);

            // Step 7: Success notification and performance logging
            const totalTime = performance.now() - totalStartTime;
            const stats = this.parser.getStatistics();
            
            this.showSuccess(
                `Successfully parsed ${stats.totalNotes} notes from ${stats.totalBooks} books! Found ${stats.highlights} highlights, ${stats.notes} notes, and ${stats.bookmarks} bookmarks.`,
                'File Processed Successfully'
            );

            // Performance logging
            console.log(`🏁 Total processing time: ${totalTime.toFixed(2)}ms`);
            console.log(`📊 Performance breakdown: Read(${((readTime/totalTime)*100).toFixed(1)}%) + Parse(${((parseTime/totalTime)*100).toFixed(1)}%) + Display(${((displayTime/totalTime)*100).toFixed(1)}%)`);
            
            // Update page title for accessibility
            this.updatePageTitle(`Kindle Notes Parser - ${stats.totalBooks} Books Loaded`);

        } catch (error) {
            this.hideLoading();
            console.error('❌ File processing failed:', error);
            
            // Enhanced error handling with specific error types
            if (error.name === 'NotReadableError' || error.message.includes('read')) {
                this.showError(
                    'Unable to read the selected file. The file might be corrupted or in use by another application.',
                    'File Reading Error'
                );
            } else if (error.name === 'SecurityError') {
                this.showError(
                    'Security restrictions prevent reading this file. Please try selecting the file again.',
                    'Security Error'
                );
            } else if (error.name === 'AbortError') {
                this.showWarning('File reading was cancelled.', 'Operation Cancelled');
            } else {
                // Generic error with helpful suggestions
                this.showError(
                    `An unexpected error occurred while processing your file: ${error.message}. Please try again, or contact support if the problem persists.`,
                    'Processing Error'
                );
            }

            // Provide recovery suggestions
            setTimeout(() => {
                this.showInfo(
                    'Try these steps: 1) Ensure the file is not open in another program, 2) Check that the file is a valid .txt file, 3) Try with a smaller file to test.',
                    'Troubleshooting Tips',
                    8000
                );
            }, 2000);
        }
    }

    /**
     * Read file content as text with enhanced error handling
     * @param {File} file - File to read
     * @returns {Promise<string>} File content
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            // Validate file parameter
            if (!file) {
                reject(new Error('No file provided for reading'));
                return;
            }

            const reader = new FileReader();
            
            // Set up event handlers
            reader.onload = (e) => {
                const content = e.target.result;
                
                // Validate that we got content
                if (content === null || content === undefined) {
                    reject(new Error('File content is empty or unreadable'));
                    return;
                }
                
                resolve(content);
            };

            reader.onerror = (e) => {
                // Provide more specific error messages based on the error
                const error = e.target.error;
                let errorMessage = 'Failed to read file';
                
                if (error) {
                    switch (error.name) {
                        case 'NotReadableError':
                            errorMessage = 'The file could not be read. It may be corrupted or locked by another application.';
                            break;
                        case 'SecurityError':
                            errorMessage = 'Access to the file was denied for security reasons.';
                            break;
                        case 'NotFoundError':
                            errorMessage = 'The file could not be found.';
                            break;
                        case 'AbortError':
                            errorMessage = 'File reading was aborted.';
                            break;
                        default:
                            errorMessage = `File reading failed: ${error.message || 'Unknown error'}`;
                    }
                }
                
                reject(new Error(errorMessage));
            };

            reader.onabort = () => {
                reject(new Error('File reading was cancelled'));
            };

            // Set timeout for large files (30 second timeout)
            const timeout = setTimeout(() => {
                reader.abort();
                reject(new Error('File reading timed out. The file may be too large or corrupted.'));
            }, 30000);

            // Clear timeout on success or error
            const originalOnload = reader.onload;
            const originalOnerror = reader.onerror;
            
            reader.onload = (e) => {
                clearTimeout(timeout);
                originalOnload(e);
            };
            
            reader.onerror = (e) => {
                clearTimeout(timeout);
                originalOnerror(e);
            };

            // Start reading the file as UTF-8 text
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (error) {
                clearTimeout(timeout);
                reject(new Error(`Failed to start reading file: ${error.message}`));
            }
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
            this.showWarning(
                `No highlights were found in "${bookTitle}". This book may only contain notes or bookmarks.`,
                'No Highlights Available'
            );
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
        }).catch((error) => {
            console.error('Clipboard copy failed:', error);
            this.showError(
                'Could not copy to clipboard. This may be due to browser security restrictions. Please manually select and copy the text.',
                'Clipboard Error'
            );
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
            this.showWarning(
                'No highlights were found in your notes. Your file may contain only notes and bookmarks, which are not included in the highlights export.',
                'No Highlights to Export'
            );
            return;
        }

        this.downloadTextFile('all_kindle_highlights.txt', allHighlights);
        
        // Show success notification
        const highlightCount = this.parser.notes.filter(n => n.noteType === 'Highlight' && n.content.trim()).length;
        this.showSuccess(
            `Successfully exported ${highlightCount} highlights to "all_kindle_highlights.txt"`,
            'Export Complete'
        );
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
     * Show error notification with enhanced UX
     * @param {string} message - Error message to display
     * @param {string} title - Error title (optional)
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    showError(message, title = 'Error', duration = 8000) {
        this.showNotification('error', '❌', title, message, duration);
        this.announceToScreenReader(`Error: ${title}. ${message}`, 'assertive');
        
        // Add error state to upload area briefly
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('error');
            setTimeout(() => uploadArea.classList.remove('error'), 3000);
        }
    }

    /**
     * Show warning notification
     * @param {string} message - Warning message to display
     * @param {string} title - Warning title (optional)
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    showWarning(message, title = 'Warning', duration = 6000) {
        this.showNotification('warning', '⚠️', title, message, duration);
        this.announceToScreenReader(`Warning: ${title}. ${message}`, 'polite');
    }

    /**
     * Show success notification
     * @param {string} message - Success message to display  
     * @param {string} title - Success title (optional)
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    showSuccess(message, title = 'Success', duration = 4000) {
        this.showNotification('success', '✅', title, message, duration);
        this.announceToScreenReader(`Success: ${title}. ${message}`, 'polite');
        
        // Add success state to upload area briefly
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('success');
            setTimeout(() => uploadArea.classList.remove('success'), 2000);
        }
    }

    /**
     * Show info notification
     * @param {string} message - Info message to display
     * @param {string} title - Info title (optional)
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    showInfo(message, title = 'Info', duration = 5000) {
        this.showNotification('info', 'ℹ️', title, message, duration);
        this.announceToScreenReader(`${title}. ${message}`, 'polite');
    }

    /**
     * Create and show a notification
     * @param {string} type - Notification type (error, warning, success, info)
     * @param {string} icon - Icon to display
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    showNotification(type, icon, title, message, duration = 5000) {
        // Remove any existing notifications of the same type
        const existingNotifications = document.querySelectorAll(`.notification.${type}`);
        existingNotifications.forEach(notification => notification.remove());

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

        // Create notification content
        notification.innerHTML = `
            <div class="notification-icon" aria-hidden="true">${icon}</div>
            <div class="notification-content">
                <div class="notification-title">${this.escapeHtml(title)}</div>
                <div class="notification-message">${this.escapeHtml(message)}</div>
            </div>
            <button class="notification-close" aria-label="Dismiss notification" type="button">×</button>
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Show animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Set up close button
        const closeBtn = notification.querySelector('.notification-close');
        const closeNotification = () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', closeNotification);

        // Auto-dismiss if duration is set
        if (duration > 0) {
            setTimeout(() => {
                if (notification.classList.contains('show')) {
                    closeNotification();
                }
            }, duration);
        }

        // Keyboard support
        closeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                closeNotification();
            }
        });

        return notification;
    }

    /**
     * Clear all notifications
     */
    clearNotifications() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }

    /**
     * Handle and format error objects with detailed information
     * @param {Error|string} error - Error object or message
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = 'Unknown') {
        console.error(`❌ Error in ${context}:`, error);
        
        let message = 'An unexpected error occurred.';
        let title = 'Error';
        
        if (typeof error === 'string') {
            message = error;
        } else if (error instanceof Error) {
            message = error.message;
            
            // Provide more specific error titles based on error type
            if (error.name === 'TypeError') {
                title = 'Type Error';
            } else if (error.name === 'ReferenceError') {
                title = 'Reference Error';
            } else if (error.name === 'SyntaxError') {
                title = 'Syntax Error';
            } else {
                title = error.name || 'Error';
            }
        }
        
        this.showError(message, title);
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