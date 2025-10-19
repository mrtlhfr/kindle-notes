#!/usr/bin/env node
/**
 * Build Script for Kindle Notes Parser
 * Combines modular files into a single deployable HTML file
 */

const fs = require('fs');
const path = require('path');

console.log('🏗️  Building Kindle Notes Parser...');

// Read source files
const indexHtml = fs.readFileSync(path.join(__dirname, '../src/index.html'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '../src/styles.css'), 'utf8');
const modelsJs = fs.readFileSync(path.join(__dirname, '../src/js/models.js'), 'utf8');
const parserJs = fs.readFileSync(path.join(__dirname, '../src/js/parser.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '../src/js/app.js'), 'utf8');
const mainJs = fs.readFileSync(path.join(__dirname, '../src/js/main.js'), 'utf8');

// Remove export statements (for browser compatibility) - be more specific
const cleanJs = (js) => {
    // Remove export comments and blocks at the end of files
    let cleaned = js.replace(/\/\/ Export for use in other modules[\s\S]*$/gm, '');
    cleaned = cleaned.replace(/if \(typeof module !== 'undefined'[\s\S]*$/gm, '');
    return cleaned.trim();
};

// Build the combined HTML step by step
let combinedHtml = indexHtml;

// Replace CSS link with inline styles
combinedHtml = combinedHtml.replace(
    '<link rel="stylesheet" href="styles.css">', 
    `<style>\n/* \n * Kindle Notes Parser - Styles\n * Modern, responsive CSS for the web application\n */\n\n${styles}\n    </style>`
);

// Replace JavaScript modules section
const jsModulesStart = combinedHtml.indexOf('    <!-- JavaScript Modules -->');
const bodyEndIndex = combinedHtml.indexOf('</body>');

if (jsModulesStart !== -1 && bodyEndIndex !== -1) {
    const beforeJs = combinedHtml.substring(0, jsModulesStart);
    const afterBody = combinedHtml.substring(bodyEndIndex);
    
    const jsSection = `    <script>
/**
 * KindleNote Model
 * Represents a single Kindle note/highlight/bookmark
 */

${cleanJs(modelsJs)}


/**
 * KindleNotesParser
 * Core parsing logic for Kindle "My Clippings.txt" files
 */

${cleanJs(parserJs)}


/**
 * KindleNotesApp
 * Main application class that handles UI interactions and file processing
 */

${cleanJs(appJs)}


/**
 * Main Application Initialization
 * Entry point for the Kindle Notes Parser web application
 */

${cleanJs(mainJs)}
    </script>
`;

    combinedHtml = beforeJs + jsSection + afterBody;
}

// Write the built file
const outputPath = path.join(__dirname, '../kindle-notes-web-app.html');
fs.writeFileSync(outputPath, combinedHtml);

console.log('✅ Build complete!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB`);