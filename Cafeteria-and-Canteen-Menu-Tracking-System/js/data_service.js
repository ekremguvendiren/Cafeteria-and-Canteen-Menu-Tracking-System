
// js/data_service.js

const MENUS_KEY = 'canteen_menus';
const ORDERS_KEY = 'canteen_orders';

export const DATA_CHANGE_EVENT = new Event('dataChange');

function getMenus() {
    const menus = localStorage.getItem(MENUS_KEY);
    return menus ? JSON.parse(menus) : {};
}

function saveMenus(menus) {
    localStorage.setItem(MENUS_KEY, JSON.stringify(menus));
    window.dispatchEvent(DATA_CHANGE_EVENT);
}

export function getMenuForDate(dateString) {
    const menus = getMenus();
    return menus[dateString] || null;
}

export function saveMenuForDate(dateString, menuData) {
    const menus = getMenus();
    menus[dateString] = menuData;
    saveMenus(menus);
}

function getOrders() {
    const orders = localStorage.getItem(ORDERS_KEY);
    return orders ? JSON.parse(orders) : [];
}

function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(DATA_CHANGE_EVENT);
}

export function getAllOrders() {
    return getOrders();
}

export function saveOrder(order) {
    const orders = getOrders();
    orders.push({ id: Date.now().toString(), ...order }); // Simple ID generation
    saveOrders(orders);
}

export function updateOrderStatus(orderId, newStatus) {
    const orders = getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = newStatus;
        saveOrders(orders);
    }
}
