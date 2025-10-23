
// js/cart.js
import { saveOrder } from './data_service.js';

let cart = [];

export function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
}

export function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartUI();
}

export function getCartContents() {
    return cart;
}

export function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

export function getCartMacros() {
    const macros = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    };
    cart.forEach(item => {
        macros.calories += (item.calories || 0) * item.quantity;
        macros.protein += (item.protein || 0) * item.quantity;
        macros.carbs += (item.carbs || 0) * item.quantity;
        macros.fat += (item.fat || 0) * item.quantity;
    });
    return macros;
}

export async function placeOrder() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    try {
        await saveOrder({
            items: cart,
            total: getCartTotal(),
            macros: getCartMacros(),
            status: 'Pending',
            timestamp: new Date().toISOString()
        });
        cart = []; // Clear cart after placing order
        updateCartUI();
        alert('Order placed successfully!');
    } catch (error) {
        console.error("Error placing order:", error);
        alert('Failed to place order. Please try again.');
    }
}

function updateCartUI() {
    // This function will be implemented in student.js to update the actual DOM
    // For now, it just logs to console.
    console.log('Cart updated:', cart);
    console.log('Total:', getCartTotal());
    console.log('Macros:', getCartMacros());
}
