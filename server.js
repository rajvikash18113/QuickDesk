// server.js

// --- 1. IMPORTS ---
const express = require('express');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// --- 2. SETUP ---
const prisma = new PrismaClient();
const app = express();
const PORT = 3001;
const saltRounds = 10;

// --- 3. MIDDLEWARE ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. API ROUTES ---

// A. AUTHENTICATION
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: 'EndUser' },
        });
        res.status(201).json({ name: newUser.name, email: newUser.email, role: newUser.role });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists.' });
    }
});


app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
        // THE FIX: Add user.id to the response
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } else {
        res.status(401).json({ error: 'Invalid email or password.' });
    }
});

// B. INITIAL DATA
app.get('/api/data', async (req, res) => {
    const [users, tickets, categories, notifications] = await Promise.all([
        // THE FIX: Add id: true to the user data request
        prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } }),
        prisma.ticket.findMany({ include: { comments: true } }),
        prisma.category.findMany(),
        prisma.notification.findMany(),
    ]);
    res.json({ users, tickets, categories, notifications });
});
// C. TICKETS
app.post('/api/tickets', async (req, res) => {
    const { subject, description, categoryId, userEmail } = req.body;
    const author = await prisma.user.findUnique({ where: { email: userEmail } });
    const newTicket = await prisma.ticket.create({
        data: { subject, description, authorId: author.id, categoryId: categoryId },
        include: { comments: true },
    });
    res.status(201).json(newTicket);
});

// D. COMMENTS
app.post('/api/tickets/:id/comments', async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { text, userEmail } = req.body;
    const author = await prisma.user.findUnique({ where: { email: userEmail } });
    const newComment = await prisma.comment.create({
        data: { text, authorId: author.id, ticketId: ticketId },
    });
    res.status(201).json(newComment);
});

// E. TICKET UPDATES (STATUS & VOTES)
app.put('/api/tickets/:id/status', async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;
    const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: status },
    });
    res.json(updatedTicket);
});

app.put('/api/tickets/:id/vote', async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { voteType } = req.body;
    const increment = voteType === 'up' ? 1 : -1;
    const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { votes: { increment } },
    });
    res.json(updatedTicket);
});

// F. NOTIFICATIONS
app.post('/api/notifications', async (req, res) => {
    const { recipientEmail, message, ticketId } = req.body;
    const newNotification = await prisma.notification.create({
        data: { recipientEmail, message, ticketId },
    });
    res.status(201).json(newNotification);
});

app.put('/api/notifications/read', async (req, res) => {
    const { userEmail } = req.body;
    await prisma.notification.updateMany({
        where: { recipientEmail: userEmail, isRead: false },
        data: { isRead: true },
    });
    res.status(200).send();
});

// G. ADMIN ACTIONS
app.put('/api/users/:email/role', async (req, res) => {
    const { role } = req.body;
    const updatedUser = await prisma.user.update({
        where: { email: req.params.email },
        data: { role: role },
    });
    res.json(updatedUser);
});

app.post('/api/categories', async (req, res) => {
    const { name } = req.body;
    const newCategory = await prisma.category.create({ data: { name } });
    res.status(201).json(newCategory);
});

// --- 5. DATABASE SEEDING ---
async function seedDatabase() {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
        console.log('Database is empty. Seeding default users and categories...');
        const defaultUsers = [
            { name: 'Admin', email: 'admin@gmail.com', password: 'admin', role: 'Admin' },
            { name: 'Agent 1', email: 'agent1@gmail.com', password: 'agent', role: 'SupportAgent' },
            { name: 'Agent 2', email: 'agent2@gmail.com', password: 'agent', role: 'SupportAgent' },
            { name: 'User 1', email: 'user1@gmail.com', password: 'user', role: 'EndUser' },
            { name: 'User 2', email: 'user2@gmail.com', password: 'user', role: 'EndUser' }
        ];
        for (const userData of defaultUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            await prisma.user.create({ data: { ...userData, password: hashedPassword } });
        }
        await prisma.category.createMany({
            data: [{ name: 'Technical' }, { name: 'Billing' }],
            skipDuplicates: true,
        });
        console.log('Default users and categories created.');
    }
}

// --- 6. START THE SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running! Open http://localhost:${PORT} in your browser.`);
    seedDatabase();
});
