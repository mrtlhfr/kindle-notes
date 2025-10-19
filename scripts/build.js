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

// Remove export statements (for browser compatibility)
const cleanJs = (js) => {
    return js.replace(/\/\/ Export for use in other modules[\s\S]*?}/g, '')
             .replace(/if \(typeof module.*?}/gs, '');
};

// Build the combined HTML
const combinedHtml = indexHtml
    // Replace CSS link with inline styles
    .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${styles}\n    </style>`)
    // Replace script tags with inline scripts
    .replace(
        /<!-- JavaScript Modules -->[\s\S]*?<\/body>/,
        `<script>
${cleanJs(modelsJs)}

${cleanJs(parserJs)}

${cleanJs(appJs)}

${cleanJs(mainJs)}
    </script>
</body>`
    );

// Write the built file
const outputPath = path.join(__dirname, '../kindle-notes-web-app.html');
fs.writeFileSync(outputPath, combinedHtml);

console.log('✅ Build complete!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)}KB`);