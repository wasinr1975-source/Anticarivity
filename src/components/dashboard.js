/**
 * Dashboard Panel & State Synchronizer
 */
const Dashboard = {
    SVG_CIRCUMFERENCE: 597, // 2 * PI * r (r=95)

    init(state, onEditProfile, onStateChange) {
        this.state = state;
        this.onEditProfile = onEditProfile;
        this.onStateChange = onStateChange;

        // Cache Dashboard elements
        this.view = document.getElementById('dashboard-view');
        this.editBtn = document.getElementById('edit-profile-btn');
        this.statusBadge = document.getElementById('status-badge');

        // Stats elements
        this.textRemaining = document.getElementById('calc-remaining');
        this.textBudget = document.getElementById('calc-budget');
        this.textEaten = document.getElementById('calc-eaten');
        this.textBurned = document.getElementById('calc-burned');
        this.progressBar = document.getElementById('calorie-progress-bar');

        // Quick add inputs
        this.quickKcalInput = document.getElementById('quick-add-kcal');
        this.quickNameInput = document.getElementById('quick-add-name');
        this.quickAddBtn = document.getElementById('quick-add-btn');

        // Onboarding Summary Labels
        this.sumGender = document.getElementById('summary-gender');
        this.sumAge = document.getElementById('summary-age');
        this.sumWeight = document.getElementById('summary-weight');
        this.sumHeight = document.getElementById('summary-height');
        this.sumGoal = document.getElementById('summary-goal');

        // Nutrients Deficits DOM
        this.nutStatusProtein = document.getElementById('nut-status-protein');
        this.nutFillProtein = document.getElementById('nut-fill-protein');
        this.nutEatenProtein = document.getElementById('nut-eaten-protein');
        this.nutGoalProtein = document.getElementById('nut-goal-protein');

        this.nutStatusCarbs = document.getElementById('nut-status-carbs');
        this.nutFillCarbs = document.getElementById('nut-fill-carbs');
        this.nutEatenCarbs = document.getElementById('nut-eaten-carbs');
        this.nutGoalCarbs = document.getElementById('nut-goal-carbs');

        this.nutStatusFat = document.getElementById('nut-status-fat');
        this.nutFillFat = document.getElementById('nut-fill-fat');
        this.nutEatenFat = document.getElementById('nut-eaten-fat');
        this.nutGoalFat = document.getElementById('nut-goal-fat');

        this.nutStatusVit = document.getElementById('nut-status-vit');
        this.nutFillVit = document.getElementById('nut-fill-vit');
        this.vitaminsBreakdown = document.getElementById('vitamins-breakdown');
        this.nutrientStatusBadge = document.getElementById('nutrient-status-badge');

        // Timeline Lists
        this.listBreakfast = document.getElementById('list-breakfast');
        this.listLunch = document.getElementById('list-lunch');
        this.listDinner = document.getElementById('list-dinner');
        this.listSnack = document.getElementById('list-snack');

        // Kcal badges
        this.kcalBreakfast = document.getElementById('kcal-breakfast');
        this.kcalLunch = document.getElementById('kcal-lunch');
        this.kcalDinner = document.getElementById('kcal-dinner');
        this.kcalSnack = document.getElementById('kcal-snack');

        // Initialize Tab Navigation
        this.initTabs();

        // Register event listeners
        this.registerEvents();
    },

    initTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Deactivate all
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

                // Activate selected
                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                document.getElementById(`tab-${targetTab}`).classList.add('active');
                
                // If switching to Recommender, re-render it dynamically
                if (targetTab === 'recommender' && window.Recommender) {
                    window.Recommender.renderRecommendations();
                }
            });
        });
    },

    registerEvents() {
        // Edit Profile Click
        this.editBtn.addEventListener('click', () => {
            this.onEditProfile();
        });

        // Quick add calorie button
        this.quickAddBtn.addEventListener('click', () => {
            this.handleQuickAddCalorie();
        });

        this.quickKcalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleQuickAddCalorie();
        });
    },

    handleQuickAddCalorie() {
        const kcal = parseInt(this.quickKcalInput.value);
        let name = this.quickNameInput.value.trim();

        if (isNaN(kcal) || kcal <= 0) return;
        if (!name) name = 'Quick Add Snack';

        const foodItem = {
            id: 'quick_' + Date.now(),
            name: name,
            kcal: kcal,
            protein: Math.round(kcal * 0.05), // Approximate generic macros
            carbs: Math.round(kcal * 0.65 / 4),
            fat: Math.round(kcal * 0.3 / 9),
            vitamins: []
        };

        // Push to Snack period
        this.state.journal.snack.push(foodItem);
        
        // Reset Inputs
        this.quickKcalInput.value = '';
        this.quickNameInput.value = '';

        // Update UI
        this.onStateChange();
    },

    deleteFoodLog(period, id) {
        this.state.journal[period] = this.state.journal[period].filter(item => item.id !== id);
        this.onStateChange();
    },

    updateUI() {
        const profile = this.state.profile;
        if (!profile) return;

        // 1. Render Top Header premium badge
        this.statusBadge.classList.remove('hidden');

        // 2. Set Header Summary values
        this.sumGender.innerText = profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
        this.sumAge.innerText = profile.age;
        this.sumWeight.innerText = profile.weight;
        this.sumHeight.innerText = profile.height;
        
        let goalText = 'Lose weight';
        if (profile.goal === 'maintain') goalText = 'Maintain weight';
        else if (profile.goal === 'gain') goalText = 'Gain weight';
        this.sumGoal.innerText = goalText;

        // 3. Compute eaten calories by mapping journal periods
        let totalEaten = 0;
        let totalP = 0;
        let totalC = 0;
        let totalF = 0;
        const loggedVitamins = new Set();

        const periods = ['breakfast', 'lunch', 'dinner', 'snack'];
        
        periods.forEach(period => {
            let periodKcal = 0;
            const listEl = this[`list${period.charAt(0).toUpperCase() + period.slice(1)}`];
            listEl.innerHTML = ''; // Clear prior elements

            const items = this.state.journal[period] || [];
            
            if (items.length === 0) {
                listEl.innerHTML = '<div class="no-food-placeholder">No foods logged yet</div>';
            } else {
                items.forEach(item => {
                    periodKcal += item.kcal;
                    totalEaten += item.kcal;
                    totalP += item.protein || 0;
                    totalC += item.carbs || 0;
                    totalF += item.fat || 0;
                    
                    if (item.vitamins) {
                        item.vitamins.forEach(vit => loggedVitamins.add(vit));
                    }

                    // Render standard logged food card
                    const card = document.createElement('div');
                    card.className = 'food-log-item';
                    card.innerHTML = `
                        <div class="food-item-left">
                            <span class="food-item-name">${item.name}</span>
                            <span class="food-item-macro">${item.kcal} kcal · P: ${item.protein}g C: ${item.carbs}g F: ${item.fat}g</span>
                        </div>
                        <button class="delete-log-btn" title="Remove entry">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    `;

                    // Delete Handler
                    card.querySelector('.delete-log-btn').addEventListener('click', () => {
                        this.deleteFoodLog(period, item.id);
                    });

                    listEl.appendChild(card);
                });
            }

            // Update period header badges
            this[`kcal${period.charAt(0).toUpperCase() + period.slice(1)}`].innerText = `${periodKcal} kcal`;
        });

        // 4. Update core calorie math metrics
        const budget = profile.calorieBudget;
        const remaining = budget - totalEaten;

        this.textBudget.innerText = budget;
        this.textEaten.innerText = totalEaten;
        this.textRemaining.innerText = remaining.toLocaleString();
        this.textBurned.innerText = '0'; // static workout indicator

        // 5. Update circular SVG calorie progress ring offset
        let ratio = totalEaten / budget;
        if (ratio > 1) ratio = 1; // max cap
        const strokeOffset = this.SVG_CIRCUMFERENCE * (1 - ratio);
        this.progressBar.style.strokeDasharray = this.SVG_CIRCUMFERENCE;
        this.progressBar.style.strokeDashoffset = strokeOffset;

        // Change progress bar warning color if close or over budget
        if (totalEaten > budget) {
            this.progressBar.style.stroke = '#E53E3E'; // Red alert
        } else if (totalEaten > budget * 0.85) {
            this.progressBar.style.stroke = '#DD6B20'; // Orange warning
        } else {
            this.progressBar.style.stroke = 'var(--primary)'; // Sage theme green
        }

        // 6. Update Macros Deficit management calculations
        // A. Protein
        this.nutGoalProtein.innerText = `${profile.proteinTarget}g`;
        this.nutEatenProtein.innerText = `${totalP}g`;
        const proteinDeficit = profile.proteinTarget - totalP;
        let pPercent = (totalP / profile.proteinTarget) * 100;
        if (pPercent > 100) pPercent = 100;
        this.nutFillProtein.style.width = `${pPercent}%`;
        this.nutStatusProtein.innerText = proteinDeficit > 0 ? `Lacking ${proteinDeficit}g` : 'Target Met 🎉';

        // B. Carbohydrates
        this.nutGoalCarbs.innerText = `${profile.carbTarget}g`;
        this.nutEatenCarbs.innerText = `${totalC}g`;
        const carbsDeficit = profile.carbTarget - totalC;
        let cPercent = (totalC / profile.carbTarget) * 100;
        if (cPercent > 100) cPercent = 100;
        this.nutFillCarbs.style.width = `${cPercent}%`;
        this.nutStatusCarbs.innerText = carbsDeficit > 0 ? `Lacking ${carbsDeficit}g` : 'Target Met 🎉';

        // C. Fats
        this.nutGoalFat.innerText = `${profile.fatTarget}g`;
        this.nutEatenFat.innerText = `${totalF}g`;
        const fatDeficit = profile.fatTarget - totalF;
        let fPercent = (totalF / profile.fatTarget) * 100;
        if (fPercent > 100) fPercent = 100;
        this.nutFillFat.style.width = `${fPercent}%`;
        this.nutStatusFat.innerText = fatDeficit > 0 ? `Lacking ${fatDeficit}g` : 'Target Met 🎉';

        // D. Vitamins Deficits (Crucial target tracking list)
        const allVitamins = ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Calcium', 'Iron'];
        const lackingVitamins = allVitamins.filter(vit => !loggedVitamins.has(vit));
        
        let vitEatenCount = allVitamins.length - lackingVitamins.length;
        let vitPercent = (vitEatenCount / allVitamins.length) * 100;
        this.nutFillVit.style.width = `${vitPercent}%`;

        this.nutStatusVit.innerText = lackingVitamins.length > 0 ? `Lacking ${lackingVitamins.length} item${lackingVitamins.length > 1 ? 's' : ''}` : 'Fully Balanced 🛡️';

        if (lackingVitamins.length === 0) {
            this.vitaminsBreakdown.innerHTML = 'All critical micro-nutrients are fully supplied!';
            this.vitaminsBreakdown.style.color = 'var(--success)';
            this.vitaminsBreakdown.style.fontWeight = '600';
        } else {
            this.vitaminsBreakdown.innerHTML = `Lacking: <strong style="color: var(--primary)">${lackingVitamins.join(', ')}</strong>`;
            this.vitaminsBreakdown.style.color = 'var(--text-muted)';
            this.vitaminsBreakdown.style.fontWeight = '400';
        }

        // Set Nutrient Balancer Status Badge
        if (proteinDeficit > 25 || lackingVitamins.length > 2) {
            this.nutrientStatusBadge.innerText = 'High Deficits';
            this.nutrientStatusBadge.className = 'card-badge card-badge-danger'; // Custom danger
            this.nutrientStatusBadge.style.backgroundColor = 'var(--danger-bg)';
            this.nutrientStatusBadge.style.color = 'var(--danger)';
        } else if (proteinDeficit > 0 || lackingVitamins.length > 0) {
            this.nutrientStatusBadge.innerText = 'Deficits Alert';
            this.nutrientStatusBadge.className = 'card-badge';
            this.nutrientStatusBadge.style.backgroundColor = 'var(--warning-bg)';
            this.nutrientStatusBadge.style.color = 'var(--warning)';
        } else {
            this.nutrientStatusBadge.innerText = 'Optimal Balance';
            this.nutrientStatusBadge.className = 'card-badge';
            this.nutrientStatusBadge.style.backgroundColor = 'var(--success-bg)';
            this.nutrientStatusBadge.style.color = 'var(--success)';
        }

        // Re-draw Lucide icons on any dynamic logs added/removed
        lucide.createIcons();
    }
};

window.Dashboard = Dashboard;
