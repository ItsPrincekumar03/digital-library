const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler');

// Routes
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const authorRoutes = require('./routes/author.routes');
const categoryRoutes = require('./routes/category.routes');
const bookRoutes = require('./routes/book.routes');
const chapterRoutes = require('./routes/chapter.routes');

const app = express();

// -----------------------------
// Security middleware
// -----------------------------
app.use(helmet());

// -----------------------------
// CORS
// -----------------------------
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    })
);

// -----------------------------
// Request parsing
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// -----------------------------
// API Routes
// -----------------------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chapters', chapterRoutes);

// -----------------------------
// 404 Handler
// -----------------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.',
    });
});

// -----------------------------
// Central Error Handler
// Must be last
// -----------------------------
app.use(errorHandler);

module.exports = app;