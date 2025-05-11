const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // ✅
require('dotenv').config();
const initConnections = require('./models/index');
const setupRoutes = require('./router');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8889;

// ✅ CORS setup for frontend with credentials (cookies)
app.use(
    cors({
        origin: process.env.FRONTEND_URL, // e.g., http://localhost:3000
        credentials: true,
    })
);

// Connect to DB
initConnections();

// Middleware
app.use(express.json());
app.use(cookieParser()); // ✅ Enable reading cookies

// Set up routes
setupRoutes(app);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
