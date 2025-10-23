
import { saveMenuForDate, getAllOrders, updateOrderStatus } from './data_service.js';
import { setLanguage } from './localization.js';

document.addEventListener('DOMContentLoaded', () => {
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

    const publishMenuForm = document.getElementById('publish-menu-form');
    publishMenuForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const menuItemsText = document.getElementById('menu-items').value;

        if (!startDate || !endDate || !menuItemsText) {
            alert('Please fill out all fields.');
            return;
        }

        let menuItems;
        try {
            menuItems = JSON.parse(menuItemsText);
        } catch (error) {
            alert('Invalid JSON in Menu Items field.');
            return;
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let day = start; day <= end; day.setDate(day.getDate() + 1)) {
            const dateString = day.toISOString().split('T')[0];
            try {
                saveMenuForDate(dateString, { items: menuItems });
                console.log(`Menu for ${dateString} published.`);
            } catch (error) {
                console.error(`Error publishing menu for ${dateString}:`, error);
            }
        }

        alert('Menus published successfully!');
    });

    // Order Management
    const ordersContainer = document.getElementById('orders-container');

    function renderOrders() {
        const orders = getAllOrders();
        ordersContainer.innerHTML = '';
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<p data-lang="No orders yet.">No orders yet.</p>';
            return;
        }
        orders.forEach((order) => {
            const orderElement = document.createElement('div');
            orderElement.classList.add('bg-white', 'p-4', 'rounded-lg', 'shadow-md', 'mb-4');
            orderElement.innerHTML = `
                <h3 class="text-xl font-bold" data-lang="Order ID">Order ID: ${order.id}</h3>
                <p data-lang="Status">Status: <span id="status-${order.id}" class="font-semibold">${order.status}</span></p>
                <p data-lang="Total">Total: $${order.total}</p>
                <p data-lang="Items">Items:</p>
                <ul>
                    ${order.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('')}
                </ul>
                <div class="mt-2">
                    <button class="btn-status-ready bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded mr-2" data-order-id="${order.id}" data-new-status="Ready" data-lang="Mark Ready">Mark Ready</button>
                    <button class="btn-status-pickedup bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded" data-order-id="${order.id}" data-new-status="Picked Up" data-lang="Mark Picked Up">Mark Picked Up</button>
                </div>
            `;
            ordersContainer.appendChild(orderElement);
        });

        document.querySelectorAll('.btn-status-ready').forEach(button => {
            button.addEventListener('click', handleUpdateOrderStatus);
        });
        document.querySelectorAll('.btn-status-pickedup').forEach(button => {
            button.addEventListener('click', handleUpdateOrderStatus);
        });
    }

    function handleUpdateOrderStatus(e) {
        const orderId = e.target.dataset.orderId;
        const newStatus = e.target.dataset.newStatus;
        try {
            updateOrderStatus(orderId, newStatus);
            renderOrders(); // Re-render orders after update
            console.log(`Order ${orderId} status updated to ${newStatus}`);
        } catch (error) {
            console.error("Error updating order status:", error);
        }
    }

    // Initial render of orders
    renderOrders();

    // Since localStorage is not real-time, we can periodically check or rely on manual refresh
    // For a more robust solution, a custom event could be dispatched from student.js on order placement
    setInterval(renderOrders, 5000); // Refresh orders every 5 seconds for demonstration
});
