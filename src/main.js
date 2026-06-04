/**
 * U R WHAT U EAT - CORE APPLICATION STATE CONTROLLER
 */

// Centralized state container with local storage backup
const AppState = {
    isUnlocked: false,
    isOnboarded: false,
    profile: null,
    journal: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: []
    }
};

const MainController = {
    init() {
        this.loadStateFromStorage();

        // Cache view layers
        this.paywallView = document.getElementById('paywall-view');
        this.onboardingView = document.getElementById('onboarding-view');
        this.dashboardView = document.getElementById('dashboard-view');
        
        this.statusBadge = document.getElementById('status-badge');
        
        // Developer panel elements
        this.devPanel = document.getElementById('dev-panel');
        this.devToggle = document.getElementById('dev-toggle');
        this.closeDevPanelBtn = document.getElementById('close-dev-panel');
        
        this.devBypassBtn = document.getElementById('dev-bypass-paywall-btn');
        this.devRelockBtn = document.getElementById('dev-relock-paywall-btn');
        this.devResetBtn = document.getElementById('dev-reset-all-btn');
        this.devJsonState = document.getElementById('dev-db-state');

        // Initialize Child Components
        this.initComponents();

        // Set Up View Layer
        this.routeViews();

        // Bind Developer Events
        this.registerDevEvents();

        // Sync and refresh initial render
        this.syncStateAndRefreshUI();
    },

    loadStateFromStorage() {
        try {
            const saved = localStorage.getItem('urwhatueat_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                AppState.isUnlocked = parsed.isUnlocked || false;
                AppState.isOnboarded = parsed.isOnboarded || false;
                AppState.profile = parsed.profile || null;
                AppState.journal = parsed.journal || {
                    breakfast: [],
                    lunch: [],
                    dinner: [],
                    snack: []
                };
            }
        } catch (e) {
            console.error('Error loading LocalStorage state database:', e);
        }
    },

    saveStateToStorage() {
        try {
            localStorage.setItem('urwhatueat_state', JSON.stringify(AppState));
        } catch (e) {
            console.error('Error writing LocalStorage state database:', e);
        }
    },

    initComponents() {
        // 1. Paywall View Controller
        window.Paywall.init(AppState, () => {
            // SUCCESSFUL UNLOCK CALLED BY SLIP AUDITOR
            AppState.isUnlocked = true;
            this.syncStateAndRefreshUI();
            this.routeViews();
        });

        // 2. Onboarding calculation controller
        window.Onboarding.init(AppState, () => {
            // PROFILE CREATED
            this.syncStateAndRefreshUI();
            this.routeViews();
        });

        // 3. Dashboard visualizer controller
        window.Dashboard.init(
            AppState, 
            () => {
                // EDIT PROFILE CALLED FROM DASHBOARD
                AppState.isOnboarded = false;
                this.routeViews();
                // Pre-fill fields for easy editing
                window.Onboarding.prepopulateFields(AppState.profile);
            },
            () => {
                // DYNAMIC STATE CHANGE CALLED (e.g. food added/deleted)
                this.syncStateAndRefreshUI();
            }
        );

        // 4. AI Food Photo Scanner controller
        window.MealScanner.init(AppState, () => {
            // MEAL LOGGED SUCCESSFULLY FROM SCANNER
            this.syncStateAndRefreshUI();
        });

        // 5. Dietitia Recommendations controller
        window.Recommender.init(AppState, () => {
            // RECOMMENDED MEAL LOGGED
            this.syncStateAndRefreshUI();
        });
    },

    routeViews() {
        // Hide all views first
        this.paywallView.classList.remove('active');
        this.onboardingView.classList.remove('active');
        this.dashboardView.classList.remove('active');

        // Show correct screen based on state
        if (!AppState.isUnlocked) {
            this.paywallView.classList.add('active');
            this.statusBadge.classList.add('hidden');
        } else if (!AppState.isOnboarded) {
            this.onboardingView.classList.add('active');
            this.statusBadge.classList.remove('hidden');
        } else {
            this.dashboardView.classList.add('active');
            this.statusBadge.classList.remove('hidden');
        }
    },

    registerDevEvents() {
        // Slide Dev Panel in/out
        this.devToggle.addEventListener('click', () => {
            this.devPanel.classList.toggle('active');
        });

        this.closeDevPanelBtn.addEventListener('click', () => {
            this.devPanel.classList.remove('active');
        });

        // Paywall bypass helper
        this.devBypassBtn.addEventListener('click', () => {
            AppState.isUnlocked = true;
            this.syncStateAndRefreshUI();
            this.routeViews();
            this.devPanel.classList.remove('active');
        });

        // Paywall re-lock helper
        this.devRelockBtn.addEventListener('click', () => {
            AppState.isUnlocked = false;
            AppState.isOnboarded = false;
            AppState.profile = null;
            AppState.journal = {
                breakfast: [],
                lunch: [],
                dinner: [],
                snack: []
            };
            this.syncStateAndRefreshUI();
            this.routeViews();
            window.Paywall.clearUploadedSlip();
            this.devPanel.classList.remove('active');
        });

        // Hard database wipe
        this.devResetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to completely reset all sandbox database records and localStorage?')) {
                localStorage.removeItem('urwhatueat_state');
                AppState.isUnlocked = false;
                AppState.isOnboarded = false;
                AppState.profile = null;
                AppState.journal = {
                    breakfast: [],
                    lunch: [],
                    dinner: [],
                    snack: []
                };
                this.syncStateAndRefreshUI();
                this.routeViews();
                window.Paywall.clearUploadedSlip();
                window.MealScanner.clearScanner();
                this.devPanel.classList.remove('active');
            }
        });
    },

    syncStateAndRefreshUI() {
        // Save database to localStorage
        this.saveStateToStorage();

        // Refresh Developer Database display
        this.devJsonState.innerText = JSON.stringify(AppState, null, 2);

        // If user is fully onboarded, trigger dashboard UI updates
        if (AppState.isUnlocked && AppState.isOnboarded) {
            window.Dashboard.updateUI();
        }

        // Re-render Lucide icons
        lucide.createIcons();
    }
};

// Start the application when elements are fully parsed
document.addEventListener('DOMContentLoaded', () => {
    MainController.init();
});
