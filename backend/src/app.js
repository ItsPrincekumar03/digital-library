const express = require('express');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');

const app = express();

app.use(express.json());

// Routes
app.use('/api/health', healthRoutes);

// Fallback 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Central error handler — must be last
app.use(errorHandler);

module.exports = app;