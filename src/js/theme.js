/**
 * Theme Manager
 * Handles light/dark theme detection and switching
 */

class ThemeManager {
    constructor() {
        this.themes = {
            light: {
                name: 'light',
                icon: '🌙',
                text: 'Dark'
            },
            dark: {
                name: 'dark', 
                icon: '☀️',
                text: 'Light'
            }
        };

        this.currentTheme = this.detectInitialTheme();
        this.initializeTheme();
        this.setupEventListeners();
    }

    /**
     * Detect initial theme based on user preference or system preference
     */
    detectInitialTheme() {
        // Check if user has previously set a preference
        const savedTheme = localStorage.getItem('kindle-notes-theme');
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
            return savedTheme;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        // Default to light
        return 'light';
    }

    /**
     * Initialize theme on page load
     */
    initializeTheme() {
        this.applyTheme(this.currentTheme);
        this.updateThemeToggle();

        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                const savedTheme = localStorage.getItem('kindle-notes-theme');
                if (!savedTheme) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.setTheme(newTheme);
                }
            });
        }
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const html = document.documentElement;
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            html.setAttribute('data-theme', 'light');
        } else {
            // Fallback: remove attribute to use system preference
            html.removeAttribute('data-theme');
        }

        this.currentTheme = theme;
    }

    /**
     * Update theme toggle button appearance
     */
    updateThemeToggle() {
        const themeIcon = document.getElementById('themeIcon');
        const themeText = document.getElementById('themeText');
        
        if (themeIcon && themeText) {
            const nextTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            themeIcon.textContent = this.themes[this.currentTheme].icon;
            themeText.textContent = this.themes[this.currentTheme].text;
        }
    }

    /**
     * Set theme and save preference
     */
    setTheme(theme) {
        this.applyTheme(theme);
        this.updateThemeToggle();
        localStorage.setItem('kindle-notes-theme', theme);

        // Dispatch custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: theme }
        }));
    }

    /**
     * Toggle between themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Add a subtle animation feedback
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.style.transform = 'scale(0.95)';
            setTimeout(() => {
                toggle.style.transform = '';
            }, 150);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Keyboard support
            themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
        }

        // Listen for theme changes from other sources
        window.addEventListener('themeChanged', (e) => {
            console.log(`🎨 Theme changed to: ${e.detail.theme}`);
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if current theme is dark
     */
    isDarkTheme() {
        return this.currentTheme === 'dark';
    }

    /**
     * Get theme-appropriate color for dynamic content
     */
    getThemeColors() {
        return {
            primary: this.isDarkTheme() ? '#4a9eff' : '#3498db',
            secondary: this.isDarkTheme() ? '#e0e0e0' : '#333333',
            background: this.isDarkTheme() ? '#2d2d2d' : '#ffffff',
            text: this.isDarkTheme() ? '#e0e0e0' : '#333333'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}