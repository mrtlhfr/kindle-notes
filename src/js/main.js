/**
 * Main Application Initialization
 * Entry point for the Kindle Notes Parser web application
 */

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kindle Notes Parser - Initializing...');
    
    // Create and start the app
    window.app = new KindleNotesApp();
    
    console.log('✅ Application ready! Upload your My Clippings.txt file to get started.');
});