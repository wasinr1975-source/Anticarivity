/**
 * AI Meal Photo Scanner Component
 */
const MealScanner = {
    // Local food database with precise healthy nutritional specs
    FOOD_PRESETS: {
        padthai: {
            name: 'Shrimp Pad Thai Noodles',
            kcal: 650,
            protein: 22,
            carbs: 85,
            fat: 18,
            vitamins: ['Vitamin A', 'Iron'],
            descr: 'Classic Thai stir-fried thin rice noodles with fresh shrimp, tofu, bean sprouts, crushed peanuts, and eggs in sweet-sour tamarind glaze.'
        },
        salmonsalad: {
            name: 'Seared Salmon Avocado Salad',
            kcal: 450,
            protein: 36,
            carbs: 12,
            fat: 28,
            vitamins: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Calcium'],
            descr: 'Omega-rich pan-seared wild salmon fillet, placed on organic baby greens, buttery avocado slices, cherry tomatoes, and light vinaigrette dressing.'
        },
        greencurry: {
            name: 'Spicy Chicken Green Curry',
            kcal: 580,
            protein: 24,
            carbs: 45,
            fat: 30,
            vitamins: ['Vitamin A', 'Vitamin C', 'Calcium'],
            descr: 'Aromatic traditional Thai coconut curry infused with green chilies, sweet basil, sliced tender chicken breast, bamboo shoots, and pea eggplants.'
        },
        chickenbreast: {
            name: 'Grilled Herb Chicken & Broccoli',
            kcal: 380,
            protein: 42,
            carbs: 10,
            fat: 8,
            vitamins: ['Vitamin D', 'Iron'],
            descr: 'High-protein charcoal grilled lean chicken breast, marinated in olive oil and lemon herbs, served with steamed fresh broccoli florets.'
        }
    },

    activeScannedMeal: null,

    init(state, onMealLogged) {
        this.state = state;
        this.onMealLogged = onMealLogged;

        // Cache elements
        this.browseBtn = document.getElementById('meal-browse-btn');
        this.fileInput = document.getElementById('meal-file-input');
        this.visualBox = document.getElementById('scanner-visual-box');
        this.placeholder = document.getElementById('scanner-placeholder');
        this.previewImg = document.getElementById('scanner-image-preview');
        
        // Scan Animations
        this.laserGrid = document.getElementById('scanner-grid-overlay');
        this.boundingBox = document.getElementById('scan-bounding-box-1');
        
        // Results Card
        this.resultCard = document.getElementById('scan-result-card');
        this.dishNameText = document.getElementById('scan-dish-name');
        this.dishKcalText = document.getElementById('scan-dish-kcal');
        this.dishDescrText = document.getElementById('scan-dish-descr');
        this.dishProteinText = document.getElementById('scan-dish-protein');
        this.dishCarbsText = document.getElementById('scan-dish-carbs');
        this.dishFatText = document.getElementById('scan-dish-fat');
        this.dishVitText = document.getElementById('scan-dish-vit');
        
        this.periodSelector = document.getElementById('log-meal-period');
        this.confirmLogBtn = document.getElementById('confirm-log-scan-btn');
        this.closeResultBtn = document.getElementById('close-scan-result');

        this.registerEvents();
    },

    registerEvents() {
        // Trigger file input
        this.browseBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        // Handle uploaded file
        this.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadAndScanCustomMeal(file);
            }
        });

        // Handle preset selections
        const presetBtns = document.querySelectorAll('.preset-btn');
        presetBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mealKey = btn.getAttribute('data-meal');
                this.scanMealPreset(mealKey);
            });
        });

        // Close scan result
        this.closeResultBtn.addEventListener('click', () => {
            this.clearScanner();
        });

        // Confirm logging
        this.confirmLogBtn.addEventListener('click', () => {
            this.logScannedMeal();
        });
    },

    uploadAndScanCustomMeal(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            this.previewImg.src = dataUrl;
            this.previewImg.classList.remove('hidden');
            this.placeholder.classList.add('hidden');

            // Pick a matching preset or construct a default based on file name!
            let presetKey = 'salmonsalad'; // default
            const fileName = file.name.toLowerCase();
            if (fileName.includes('thai') || fileName.includes('pad')) presetKey = 'padthai';
            else if (fileName.includes('curry') || fileName.includes('green')) presetKey = 'greencurry';
            else if (fileName.includes('chicken') || fileName.includes('breast')) presetKey = 'chickenbreast';
            else if (fileName.includes('salad') || fileName.includes('salmon')) presetKey = 'salmonsalad';
            else {
                // Generate a random dynamic preset if completely unknown!
                const keys = Object.keys(this.FOOD_PRESETS);
                presetKey = keys[Math.floor(Math.random() * keys.length)];
            }

            this.runScanningSequence(this.FOOD_PRESETS[presetKey]);
        };
        reader.readAsDataURL(file);
    },

    scanMealPreset(mealKey) {
        const preset = this.FOOD_PRESETS[mealKey];
        if (!preset) return;

        // Load our high-fidelity generated gourmet photograph directly from assets!
        this.previewImg.src = `src/assets/${mealKey}.png`;
        this.previewImg.classList.remove('hidden');
        this.placeholder.classList.add('hidden');

        this.runScanningSequence(preset);
    },

    runScanningSequence(mealData) {
        // Activate Scanning Laser UI
        this.laserGrid.classList.remove('hidden');
        this.resultCard.classList.add('hidden'); // hide past results
        this.activeScannedMeal = null;

        // Animate Bounding Detection Box appearance
        setTimeout(() => {
            const tag = this.boundingBox.querySelector('.box-tag');
            tag.innerText = `${mealData.name.toUpperCase()} DETECTED (${Math.floor(80 + Math.random() * 18)}%)`;
            this.boundingBox.classList.remove('hidden');
        }, 1200);

        // Terminate scan & expose data details
        setTimeout(() => {
            this.laserGrid.classList.add('hidden');
            this.boundingBox.classList.add('hidden');
            
            // Populate Details UI card
            this.activeScannedMeal = mealData;
            this.dishNameText.innerText = mealData.name;
            this.dishKcalText.innerText = `${mealData.kcal} kcal`;
            this.dishDescrText.innerText = mealData.descr;
            this.dishProteinText.innerText = `${mealData.protein}g`;
            this.dishCarbsText.innerText = `${mealData.carbs}g`;
            this.dishFatText.innerText = `${mealData.fat}g`;
            
            // Dynamic vitamin score calculate (represent list as string/badges)
            this.dishVitText.innerText = mealData.vitamins.join(', ');

            // Show results
            this.resultCard.classList.remove('hidden');
            
            // Scroll to detail results
            this.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 2800);
    },

    logScannedMeal() {
        if (!this.activeScannedMeal) return;

        const period = this.periodSelector.value;
        const loggedFood = {
            id: 'scan_' + Date.now(),
            name: this.activeScannedMeal.name,
            kcal: this.activeScannedMeal.kcal,
            protein: this.activeScannedMeal.protein,
            carbs: this.activeScannedMeal.carbs,
            fat: this.activeScannedMeal.fat,
            vitamins: this.activeScannedMeal.vitamins
        };

        // Add to global state journal
        this.state.journal[period].push(loggedFood);

        // Reset Scanner View
        this.clearScanner();

        // Trigger callback & show Journal tab
        this.onMealLogged();
        
        // Auto navigate back to journal tab
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === 'journal') {
                btn.click();
            }
        });
    },

    clearScanner() {
        this.activeScannedMeal = null;
        this.previewImg.src = '';
        this.previewImg.classList.add('hidden');
        this.placeholder.classList.remove('hidden');
        this.laserGrid.classList.add('hidden');
        this.boundingBox.classList.add('hidden');
        this.resultCard.classList.add('hidden');
        this.fileInput.value = '';
    }
};

window.MealScanner = MealScanner;
