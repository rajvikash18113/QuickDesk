document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentUser = null;
    let users = [];
    let tickets = [];
    let categories = [];
    let notifications = [];
    let currentView = 'dashboard';
    let currentTicketId = null;

    // --- DOM ELEMENTS ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    // --- INITIALIZATION ---
    async function init() {
        const loggedInUser = JSON.parse(sessionStorage.getItem('quickdesk_currentUser'));
        if (loggedInUser) {
            currentUser = loggedInUser;
            await fetchInitialData();
            showApp();
        } else {
            showAuth();
        }
    }

    async function fetchInitialData() {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            users = data.users;
            tickets = data.tickets;
            categories = data.categories;
            notifications = data.notifications;
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    }

    // --- AUTHENTICATION & UI ---
    function showAuth() {
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        authContainer.innerHTML = `
            <div id="login-card" class="form-card">
                <h2>Login</h2>
                <form id="login-form">
                    <div class="form-group"><label for="login-email">Email</label><input type="email" id="login-email" required></div>
                    <div class="form-group"><label for="login-password">Password</label><input type="password" id="login-password" required></div>
                    <button type="submit">Login</button>
                </form>
                <p class="switch-form">Don't have an account? <a href="#" id="show-register-link">Register here</a></p>
            </div>
            <div id="register-card" class="form-card hidden">
                <h2>Register</h2>
                <form id="register-form">
                    <div class="form-group"><label for="register-name">Name</label><input type="text" id="register-name" required></div>
                    <div class="form-group"><label for="register-email">Email</label><input type="email" id="register-email" required></div>
                    <div class="form-group"><label for="register-password">Password</label><input type="password" id="register-password" required></div>
                    <button type="submit">Register</button>
                </form>
                <p class="switch-form">Already have an account? <a href="#" id="show-login-link">Login here</a></p>
            </div>
        `;
    }

    function showApp() {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        appContainer.querySelector('#welcome-message').textContent = `Welcome, ${currentUser.name}! (${currentUser.role})`;
        appContainer.querySelector('#admin-panel-button').classList.toggle('hidden', currentUser.role !== 'Admin');
        renderNotificationBell();
        navigateTo('dashboard');
    }

    function navigateTo(view, ticketId = null) {
        if (view === 'admin' && currentUser.role !== 'Admin') return;
        currentView = view;
        currentTicketId = ticketId;
        renderCurrentView();
    }

    function renderCurrentView() {
        const dashboardView = appContainer.querySelector('#dashboard-view');
        const ticketDetailView = appContainer.querySelector('#ticket-detail-view');
        const adminView = appContainer.querySelector('#admin-view');
        const dashboardButton = appContainer.querySelector('#dashboard-button');
        const adminPanelButton = appContainer.querySelector('#admin-panel-button');

        dashboardView.classList.add('hidden');
        ticketDetailView.classList.add('hidden');
        adminView.classList.add('hidden');
        dashboardButton.classList.remove('active');
        adminPanelButton.classList.remove('active');

        if (currentView === 'dashboard') { dashboardView.classList.remove('hidden'); dashboardButton.classList.add('active'); renderDashboard(); }
        else if (currentView === 'ticket-detail') { ticketDetailView.classList.remove('hidden'); renderTicketDetail(); }
        else if (currentView === 'admin') { adminView.classList.remove('hidden'); adminPanelButton.classList.add('active'); renderAdminPanel(); }
    }

    // --- API HANDLERS ---
    async function handleLogin(form) {
        const email = form.querySelector('#login-email').value;
        const password = form.querySelector('#login-password').value;
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
            currentUser = await response.json();
            sessionStorage.setItem('quickdesk_currentUser', JSON.stringify(currentUser));
            await fetchInitialData();
            showApp();
        } else {
            alert('Invalid email or password.');
        }
    }

    async function handleRegister(form) {
        const name = form.querySelector('#register-name').value;
        const email = form.querySelector('#register-email').value;
        const password = form.querySelector('#register-password').value;
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        });
        if (response.ok) {
            alert('Registration successful! Please log in.');
            authContainer.querySelector('#show-login-link').click();
        } else {
            alert('Email already exists.');
        }
    }

    function handleLogout() {
        currentUser = null;
        sessionStorage.removeItem('quickdesk_currentUser');
        showAuth();
    }

    async function handleCreateTicket(form) {
        const subject = form.querySelector('#ticket-subject').value;
        const description = form.querySelector('#ticket-description').value;
        const categoryId = parseInt(form.querySelector('#ticket-category').value);

        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subject, description, categoryId, userEmail: currentUser.email }),
        });

        if (response.ok) {
            alert('Ticket created successfully!');
            const newTicket = await response.json();

            users.forEach(user => {
                if (user.role === 'SupportAgent' || user.role === 'Admin') {
                    createNotification(user.email, `New ticket from ${currentUser.name}: "${subject}"`, newTicket.id);
                }
            });

            await fetchInitialData();
            form.reset();
            document.getElementById('ticket-modal').classList.add('hidden');
            renderDashboard();
        } else {
            alert('Failed to create ticket.');
        }
    }

    // --- RENDER FUNCTIONS ---
    // --- DASHBOARD ---
    // --- FIND THIS FUNCTION IN main.js ---
    function renderDashboard() {
        const ticketsList = appContainer.querySelector('#tickets-list');
        const searchTerm = appContainer.querySelector('#search-input').value.toLowerCase();
        const status = appContainer.querySelector('#status-filter').value;

        let filteredTickets = tickets;

        // *** THIS IS THE FIX ***
        // It now correctly filters tickets by comparing the ticket's authorId 
        // with the logged-in currentUser's id.
        if (currentUser.role === 'EndUser') {
            filteredTickets = tickets.filter(t => t.authorId === currentUser.id);
        }

        if (searchTerm) {
            filteredTickets = filteredTickets.filter(t => t.subject.toLowerCase().includes(searchTerm));
        }
        if (status !== 'all') {
            filteredTickets = filteredTickets.filter(t => t.status === status);
        }

        ticketsList.innerHTML = '';
        if (filteredTickets.length === 0) {
            ticketsList.innerHTML = '<p style="text-align: center; color: #94a3b8;">No tickets found.</p>';
        } else {
            filteredTickets.forEach(ticket => {
                const ticketCard = document.createElement('div');
                ticketCard.className = 'ticket-card';
                ticketCard.dataset.id = ticket.id;
                const author = users.find(u => u.id === ticket.authorId);
                ticketCard.innerHTML = `<span class="status ${ticket.status.replace(' ', '-')}">${ticket.status}</span><h3>${ticket.subject}</h3><p class="meta">By: ${author?.name || 'Unknown'} | Category: ${categories.find(c => c.id === ticket.categoryId)?.name || 'N/A'} | Votes: ${ticket.votes || 0}</p>`;
                ticketsList.appendChild(ticketCard);
            });
        }
    }

    function renderTicketDetail() {
        const ticketDetailView = appContainer.querySelector('#ticket-detail-view');
        const ticket = tickets.find(t => t.id === currentTicketId);
        if (!ticket) { navigateTo('dashboard'); return; }
        const canUpdateStatus = currentUser.role === 'Admin' || currentUser.role === 'SupportAgent';
        const commentsHtml = (ticket.comments || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(c => {
            const author = users.find(u => u.id === c.authorId);
            return `<div class="comment"><p><strong>${author?.name || 'Unknown'}:</strong> ${c.text}</p><span class="comment-timestamp">${new Date(c.createdAt).toLocaleString()}</span></div>`;
        }).join('');
        ticketDetailView.innerHTML = `<button id="back-to-dashboard">&larr; Back to Dashboard</button><div class="ticket-detail-header"><h2>${ticket.subject}</h2><p>${ticket.description}</p><div class="ticket-actions"><span class="status ${ticket.status.replace(' ', '-')}">${ticket.status}</span>${canUpdateStatus ? `<select id="status-updater" data-id="${ticket.id}"><option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option><option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option><option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option></select>` : ''}<div class="vote-buttons" data-id="${ticket.id}"><button data-vote="up">👍 Upvote</button><span>${ticket.votes || 0}</span><button data-vote="down">👎 Downvote</button></div></div></div><div class="comments-section"><h3>Comments</h3><div id="comments-list">${commentsHtml}</div><form id="comment-form"><textarea id="comment-text" rows="3" placeholder="Add a comment..."></textarea><button type="submit">Post Comment</button></form></div>`;
    }

    function renderAdminPanel() {
        const adminView = appContainer.querySelector('#admin-view');
        const userManagementList = adminView.querySelector('#user-management-list');
        const categoryManagementList = adminView.querySelector('#category-management-list');
        userManagementList.innerHTML = users.map(user => { const isCurrentUser = currentUser.email === user.email; const roleSelector = isCurrentUser ? `<strong>${user.role}</strong>` : `<select class="role-selector" data-email="${user.email}"><option value="EndUser" ${user.role === 'EndUser' ? 'selected' : ''}>End User</option><option value="SupportAgent" ${user.role === 'SupportAgent' ? 'selected' : ''}>Support Agent</option><option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option></select>`; return `<div class="list-item"><span>${user.name} (${user.email})</span><div class="list-item-controls">${roleSelector}${!isCurrentUser ? `<button class="delete-user-btn" data-email="${user.email}">Delete</button>` : ''}</div></div>`; }).join('');
        categoryManagementList.innerHTML = categories.map(cat => `<div class="list-item"><span>${cat.name}</span><button class="delete-cat-btn" data-id="${cat.id}">Delete</button></div>`).join('');
    }

    // --- NOTIFICATIONS ---
    async function createNotification(recipientEmail, message, ticketId) { await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientEmail, message, ticketId }) }); await fetchInitialData(); renderNotificationBell(); }
    function renderNotificationBell() { const notificationCount = appContainer.querySelector('#notification-count'); const unreadCount = notifications.filter(n => n.recipientEmail === currentUser.email && !n.isRead).length; notificationCount.textContent = unreadCount; notificationCount.classList.toggle('hidden', unreadCount === 0); }
    function renderNotificationPanel() { const notificationPanel = appContainer.querySelector('#notification-panel'); const userNotifications = notifications.filter(n => n.recipientEmail === currentUser.email).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); if (userNotifications.length === 0) { notificationPanel.innerHTML = '<div class="no-notifications">No notifications yet.</div>'; return; } notificationPanel.innerHTML = userNotifications.map(n => `<div class="notification-item ${n.isRead ? '' : 'unread'}" data-ticket-id="${n.ticketId}" data-notification-id="${n.id}"><p>${n.message}</p><div class="timestamp">${new Date(n.createdAt).toLocaleString()}</div></div>`).join(''); }
    async function markAllNotificationsAsRead() { await fetch('/api/notifications/read', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userEmail: currentUser.email }) }); await fetchInitialData(); renderNotificationBell(); }

    // --- EVENT DELEGATION ---
    document.addEventListener('click', async (e) => {
        if (e.target.matches('#show-register-link')) { e.preventDefault(); authContainer.querySelector('#login-card').classList.add('hidden'); authContainer.querySelector('#register-card').classList.remove('hidden'); }
        if (e.target.matches('#show-login-link')) { e.preventDefault(); authContainer.querySelector('#login-card').classList.remove('hidden'); authContainer.querySelector('#register-card').classList.add('hidden'); }
        if (e.target.matches('#logout-button')) handleLogout();
        if (e.target.matches('#dashboard-button')) navigateTo('dashboard');
        if (e.target.matches('#admin-panel-button')) navigateTo('admin');
        if (e.target.matches('#show-ticket-modal-button')) { document.getElementById('ticket-modal').classList.remove('hidden'); const ticketCategorySelect = document.getElementById('ticket-category'); ticketCategorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join(''); }
        if (e.target.matches('#cancel-ticket-button')) { document.getElementById('ticket-modal').classList.add('hidden'); }
        if (e.target.closest('.ticket-card')) { navigateTo('ticket-detail', parseInt(e.target.closest('.ticket-card').dataset.id)); }
        if (e.target.matches('#back-to-dashboard')) { navigateTo('dashboard'); }
        if (e.target.closest('.vote-buttons')) { const button = e.target; const voteType = button.dataset.vote; if (!voteType) return; const response = await fetch(`/api/tickets/${currentTicketId}/vote`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voteType }) }); if (response.ok) { await fetchInitialData(); renderTicketDetail(); } }
        if (e.target.closest('#notification-bell')) { const panel = appContainer.querySelector('#notification-panel'); panel.classList.toggle('hidden'); if (!panel.classList.contains('hidden')) { renderNotificationPanel(); markAllNotificationsAsRead(); } }
        if (e.target.closest('.notification-item')) { const item = e.target.closest('.notification-item'); const ticketId = parseInt(item.dataset.ticketId); await markAllNotificationsAsRead(); appContainer.querySelector('#notification-panel').classList.add('hidden'); navigateTo('ticket-detail', ticketId); }
    });

    document.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (e.target.matches('#login-form')) handleLogin(e.target);
        if (e.target.matches('#register-form')) handleRegister(e.target);
        if (e.target.matches('#ticket-form')) handleCreateTicket(e.target);
        if (e.target.matches('#comment-form')) { const text = e.target.querySelector('#comment-text').value; if (!text) return; const response = await fetch(`/api/tickets/${currentTicketId}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, userEmail: currentUser.email }) }); if (response.ok) { const ticket = tickets.find(t => t.id === currentTicketId); const ticketAuthor = users.find(u => u.id === ticket.authorId); if (currentUser.role !== 'EndUser' && ticketAuthor.email !== currentUser.email) { createNotification(ticketAuthor.email, `${currentUser.name} commented on your ticket: "${ticket.subject}"`, ticket.id); } await fetchInitialData(); renderTicketDetail(); } }
        if (e.target.matches('#category-form')) { const name = e.target.querySelector('#category-name-input').value; if (!name) return; await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); await fetchInitialData(); e.target.reset(); renderAdminPanel(); }
    });

    document.addEventListener('change', async (e) => {
        if (e.target.matches('#status-filter')) renderDashboard();
        if (e.target.matches('#status-updater')) { const newStatus = e.target.value; const response = await fetch(`/api/tickets/${currentTicketId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) }); if (response.ok) { const updatedTicket = await response.json(); const ticketAuthor = users.find(u => u.id === updatedTicket.authorId); createNotification(ticketAuthor.email, `Status of your ticket "${updatedTicket.subject}" was changed to ${newStatus}`, updatedTicket.id); await fetchInitialData(); renderTicketDetail(); } }
        if (e.target.matches('.role-selector')) { const email = e.target.dataset.email; const newRole = e.target.value; await fetch(`/api/users/${email}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) }); await fetchInitialData(); renderAdminPanel(); }
    });

    document.addEventListener('input', (e) => {
        if (e.target.matches('#search-input')) renderDashboard();
    });

    // --- START THE APP ---
    init();
});
