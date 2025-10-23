import { getMenuForDate, DATA_CHANGE_EVENT } from './data_service.js';
import { calculateDailyNeeds } from './planner.js'; // Directly import calculateDailyNeeds
import { addToCart, removeFromCart, getCartContents, getCartTotal, getCartMacros, placeOrder } from './cart.js';
import { setLanguage } from './localization.js';

let allMenuItems = []; // To store all fetched menu items
let dailyMacroTargets = { calories: 2000, protein: 100, carbs: 250, fat: 55 }; // Default values

const initApp = async () => {
    setLanguage('en'); // Set default language to English

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // DOM Elements
    const menuDisplay = document.getElementById('menu-display');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartItemCount = document.getElementById('cart-item-count');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const itemDetailModal = document.getElementById('item-detail-modal');
    const detailModalName = document.getElementById('detail-modal-name');
    const detailModalDescription = document.getElementById('detail-modal-description');
    const detailCal = document.getElementById('detail-cal');
    const detailProtein = document.getElementById('detail-protein');
    const detailCarbs = document.getElementById('detail-carbs');
    const detailSugar = document.getElementById('detail-sugar');
    const impactCal = document.getElementById('impact-cal').querySelector('span');
    const impactProtein = document.getElementById('impact-protein').querySelector('span');
    const impactCarbs = document.getElementById('impact-carbs').querySelector('span');
    const impactFat = document.getElementById('impact-fat').querySelector('span');

    // Event Listeners
    window.addEventListener(DATA_CHANGE_EVENT.type, async () => {
        await loadAndRenderMenu();
        updateCartUI();
        updatePlannerStatusDisplay();
    });

    document.getElementById('tab-menu').addEventListener('click', () => showSection('menu'));
    document.getElementById('place-order-btn').addEventListener('click', async () => {
        await placeOrder();
        updateCartUI();
        updatePlannerStatusDisplay();
    });

    const calcBtn = document.getElementById('calculate-daily-needs-btn');
    if (calcBtn) {
        calcBtn.addEventListener('click', calculateAndDisplayDailyNeeds);
    } else {
        // Konsola bir hata mesajı yazdırın (Teşhis için)
        console.error("HATA: Calculate button (calculate-daily-needs-btn) DOM'da bulunamadı!");
    }

    // Global functions (attached to window for onclick/onchange in HTML)
    window.showSection = (sectionId) => {
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`${sectionId}-section`).classList.remove('hidden');

        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.getElementById(`tab-${sectionId}`).classList.add('active');
    };

    window.toggleFilter = (filterValue) => {
        const checkbox = document.getElementById(`filter-${filterValue.toLowerCase()}`);
        if (checkbox) {
            const label = document.querySelector(`label[for="filter-${filterValue.toLowerCase()}"] span`);
            if (checkbox.checked) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        }
        applyFilters();
    };

    window.clearDietaryFilters = () => {
        document.getElementById('filter-vegan').checked = false;
        document.getElementById('filter-vegetarian').checked = false;
        document.querySelector('label[for="filter-vegan"] span').classList.remove('active');
        document.querySelector('label[for="filter-vegetarian"] span').classList.remove('active');
        applyFilters();
    };

    window.clearAllergenFilters = () => {
        document.getElementById('filter-gluten').checked = false;
        document.getElementById('filter-dairy').checked = false;
        document.getElementById('filter-peanuts').checked = false;
        document.getElementById('filter-shellfish').checked = false;
        document.querySelector('label[for="filter-gluten"] span').classList.remove('active');
        document.querySelector('label[for="filter-dairy"] span').classList.remove('active');
        document.querySelector('label[for="filter-peanuts"] span').classList.remove('active');
        document.querySelector('label[for="filter-shellfish"] span').classList.remove('active');
        applyFilters();
    };

    // Local function to calculate and display daily needs
    function calculateAndDisplayDailyNeeds() {
        const gender = document.getElementById('user-gender').value;
        const age = parseFloat(document.getElementById('user-age').value);
        const weight = parseFloat(document.getElementById('user-weight').value);
        const height = parseFloat(document.getElementById('user-height').value);
        const activityMultiplier = parseFloat(document.getElementById('user-activity').value);

        dailyMacroTargets = calculateDailyNeeds(gender, weight, height, age, activityMultiplier);

        document.getElementById('goal-cal').textContent = dailyMacroTargets.calories;
        document.getElementById('goal-protein').textContent = dailyMacroTargets.protein;
        document.getElementById('goal-carbs').textContent = dailyMacroTargets.carbs;
        document.getElementById('goal-fat').textContent = dailyMacroTargets.fat;

        updatePlannerStatusDisplay();
    };

    window.openDetailModal = (item) => {
        detailModalName.textContent = item.name;
        detailModalDescription.textContent = item.description;
        detailCal.textContent = item.calories || 0;
        detailProtein.textContent = item.protein || 0;
        detailCarbs.textContent = item.carbs || 0;
        detailSugar.textContent = item.sugar || 0;

        const currentCartMacros = getCartMacros();
        impactCal.textContent = (currentCartMacros.calories + (item.calories || 0)).toFixed(0);
        impactProtein.textContent = (currentCartMacros.protein + (item.protein || 0)).toFixed(0);
        impactCarbs.textContent = (currentCartMacros.carbs + (item.carbs || 0)).toFixed(0);
        impactFat.textContent = (currentCartMacros.fat + (item.fat || 0)).toFixed(0);

        itemDetailModal.classList.remove('hidden');
    };

    window.closeDetailModal = () => {
        itemDetailModal.classList.add('hidden');
    };

    // Initial Load Functions
    async function loadAndRenderMenu() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('menu-loading').classList.remove('hidden');
        try {
            const menuData = getMenuForDate(today);

            if (menuData && menuData.items) {
                allMenuItems = menuData.items.map(item => ({ ...item, id: item.id || Math.random().toString(36).substr(2, 9) })); // Ensure items have an ID
                applyFilters();
            } else {
                menuDisplay.innerHTML = '<p class="md:col-span-2 text-center text-gray-500 italic">No menu available for today.</p>';
            }
        } catch (error) {
            console.error("Error getting menu:", error);
            menuDisplay.innerHTML = '<p class="md:col-span-2 text-center text-red-500 italic">Error loading menu. Please try again later.</p>';
        }
        document.getElementById('menu-loading').classList.add('hidden');
    }

    function applyFilters() {
        const selectedDietaryFilters = Array.from(document.querySelectorAll('#filter-vegan, #filter-vegetarian'))
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        const selectedAllergenFilters = Array.from(document.querySelectorAll('#filter-gluten, #filter-dairy, #filter-peanuts, #filter-shellfish'))
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        let filteredItems = allMenuItems.filter(item => {
            // Dietary filters (inclusion logic)
            const matchesDietary = selectedDietaryFilters.length === 0 || 
                                   selectedDietaryFilters.some(filter => item.diet && item.diet.includes(filter));

            // Allergen filters (exclusion logic)
            const matchesAllergens = selectedAllergenFilters.length === 0 || 
                                     !selectedAllergenFilters.some(filter => item.allergens && item.allergens.includes(filter));

            return matchesDietary && matchesAllergens;
        });
        renderMenu(filteredItems);
    }

    function renderMenu(menuItems) {
        menuDisplay.innerHTML = '';
        if (menuItems.length === 0) {
            menuDisplay.innerHTML = '<p class="md:col-span-2 text-center text-gray-500 italic">No items match your filter criteria.</p>';
            return;
        }
        menuItems.forEach(item => {
            const menuItemElement = document.createElement('div');
            menuItemElement.classList.add('container-card', 'p-4', 'rounded-xl', 'flex', 'flex-col', 'justify-between');
            
            const allergensHtml = item.allergens && item.allergens.length > 0 
                ? `<p class="text-sm text-red-500">Allergens: ${item.allergens.join(', ')}</p>` 
                : '';
            const dietHtml = item.diet && item.diet.length > 0 
                ? `<p class="text-sm text-emerald-600">Diet: ${item.diet.join(', ')}</p>` 
                : '';

            menuItemElement.innerHTML = `
                <div>
                    <h3 class="text-xl font-bold text-gray-800 mb-1">${item.name}</h3>
                    <p class="text-gray-600 text-sm mb-2">${item.description}</p>
                    ${allergensHtml}
                    ${dietHtml}
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <span class="text-2xl font-extrabold text-emerald-600">${item.price.toFixed(2)} ₺</span>
                    <div class="flex space-x-2">
                        <button class="add-to-cart-btn bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition" data-item-id="${item.id}">
                            <i data-lucide="plus" class="w-5 h-5 inline-block mr-1"></i> Add
                        </button>
                        <button class="view-details-btn bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition" data-item-id="${item.id}">
                            <i data-lucide="info" class="w-5 h-5 inline-block mr-1"></i> Details
                        </button>
                    </div>
                </div>
            `;
            menuDisplay.appendChild(menuItemElement);
        });

        // Re-initialize Lucide icons after new HTML is added
        if (window.lucide) {
            window.lucide.createIcons();
        }

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const itemToAdd = allMenuItems.find(item => item.id === itemId);
                if (itemToAdd) {
                    addToCart(itemToAdd);
                    updateCartUI();
                    updatePlannerStatusDisplay();
                }
            });
        });

        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.currentTarget.dataset.itemId;
                const item = allMenuItems.find(item => item.id === itemId);
                if (item) {
                    openDetailModal(item);
                }
            });
        });
    }

    function updateCartUI() {
        const cartContents = getCartContents();
        const totalItems = cartContents.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = getCartTotal();
        const cartMacros = getCartMacros();

        cartItemCount.textContent = `${totalItems} Items`;
        cartTotalAmount.textContent = `${totalAmount} ₺`;

        cartItemsList.innerHTML = '';
        if (cartContents.length === 0) {
            cartItemsList.innerHTML = '<p class="text-gray-500 italic">Your cart is empty.</p>';
        } else {
            cartContents.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.classList.add('flex', 'justify-between', 'items-center', 'py-1', 'border-b', 'border-indigo-100', 'last:border-b-0');
                cartItemElement.innerHTML = `
                    <span class="flex-1">${item.name} (x${item.quantity})</span>
                    <span class="font-semibold">${(item.price * item.quantity).toFixed(2)} ₺</span>
                    <button class="ml-3 text-indigo-500 hover:text-indigo-700 transition remove-from-cart-btn" data-item-id="${item.id}">
                        <i data-lucide="minus-circle" class="w-4 h-4"></i>
                    </button>
                `;
                cartItemsList.appendChild(cartItemElement);
            });

            document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const itemId = e.currentTarget.dataset.itemId;
                    removeFromCart(itemId);
                    updateCartUI();
                    updatePlannerStatusDisplay();
                });
            });
        }

        // Update cart macros in the planner section (if needed, though planner has its own update)
        // This part is handled by updatePlannerStatusDisplay which is called after cart changes
    }

    function updatePlannerStatusDisplay() {
        const consumedMacros = getCartMacros();

        updateProgressBar('cal', consumedMacros.calories, dailyMacroTargets.calories, 'bg-emerald-500', 'bg-red-500');
        updateProgressBar('protein', consumedMacros.protein, dailyMacroTargets.protein, 'bg-blue-500');
        updateProgressBar('carbs', consumedMacros.carbs, dailyMacroTargets.carbs, 'bg-yellow-500');
        updateProgressBar('fat', consumedMacros.fat, dailyMacroTargets.fat, 'bg-orange-500');
    }

    function updateProgressBar(macroType, consumed, goal, normalColorClass, overageColorClass = 'bg-red-500') {
        const consumedSpan = document.getElementById(`consumed-${macroType}`);
        const goalSpan = document.getElementById(`goal-${macroType}`);
        const progressBarFill = document.getElementById(`${macroType}-progress`);

        consumedSpan.textContent = consumed.toFixed(0);
        goalSpan.textContent = goal.toFixed(0);

        let percentage = (goal > 0) ? (consumed / goal) * 100 : 0;
        if (percentage > 100) {
            percentage = 100;
            progressBarFill.className = `progress-fill ${overageColorClass}`;
        } else {
            progressBarFill.className = `progress-fill ${normalColorClass}`;
        }
        progressBarFill.style.width = `${percentage}%`;
    }

    // Initial calls
    loadAndRenderMenu();
    calculateAndDisplayDailyNeeds(); // Calculate initial daily needs with default values
    updateCartUI();
    updatePlannerStatusDisplay();

    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
};

window.onload = initApp;