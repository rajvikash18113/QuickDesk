// server.js

// 1. Import the express library
const express = require('express');
const path = require('path');

// 2. Create our server application
const app = express();

// 3. Define the port number
const PORT = 3001;

// 4. Tell our server to make the 'public' folder accessible
app.use(express.static(path.join(__dirname, 'public')));

// 5. Start the server and log a message to the console
app.listen(PORT, () => {
    console.log(`Server is running! Open http://localhost:${PORT} in your browser.`);
});
