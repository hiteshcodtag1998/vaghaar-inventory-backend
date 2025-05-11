// setupRoutes.js
const express = require('express');

// Import Routes
const roleRoute = require('./role');
const userRoute = require('./user');
const productRoute = require('./product');
const storeRoute = require('./store');
const purchaseRoute = require('./purchase');
const salesRoute = require('./sales');
const historyRoute = require('./history');
const brandRoute = require('./brand');
const warehouseRoute = require('./warehouse');
const writeOffRoute = require('./writeOff');
const transferStockRoute = require('./transferStock');
const authRoute = require('./auth');
const authenticateJWT = require('../middleware/authMiddleware');

// Define the base API path as a constant
const API_PREFIX = '/api/v1'; // Version 1 of your API

const setupRoutes = (app) => {
    // Authentication Routes (public, no middleware required)
    app.use(`${API_PREFIX}/auth`, authRoute);

    // Protected Routes (require JWT authentication)
    app.use(`${API_PREFIX}/role`, authenticateJWT, roleRoute);
    app.use(`${API_PREFIX}/user`, authenticateJWT, userRoute);
    app.use(`${API_PREFIX}/store`, authenticateJWT, storeRoute);
    app.use(`${API_PREFIX}/product`, authenticateJWT, productRoute);
    app.use(`${API_PREFIX}/purchase`, authenticateJWT, purchaseRoute);
    app.use(`${API_PREFIX}/sales`, authenticateJWT, salesRoute);
    app.use(`${API_PREFIX}/history`, authenticateJWT, historyRoute);
    app.use(`${API_PREFIX}/brand`, authenticateJWT, brandRoute);
    app.use(`${API_PREFIX}/warehouse`, authenticateJWT, warehouseRoute);
    app.use(`${API_PREFIX}/writeoff`, authenticateJWT, writeOffRoute);
    app.use(`${API_PREFIX}/transferstock`, authenticateJWT, transferStockRoute);
};

module.exports = setupRoutes;
