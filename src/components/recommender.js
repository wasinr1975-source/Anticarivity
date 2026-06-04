/**
 * AI Dietitian Next-Meal Recommender Component
 */
const Recommender = {
    // Rich gourmet recipe database
    MEAL_DATABASE: [
        {
            id: 'rec_salmon_avotoast',
            name: 'Smoked Salmon Avocado Sourdough',
            kcal: 420,
            protein: 28,
            carbs: 22,
            fat: 24,
            vitamins: ['Vitamin D', 'Calcium', 'Vitamin A'],
            emoji: '🥑',
            image: 'src/assets/salmon_toast.png',
            descr: 'Toasted artisanal sourdough topped with mashed avocado, premium oak-smoked salmon slices, and soft-poached pasture eggs.'
        },
        {
            id: 'rec_berry_lentilsalad',
            name: 'Spinach & Berry Sprouted Lentils',
            kcal: 320,
            protein: 15,
            carbs: 48,
            fat: 6,
            vitamins: ['Vitamin C', 'Iron', 'Vitamin A'],
            emoji: '🥗',
            image: 'src/assets/berry_salad.png',
            descr: 'A nutrient-dense tossed salad of fresh baby spinach, organic strawberries, sprouted black lentils, walnuts, and balsamic citrus splash.'
        },
        {
            id: 'rec_chicken_quinoabowl',
            name: 'Quinoa Sweet Potato Chicken Bowl',
            kcal: 490,
            protein: 38,
            carbs: 54,
            fat: 12,
            vitamins: ['Vitamin A', 'Iron', 'Vitamin C'],
            emoji: '🍠',
            image: 'src/assets/chickenbreast.png', // high quality chicken substitute
            descr: 'Fluffy protein-rich quinoa base topped with maple-roasted sweet potato cubes, shredded organic chicken breast, and dark steamed kale.'
        },
        {
            id: 'rec_chia_yogurt',
            name: 'Chia Seed Greek Yogurt Parfait',
            kcal: 280,
            protein: 22,
            carbs: 24,
            fat: 10,
            vitamins: ['Calcium', 'Vitamin D'],
            emoji: '🥛',
            image: null, // clean milk cup emoji fallback
            descr: 'Thick strained probiotic Greek yogurt layered with organic chia seeds, high-fiber almonds, wild blueberries, and a drop of orange zest.'
        },
        {
            id: 'rec_beef_broccoli',
            name: 'Ginger Beef & Sesame Broccoli Rice',
            kcal: 540,
            protein: 35,
            carbs: 60,
            fat: 16,
            vitamins: ['Iron', 'Vitamin C', 'Vitamin A'],
            emoji: '🥩',
            image: 'src/assets/padthai.png', // high quality stir fry plate substitute
            descr: 'Lean stir-fried grass-fed beef strips, crisp broccoli crowns, sweet bell peppers, brown jasmine rice, and roasted black sesame seeds.'
        }
    ],

    init(state, onMealRecommendedLogged) {
        this.state = state;
        this.onMealRecommendedLogged = onMealRecommendedLogged;

        this.introText = document.getElementById('recommender-analysis-text');
        this.mealsListContainer = document.getElementById('recommended-meals-list');
    },

    renderRecommendations() {
        const profile = this.state.profile;
        if (!profile) return;

        // 1. Calculate current deficits
        let eatenP = 0;
        let eatenC = 0;
        let eatenF = 0;
        const loggedVitamins = new Set();

        const periods = ['breakfast', 'lunch', 'dinner', 'snack'];
        periods.forEach(p => {
            const list = this.state.journal[p] || [];
            list.forEach(item => {
                eatenP += item.protein || 0;
                eatenC += item.carbs || 0;
                eatenF += item.fat || 0;
                if (item.vitamins) {
                    item.vitamins.forEach(vit => loggedVitamins.add(vit));
                }
            });
        });

        const proteinDeficit = profile.proteinTarget - eatenP;
        const carbsDeficit = profile.carbTarget - eatenC;
        const fatDeficit = profile.fatTarget - eatenF;
        
        const allVitamins = ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Calcium', 'Iron'];
        const lackingVitamins = allVitamins.filter(vit => !loggedVitamins.has(vit));

        // 2. Formulate smart text based on highest lacks
        let analysisText = '';
        const deficitsList = [];
        if (proteinDeficit > 15) deficitsList.push('protein');
        if (carbsDeficit > 30) deficitsList.push('carbohydrates');
        if (fatDeficit > 10) deficitsList.push('healthy fats');
        
        if (lackingVitamins.length > 0) {
            deficitsList.push(`key vitamins (${lackingVitamins.slice(0, 2).join(', ')})`);
        }

        if (deficitsList.length === 0) {
            analysisText = 'Outstanding job! You have fully satisfied your caloric and micro-nutrient goals today. Keep maintaining this balanced posture!';
        } else {
            analysisText = `You are currently experiencing moderate deficits in **${deficitsList.join(', ')}**. Here are curated smart recipes tailored specifically to supply what you lack:`;
        }

        this.introText.innerHTML = analysisText;

        // 3. Score and prioritize recipe database
        // Score is calculated based on how many lacking nutrients the recipe replenishes!
        const scoredMeals = this.MEAL_DATABASE.map(meal => {
            let score = 0;
            const reasons = [];

            // Check macros contribution
            if (proteinDeficit > 10 && meal.protein >= 20) {
                score += 5;
                reasons.push('High Protein');
            }
            if (carbsDeficit > 20 && meal.carbs >= 40) {
                score += 3;
                reasons.push('Complex Carbs');
            }
            if (fatDeficit > 10 && meal.fat >= 15) {
                score += 2;
                reasons.push('Healthy Fats');
            }

            // Check vitamins contribution
            let vitMatches = 0;
            meal.vitamins.forEach(vit => {
                if (lackingVitamins.includes(vit)) {
                    score += 4;
                    vitMatches++;
                }
            });

            if (vitMatches > 0) {
                reasons.push(`Supplies lacking ${meal.vitamins.filter(v => lackingVitamins.includes(v)).join('/')}`);
            }

            return {
                ...meal,
                score,
                reasons
            };
        });

        // Sort descending by match score
        scoredMeals.sort((a, b) => b.score - a.score);

        // 4. Draw prioritized recommendations list
        this.mealsListContainer.innerHTML = '';
        
        scoredMeals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'rec-meal-card';

            const reasonBadgeHtml = meal.reasons.length > 0 
                ? `<span class="rec-meal-rich">🎯 ${meal.reasons.join(' · ')}</span>`
                : `<span class="rec-meal-rich" style="background-color: var(--primary-light); color: var(--primary);">Standard Balance</span>`;

            const imageHtml = meal.image 
                ? `<img src="${meal.image}" style="width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm);">`
                : meal.emoji;

            card.innerHTML = `
                <div class="rec-meal-img">${imageHtml}</div>
                <div class="rec-meal-info">
                    <div class="rec-meal-header">
                        <strong class="rec-meal-title">${meal.name}</strong>
                        <span class="rec-meal-kcal">${meal.kcal} kcal</span>
                    </div>
                    <p class="detected-descr" style="margin-bottom: 4px; font-size: 11px;">${meal.descr}</p>
                    <span class="rec-meal-macro">P: ${meal.protein}g · C: ${meal.carbs}g · F: ${meal.fat}g · ${meal.vitamins.join(', ')}</span>
                    ${reasonBadgeHtml}
                </div>
                <button class="add-rec-btn" title="Log this recommended meal to Lunch" data-id="${meal.id}">
                    <i data-lucide="plus-circle" style="width: 22px; height: 22px;"></i>
                </button>
            `;

            // Button Event
            card.querySelector('.add-rec-btn').addEventListener('click', () => {
                this.logRecommendedMeal(meal);
            });

            this.mealsListContainer.appendChild(card);
        });

        lucide.createIcons();
    },

    logRecommendedMeal(meal) {
        // Log into standard Lunch log as default
        const loggedFood = {
            id: 'rec_' + Date.now(),
            name: meal.name,
            kcal: meal.kcal,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            vitamins: meal.vitamins
        };

        this.state.journal.lunch.push(loggedFood);
        
        // Refresh & redirect to journal timeline
        this.onMealRecommendedLogged();
        
        // Navigate
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === 'journal') {
                btn.click();
            }
        });
    }
};

window.Recommender = Recommender;
