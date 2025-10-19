/**
 * KindleNotesParser
 * Core parsing logic for Kindle "My Clippings.txt" files
 */

class KindleNotesParser {
    constructor() {
        this.notes = [];
        this.books = {};
    }

    /**
     * Parse the entire Kindle notes file content
     * @param {string} content - Raw file content
     */
    parseFile(content) {
        // Split by the separator
        const entries = content.split('==========');
        
        this.notes = [];
        this.books = {};

        entries.forEach(entry => {
            const trimmedEntry = entry.trim();
            if (!trimmedEntry) return;

            const note = this.parseEntry(trimmedEntry);
            if (note) {
                this.notes.push(note);
                
                if (!this.books[note.bookTitle]) {
                    this.books[note.bookTitle] = [];
                }
                this.books[note.bookTitle].push(note);
            }
        });
    }

    /**
     * Parse a single entry from the clippings file
     * @param {string} entry - Single note entry
     * @returns {KindleNote|null} Parsed note or null if invalid
     */
    parseEntry(entry) {
        const lines = entry.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
            return null;
        }

        // Parse book title and author
        const [bookTitle, author] = this.parseTitleAuthor(lines[0]);

        // Parse metadata line
        const [noteType, location, page, dateAdded] = this.parseMetadata(lines[1]);

        // Extract content (everything after the metadata line)
        const content = lines.slice(2).join('\n');

        return new KindleNote(bookTitle, author, noteType, location, page, dateAdded, content);
    }

    /**
     * Parse book title and author from title line
     * @param {string} titleLine - First line of entry
     * @returns {Array} [bookTitle, author]
     */
    parseTitleAuthor(titleLine) {
        // Remove BOM character if present
        titleLine = titleLine.replace(/^\ufeff/, '');

        // Pattern: "Book_Title (Author Name)"
        const match = titleLine.match(/^(.+?)\s*\(([^)]+)\)$/);
        if (match) {
            return [match[1].trim(), match[2].trim()];
        } else {
            // Fallback if pattern doesn't match
            return [titleLine, "Unknown"];
        }
    }

    /**
     * Parse metadata line to extract note information
     * @param {string} metadataLine - Second line of entry
     * @returns {Array} [noteType, location, page, dateAdded]
     */
    parseMetadata(metadataLine) {
        // Default values
        let noteType = "Unknown";
        let location = "";
        let page = null;
        let dateAdded = new Date();

        // Extract note type
        if (metadataLine.includes("Highlight")) {
            noteType = "Highlight";
        } else if (metadataLine.includes("Bookmark")) {
            noteType = "Bookmark";
        } else if (metadataLine.includes("Note")) {
            noteType = "Note";
        }

        // Extract location
        const locationMatch = metadataLine.match(/Location (\d+(?:-\d+)?)/);
        if (locationMatch) {
            location = locationMatch[1];
        }

        // Extract page
        const pageMatch = metadataLine.match(/page (\d+)/);
        if (pageMatch) {
            page = pageMatch[1];
        }

        // Extract date
        const dateMatch = metadataLine.match(/Added on (.+?)$/);
        if (dateMatch) {
            const dateStr = dateMatch[1];
            try {
                // Try different date formats
                dateAdded = new Date(dateStr);
                if (isNaN(dateAdded)) {
                    // Try parsing specific Kindle format
                    const kindleDate = this.parseKindleDate(dateStr);
                    dateAdded = kindleDate || new Date();
                }
            } catch (e) {
                dateAdded = new Date();
            }
        }

        return [noteType, location, page, dateAdded];
    }

    /**
     * Parse Kindle-specific date format
     * @param {string} dateStr - Date string from Kindle
     * @returns {Date|null} Parsed date or null
     */
    parseKindleDate(dateStr) {
        // Handle Kindle date format: "Tuesday, April 1, 2025 4:47:55 PM"
        try {
            return new Date(dateStr);
        } catch (e) {
            return null;
        }
    }

    /**
     * Clean and beautify book title for display
     * @param {string} bookTitle - Raw book title
     * @param {string} author - Book author
     * @returns {string} Cleaned title
     */
    cleanBookTitle(bookTitle, author) {
        let cleanTitle = bookTitle;

        // Remove common prefixes
        cleanTitle = cleanTitle.replace(/^vdoc\.?pub_?/i, '');
        cleanTitle = cleanTitle.replace(/^dokumen\.?pub_?/i, '');

        // Remove long numbers (over 5 digits)
        cleanTitle = cleanTitle.replace(/\b\d{6,}\b/g, '');

        // Replace underscores and hyphens with spaces
        cleanTitle = cleanTitle.replace(/[-_]+/g, ' ');

        // Remove extra whitespace
        cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

        // Remove author name from title if it appears at the end
        if (author && author.trim()) {
            const authorWords = author.trim().split(/\s+/);
            
            // Remove full author name
            const authorPattern = new RegExp('\\b' + this.escapeRegex(author.trim()) + '\\b\\s*$', 'i');
            cleanTitle = cleanTitle.replace(authorPattern, '').trim();
            
            // Remove individual author words
            authorWords.forEach(word => {
                if (word.length > 2) {
                    const wordPattern = new RegExp('\\b' + this.escapeRegex(word) + '\\b\\s*$', 'i');
                    cleanTitle = cleanTitle.replace(wordPattern, '').trim();
                }
            });

            // Remove patterns like "(Author Name)"
            cleanTitle = cleanTitle.replace(/\s*\([^)]*\)\s*$/g, '').trim();
        }

        // Clean up common suffixes
        cleanTitle = cleanTitle.replace(/\s*(second edition|first edition|revised|updated)\s*$/i, '');

        // Remove trailing dashes, underscores, or dots
        cleanTitle = cleanTitle.replace(/[-_.]+$/, '').trim();

        // Capitalize properly
        if (cleanTitle) {
            const words = cleanTitle.split(/\s+/);
            const capitalizedWords = words.map((word, index) => {
                const lowerWord = word.toLowerCase();
                if (index === 0 || !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(lowerWord)) {
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                }
                return lowerWord;
            });
            cleanTitle = capitalizedWords.join(' ');
        }

        return cleanTitle || bookTitle;
    }

    /**
     * Escape regex special characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Sort notes by their location numbers
     * @param {Array} notes - Array of notes to sort
     * @returns {Array} Sorted notes
     */
    sortNotesByLocation(notes) {
        return notes.sort((a, b) => {
            const aLocation = this.extractLocationNumber(a.location);
            const bLocation = this.extractLocationNumber(b.location);
            return aLocation - bLocation;
        });
    }

    /**
     * Extract numeric location from location string
     * @param {string} locationStr - Location string
     * @returns {number} Numeric location
     */
    extractLocationNumber(locationStr) {
        if (!locationStr) return 0;
        const match = locationStr.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Get statistics about parsed notes
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            totalNotes: this.notes.length,
            totalBooks: Object.keys(this.books).length,
            highlights: this.notes.filter(n => n.noteType === "Highlight").length,
            bookmarks: this.notes.filter(n => n.noteType === "Bookmark").length,
            notes: this.notes.filter(n => n.noteType === "Note").length
        };
    }

    /**
     * Search notes by query and type
     * @param {string} query - Search query
     * @param {string} typeFilter - Note type filter
     * @returns {Array} Filtered notes
     */
    searchNotes(query, typeFilter = 'all') {
        const lowerQuery = query.toLowerCase();
        return this.notes.filter(note => {
            const matchesQuery = !query || 
                note.content.toLowerCase().includes(lowerQuery) ||
                note.bookTitle.toLowerCase().includes(lowerQuery) ||
                note.author.toLowerCase().includes(lowerQuery);
            
            const matchesType = typeFilter === 'all' || note.noteType === typeFilter;
            
            return matchesQuery && matchesType;
        });
    }

    /**
     * Get books grouped by search criteria
     * @param {string} query - Search query
     * @param {string} typeFilter - Note type filter
     * @returns {Object} Books grouped by title
     */
    getBooksBySearch(query, typeFilter = 'all') {
        const filteredNotes = this.searchNotes(query, typeFilter);
        const bookGroups = {};
        
        filteredNotes.forEach(note => {
            if (!bookGroups[note.bookTitle]) {
                bookGroups[note.bookTitle] = [];
            }
            bookGroups[note.bookTitle].push(note);
        });
        
        return bookGroups;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KindleNotesParser;
}