document.addEventListener('DOMContentLoaded', () => {
    // --- STATE MANAGEMENT ---
    let currentUser = null;
    let users = [];
    let tickets = [];
    let categories = [];
    let currentView = 'dashboard';
    let currentTicketId = null;

    // --- DOM ELEMENTS ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const welcomeMessage = document.getElementById('welcome-message');
    const logoutButton = document.getElementById('logout-button');
    const adminPanelButton = document.getElementById('admin-panel-button');
    const dashboardButton = document.getElementById('dashboard-button');
    const dashboardView = document.getElementById('dashboard-view');
    const ticketDetailView = document.getElementById('ticket-detail-view');
    const adminView = document.getElementById('admin-view');
    const ticketsList = document.getElementById('tickets-list');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const ticketModal = document.getElementById('ticket-modal');
    const showTicketModalButton = document.getElementById('show-ticket-modal-button');
    const cancelTicketButton = document.getElementById('cancel-ticket-button');
    const ticketForm = document.getElementById('ticket-form');
    const ticketCategorySelect = document.getElementById('ticket-category');
    const userManagementList = document.getElementById('user-management-list');
    const categoryManagementList = document.getElementById('category-management-list');
    const categoryForm = document.getElementById('category-form');
    const categoryNameInput = document.getElementById('category-name-input');

    // --- INITIALIZATION ---
    function init() {
        loadDataFromLocalStorage();
        const loggedInUser = JSON.parse(localStorage.getItem('quickdesk_currentUser'));
        if (loggedInUser) {
            const userExists = users.find(u => u.email === loggedInUser.email);
            if (userExists) {
                currentUser = userExists;
                showApp();
            } else {
                handleLogout();
            }
        } else {
            showAuth();
        }
    }

    function loadDataFromLocalStorage() {
        users = JSON.parse(localStorage.getItem('quickdesk_users')) || [];
        tickets = JSON.parse(localStorage.getItem('quickdesk_tickets')) || [];
        categories = JSON.parse(localStorage.getItem('quickdesk_categories')) || [];

        // *** THIS IS THE UPDATED SECTION ***
        // We now seed all the default users if they don't exist.
        let needsSave = false;
        const defaultUsers = [
            { name: 'Admin', email: 'admin@gmail.com', password: 'admin', role: 'Admin' },
            { name: 'Agent 1', email: 'agent1@gmail.com', password: 'agent', role: 'SupportAgent' },
            { name: 'Agent 2', email: 'agent2@gmail.com', password: 'agent', role: 'SupportAgent' },
            { name: 'User 1', email: 'user1@gmail.com', password: 'user', role: 'EndUser' },
            { name: 'User 2', email: 'user2@gmail.com', password: 'user', role: 'EndUser' }
        ];

        defaultUsers.forEach(defaultUser => {
            if (!users.find(user => user.email === defaultUser.email)) {
                users.push(defaultUser);
                needsSave = true;
            }
        });

        if (categories.length === 0) {
            categories.push({ id: 1, name: 'Technical' }, { id: 2, name: 'Billing' });
            needsSave = true;
        }
        
        if (needsSave) {
            saveDataToLocalStorage();
        }
    }

    function saveDataToLocalStorage() {
        localStorage.setItem('quickdesk_users', JSON.stringify(users));
        localStorage.setItem('quickdesk_tickets', JSON.stringify(tickets));
        localStorage.setItem('quickdesk_categories', JSON.stringify(categories));
    }

    // --- AUTHENTICATION ---
    function showAuth() {
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        authContainer.innerHTML = `<div id="login-card" class="form-card"><h2>Login</h2><form id="login-form"><div class="form-group"><label for="login-email">Email</label><input type="email" id="login-email" required></div><div class="form-group"><label for="login-password">Password</label><input type="password" id="login-password" required></div><button type="submit">Login</button></form><p class="switch-form">Don't have an account? <a href="#" id="show-register-link">Register here</a></p></div><div id="register-card" class="form-card hidden"><h2>Register</h2><form id="register-form"><div class="form-group"><label for="register-name">Name</label><input type="text" id="register-name" required></div><div class="form-group"><label for="register-email">Email</label><input type="email" id="register-email" required></div><div class="form-group"><label for="register-password">Password</label><input type="password" id="register-password" required></div><button type="submit">Register</button></form><p class="switch-form">Already have an account? <a href="#" id="show-login-link">Login here</a></p></div>`;
        document.getElementById('show-register-link').addEventListener('click', () => toggleForms(false));
        document.getElementById('show-login-link').addEventListener('click', () => toggleForms(true));
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('register-form').addEventListener('submit', handleRegister);
    }
    
    function toggleForms(showLogin = false) {
        document.getElementById('login-card').classList.toggle('hidden', !showLogin);
        document.getElementById('register-card').classList.toggle('hidden', showLogin);
    }

    function handleRegister(e) { e.preventDefault(); const name = document.getElementById('register-name').value; const email = document.getElementById('register-email').value; const password = document.getElementById('register-password').value; if (users.find(user => user.email === email)) { alert('An account with this email already exists.'); return; } users.push({ name, email, password, role: 'EndUser' }); saveDataToLocalStorage(); alert('Registration successful! Please log in.'); toggleForms(true); }
    function handleLogin(e) { e.preventDefault(); const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; const user = users.find(u => u.email === email && u.password === password); if (user) { currentUser = user; localStorage.setItem('quickdesk_currentUser', JSON.stringify(currentUser)); showApp(); } else { alert('Invalid email or password.'); } }
    function handleLogout() { currentUser = null; localStorage.removeItem('quickdesk_currentUser'); showAuth(); }

    // --- APP & VIEW RENDERING ---
    function showApp() {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        welcomeMessage.textContent = `Welcome, ${currentUser.name}! (${currentUser.role})`;
        adminPanelButton.classList.toggle('hidden', currentUser.role !== 'Admin');
        navigateTo('dashboard');
    }

    function navigateTo(view, ticketId = null) {
        if (view === 'admin' && currentUser.role !== 'Admin') {
            console.error('ACCESS DENIED: Only Admins can access the admin panel.');
            return;
        }
        currentView = view;
        currentTicketId = ticketId;
        renderCurrentView();
    }

    function renderCurrentView() {
        dashboardView.classList.add('hidden');
        ticketDetailView.classList.add('hidden');
        adminView.classList.add('hidden');
        dashboardButton.classList.remove('active');
        adminPanelButton.classList.remove('active');

        if (currentView === 'dashboard') {
            dashboardView.classList.remove('hidden');
            dashboardButton.classList.add('active');
            renderDashboard();
        } else if (currentView === 'ticket-detail') {
            ticketDetailView.classList.remove('hidden');
            renderTicketDetail();
        } else if (currentView === 'admin') {
            adminView.classList.remove('hidden');
            adminPanelButton.classList.add('active');
            renderAdminPanel();
        }
    }

    // --- DASHBOARD ---
    function renderDashboard() {
        const searchTerm = searchInput.value.toLowerCase();
        const status = statusFilter.value;
        let filteredTickets;

        if (currentUser.role === 'EndUser') {
            filteredTickets = tickets.filter(t => t.userEmail === currentUser.email);
        } else {
            filteredTickets = tickets;
        }

        if (searchTerm) { filteredTickets = filteredTickets.filter(t => t.subject.toLowerCase().includes(searchTerm)); }
        if (status !== 'all') { filteredTickets = filteredTickets.filter(t => t.status === status); }

        ticketsList.innerHTML = '';
        filteredTickets.forEach(ticket => {
            const ticketCard = document.createElement('div');
            ticketCard.className = 'ticket-card';
            ticketCard.dataset.id = ticket.id;
            ticketCard.innerHTML = `<span class="status ${ticket.status.replace(' ', '-')}">${ticket.status}</span><h3>${ticket.subject}</h3><p class="meta">Category: ${categories.find(c => c.id === ticket.categoryId)?.name || 'N/A'} | Votes: ${ticket.votes || 0}</p>`;
            ticketCard.addEventListener('click', () => navigateTo('ticket-detail', ticket.id));
            ticketsList.appendChild(ticketCard);
        });
    }

    // --- TICKET DETAIL ---
    function renderTicketDetail() {
        const ticket = tickets.find(t => t.id === currentTicketId);
        if (!ticket) { navigateTo('dashboard'); return; }

        const canUpdateStatus = currentUser.role === 'Admin' || currentUser.role === 'SupportAgent';
        const commentsHtml = (ticket.comments || []).map(c => `<div class="comment"><p><strong>${users.find(u => u.email === c.userEmail)?.name || 'Unknown'}:</strong> ${c.text}</p><span class="comment-timestamp">${new Date(c.timestamp).toLocaleString()}</span></div>`).join('');

        ticketDetailView.innerHTML = `<button id="back-to-dashboard">&larr; Back to Dashboard</button><div class="ticket-detail-header"><h2>${ticket.subject}</h2><p>${ticket.description}</p><div class="ticket-actions"><span class="status ${ticket.status.replace(' ', '-')}">${ticket.status}</span>${canUpdateStatus ? `<select id="status-updater" data-id="${ticket.id}"><option value="Open" ${ticket.status === 'Open' ? 'selected' : ''}>Open</option><option value="In Progress" ${ticket.status === 'In Progress' ? 'selected' : ''}>In Progress</option><option value="Resolved" ${ticket.status === 'Resolved' ? 'selected' : ''}>Resolved</option></select>` : ''}<div class="vote-buttons"><button data-id="${ticket.id}" data-vote="up">👍 Upvote</button><span>${ticket.votes || 0}</span><button data-id="${ticket.id}" data-vote="down">👎 Downvote</button></div></div></div><div class="comments-section"><h3>Comments</h3><div id="comments-list">${commentsHtml}</div><form id="comment-form"><textarea id="comment-text" rows="3" placeholder="Add a comment..."></textarea><button type="submit">Post Comment</button></form></div>`;
        
        document.getElementById('back-to-dashboard').addEventListener('click', () => navigateTo('dashboard'));
        document.getElementById('comment-form').addEventListener('submit', handleAddComment);
        if (canUpdateStatus) { document.getElementById('status-updater').addEventListener('change', handleStatusUpdate); }
        ticketDetailView.querySelector('[data-vote="up"]').addEventListener('click', handleVote);
        ticketDetailView.querySelector('[data-vote="down"]').addEventListener('click', handleVote);
    }
    
    function handleAddComment(e) { e.preventDefault(); const text = document.getElementById('comment-text').value; if (!text) return; const ticket = tickets.find(t => t.id === currentTicketId); if (!ticket.comments) ticket.comments = []; ticket.comments.push({ userEmail: currentUser.email, text, timestamp: Date.now() }); saveDataToLocalStorage(); renderTicketDetail(); }
    function handleStatusUpdate(e) { const ticket = tickets.find(t => t.id === currentTicketId); ticket.status = e.target.value; saveDataToLocalStorage(); renderTicketDetail(); }
    function handleVote(e) { const ticket = tickets.find(t => t.id === currentTicketId); const voteType = e.target.dataset.vote; if (!ticket.votes) ticket.votes = 0; if (voteType === 'up') ticket.votes++; else ticket.votes--; saveDataToLocalStorage(); renderTicketDetail(); }

    // --- TICKET MODAL ---
    function openTicketModal() { ticketCategorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join(''); ticketModal.classList.remove('hidden'); }
    function handleCreateTicket(e) { e.preventDefault(); const newTicket = { id: Date.now(), userEmail: currentUser.email, subject: document.getElementById('ticket-subject').value, description: document.getElementById('ticket-description').value, categoryId: parseInt(ticketCategorySelect.value), status: 'Open', votes: 0, comments: [] }; tickets.push(newTicket); saveDataToLocalStorage(); ticketForm.reset(); ticketModal.classList.add('hidden'); renderDashboard(); }

    // --- ADMIN PANEL ---
    function renderAdminPanel() {
        userManagementList.innerHTML = users.map(user => { const isCurrentUser = currentUser.email === user.email; const roleSelector = isCurrentUser ? `<strong>${user.role}</strong>` : `<select class="role-selector" data-email="${user.email}"><option value="EndUser" ${user.role === 'EndUser' ? 'selected' : ''}>End User</option><option value="SupportAgent" ${user.role === 'SupportAgent' ? 'selected' : ''}>Support Agent</option><option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option></select>`; return `<div class="list-item"><span>${user.name} (${user.email})</span><div class="list-item-controls">${roleSelector}${!isCurrentUser ? `<button class="delete-user-btn" data-email="${user.email}">Delete</button>` : ''}</div></div>`; }).join('');
        categoryManagementList.innerHTML = categories.map(cat => `<div class="list-item"><span>${cat.name}</span><button class="delete-cat-btn" data-id="${cat.id}">Delete</button></div>`).join('');
        document.querySelectorAll('.delete-user-btn').forEach(btn => btn.addEventListener('click', handleDeleteUser));
        document.querySelectorAll('.delete-cat-btn').forEach(btn => btn.addEventListener('click', handleDeleteCategory));
        document.querySelectorAll('.role-selector').forEach(sel => sel.addEventListener('change', handleRoleChange));
    }

    function handleRoleChange(e) { const email = e.target.dataset.email; const newRole = e.target.value; const userToUpdate = users.find(u => u.email === email); if (userToUpdate) { userToUpdate.role = newRole; saveDataToLocalStorage(); renderAdminPanel(); } }
    function handleAddCategory(e) { e.preventDefault(); const name = categoryNameInput.value; if (!name) return; categories.push({ id: Date.now(), name }); saveDataToLocalStorage(); categoryNameInput.value = ''; renderAdminPanel(); }
    function handleDeleteUser(e) { const email = e.target.dataset.email; users = users.filter(u => u.email !== email); saveDataToLocalStorage(); renderAdminPanel(); }
    function handleDeleteCategory(e) { const id = parseInt(e.target.dataset.id); categories = categories.filter(c => c.id !== id); saveDataToLocalStorage(); renderAdminPanel(); }

    // --- GLOBAL EVENT LISTENERS ---
    logoutButton.addEventListener('click', handleLogout);
    dashboardButton.addEventListener('click', () => navigateTo('dashboard'));
    adminPanelButton.addEventListener('click', () => navigateTo('admin'));
    showTicketModalButton.addEventListener('click', openTicketModal);
    cancelTicketButton.addEventListener('click', () => ticketModal.classList.add('hidden'));
    ticketForm.addEventListener('submit', handleCreateTicket);
    categoryForm.addEventListener('submit', handleAddCategory);
    searchInput.addEventListener('input', renderDashboard);
    statusFilter.addEventListener('change', renderDashboard);

    // --- START THE APP ---
    init();
});
