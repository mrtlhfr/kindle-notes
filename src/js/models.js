/**
 * KindleNote Model
 * Represents a single Kindle note/highlight/bookmark
 */

class KindleNote {
    /**
     * Create a new Kindle note
     * @param {string} bookTitle - The title of the book
     * @param {string} author - The author of the book
     * @param {string} noteType - Type of note (Highlight, Bookmark, Note)
     * @param {string} location - Location in the book
     * @param {string|null} page - Page number (if available)
     * @param {Date} dateAdded - When the note was created
     * @param {string} content - The actual note content
     */
    constructor(bookTitle, author, noteType, location, page, dateAdded, content) {
        this.bookTitle = bookTitle;
        this.author = author;
        this.noteType = noteType;
        this.location = location;
        this.page = page;
        this.dateAdded = dateAdded;
        this.content = content;
    }

    /**
     * Get a string representation of the note
     * @returns {string} Formatted note summary
     */
    toString() {
        return `${this.bookTitle} - ${this.noteType} at ${this.location}: ${this.content.substring(0, 50)}...`;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = KindleNote;
}