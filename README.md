# QuickDesk Help Desk System

QuickDesk is a simple, easy-to-use help desk solution where users can raise support tickets, and support staff can manage and resolve them efficiently. This project was built for the Odoo x CGC Mohali Hackathon '25.

**Live Demo:** [**https://quickdesk-15ay.onrender.com/**](https://quickdesk-15ay.onrender.com/) 🚀

---

## 🎥 Video Demo

[![QuickDesk Video Demo](https://img.youtube.com/vi/o_837O-327c/0.jpg)](http://www.youtube.com/watch?v=PgceWdpxKU8)

*(Click the image above to watch a full video demonstration of the project: [QuickDesk - (ODOO) hackathon Project](http://www.youtube.com/watch?v=PgceWdpxKU8))*

---

## ✨ Key Features

* **Role-Based Access Control:**
    * **End Users:** Can register, create tickets for their issues, view their own tickets, and comment on them.
    * **Support Agents:** Can view all tickets, comment on any ticket, and change a ticket's status (Open, In Progress, Resolved).
    * **Admins:** Have all agent permissions, plus access to an Admin Panel to manage users and ticket categories.
* **Ticket Management:** Users can create tickets with a subject, description, and category.
* **Status Tracking:** Tickets move through a clear lifecycle: Open → In Progress → Resolved.
* **Commenting System:** A timeline-style comment section on each ticket for conversation.
* **Notification System:** Real-time notifications for agents when new tickets are created and for users when their ticket status is updated or a comment is added.
* **Filtering & Searching:** Easily find tickets by status or by searching the subject line.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Hosted on Render)
* **ORM:** Prisma (for easy database communication)
* **Password Security:** bcrypt

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need to have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/rajvikash18113/QuickDesk.git](https://github.com/rajvikash18113/QuickDesk.git)
    cd QuickDesk
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up the database connection:**
    * Create a free PostgreSQL database on a service like [Render](https://render.com/).
    * Create a `.env` file in the root of the project.
    * Add your database connection string to it:
        ```env
        DATABASE_URL="YOUR_POSTGRESQL_CONNECTION_STRING"
        ```

4.  **Sync the database schema:**
    ```sh
    npx prisma db push
    ```

5.  **Start the server:**
    ```sh
    npm start
    ```
    Your application will be running at `http://localhost:3001`. The server will automatically seed the database with default users the first time it starts.

---

## 👥 Default Users

You can log in with these default accounts to test the different roles:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@app.com` | `admin` |
| **Agent 1** | `agent1@gmail.com` | `agent` |
| **Agent 2** | `agent2@gmail.com` | `agent` |
| **User 1** | `user1@gmail.com` | `user` |
| **User 2** | `user2@gmail.com` | `user` |
