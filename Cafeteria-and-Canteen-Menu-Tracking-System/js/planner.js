
// js/planner.js

export function calculateBMR(gender, weight, height, age) {
    // Mifflin-St Jeor Equation
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender === 'female') {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    return 0;
}

export function calculateTDEE(bmr, activityMultiplier) {
    return bmr * activityMultiplier;
}

export function calculateMacroTargets(tdee, weight) {
    // Protein: Weight * 1.8 (assuming 1.8g/kg for active individuals)
    const proteinGrams = weight * 1.8;
    const proteinCalories = proteinGrams * 4;

    const remainingCalories = tdee - proteinCalories;

    // Fat: ~25% of remaining calories
    const fatCalories = remainingCalories * 0.25;
    const fatGrams = fatCalories / 9;

    // Carbs: Remaining calories after protein and fat
    const carbCalories = remainingCalories * 0.75;
    const carbGrams = carbCalories / 4;

    return {
        calories: tdee.toFixed(0),
        protein: proteinGrams.toFixed(0),
        carbs: carbGrams.toFixed(0),
        fat: fatGrams.toFixed(0)
    };
}

export function calculateDailyNeeds(gender, weight, height, age, activityMultiplier) {
    const bmr = calculateBMR(gender, weight, height, age);
    const tdee = calculateTDEE(bmr, activityMultiplier);
    return calculateMacroTargets(tdee, weight);
}
