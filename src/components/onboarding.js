/**
 * Onboarding Profiler & Calorie Engine Controller
 */
const Onboarding = {
    init(state, onProfileSuccess) {
        this.state = state;
        this.onProfileSuccess = onProfileSuccess;

        // Cache DOM elements
        this.view = document.getElementById('onboarding-view');
        this.form = document.getElementById('onboarding-form');
        this.ageInput = document.getElementById('input-age');
        this.heightInput = document.getElementById('input-height');
        this.weightInput = document.getElementById('input-weight');
        this.activitySelect = document.getElementById('input-activity');

        // Handle form submission
        this.registerEvents();
    },

    registerEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processOnboardingData();
        });
    },

    processOnboardingData() {
        const age = parseInt(this.ageInput.value);
        const height = parseFloat(this.heightInput.value);
        const weight = parseFloat(this.weightInput.value);
        const activityFactor = parseFloat(this.activitySelect.value);

        // Fetch Gender
        const genderRadios = document.getElementsByName('gender');
        let gender = 'female';
        for (const radio of genderRadios) {
            if (radio.checked) {
                gender = radio.value;
                break;
            }
        }

        // Fetch Weight Goal
        const goalRadios = document.getElementsByName('goal');
        let goal = 'lose';
        for (const radio of goalRadios) {
            if (radio.checked) {
                goal = radio.value;
                break;
            }
        }

        // Mifflin-St Jeor BMR Math Engine
        let bmr = 0;
        if (gender === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            // Female or default non-binary/other base calculations
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }

        // Total Daily Energy Expenditure (TDEE)
        const tdee = Math.round(bmr * activityFactor);

        // Daily Calorie Budget Target based on Goals
        let dailyCalorieGoal = tdee;
        if (goal === 'lose') {
            dailyCalorieGoal = Math.round(tdee - 450);
            if (dailyCalorieGoal < 1200) dailyCalorieGoal = 1200; // Safe metabolic floor
        } else if (goal === 'gain') {
            dailyCalorieGoal = Math.round(tdee + 400);
        }

        // Macronutrient Allocations
        // 1. Protein Target: 2.0g per kg of bodyweight (Excellent for maintaining muscle mass in deficit)
        const proteinTargetGrams = Math.round(weight * 2.0);
        
        // 2. Fat Target: 25% of total calorie budget
        const fatTargetGrams = Math.round((dailyCalorieGoal * 0.25) / 9);

        // 3. Carbohydrates Target: Remaining calories (Budget - Protein kcal - Fat kcal)
        const proteinKcal = proteinTargetGrams * 4;
        const fatKcal = fatTargetGrams * 9;
        let carbTargetGrams = Math.round((dailyCalorieGoal - proteinKcal - fatKcal) / 4);
        if (carbTargetGrams < 50) carbTargetGrams = 50; // Diet keto floor safety

        // Update Global Database States
        this.state.profile = {
            age,
            gender,
            height,
            weight,
            activityFactor,
            goal,
            bmr,
            tdee,
            calorieBudget: dailyCalorieGoal,
            proteinTarget: proteinTargetGrams,
            carbTarget: carbTargetGrams,
            fatTarget: fatTargetGrams,
            vitaminTarget: 100 // Normalized percentage
        };

        // Initialize empty journal logs
        this.state.journal = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: [],
            quickAddedKcal: 0,
            quickLogs: []
        };

        // Mark as onboarding complete
        this.state.isOnboarded = true;

        // Save immediately to localStorage
        this.onProfileSuccess();
    },

    prepopulateFields(profile) {
        if (!profile) return;
        this.ageInput.value = profile.age || '';
        this.heightInput.value = profile.height || '';
        this.weightInput.value = profile.weight || '';
        this.activitySelect.value = profile.activityFactor || '1.375';

        // Select correct gender
        const genderRadios = document.getElementsByName('gender');
        for (const radio of genderRadios) {
            if (radio.value === profile.gender) {
                radio.checked = true;
            }
        }

        // Select correct goal
        const goalRadios = document.getElementsByName('goal');
        for (const radio of goalRadios) {
            if (radio.value === profile.goal) {
                radio.checked = true;
            }
        }
    }
};

window.Onboarding = Onboarding;
