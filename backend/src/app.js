const express = require('express');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Routes
const profileRoutes = require('./routes/profile.routes');
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);

// Fallback 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Central error handler — must be last
app.use(errorHandler);

module.exports = app;