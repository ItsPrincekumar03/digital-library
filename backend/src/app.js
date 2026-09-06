const express = require('express');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const authorRoutes = require('./routes/author.routes');
const categoryRoutes = require('./routes/category.routes');
const bookRoutes = require('./routes/book.routes');
const chapterRoutes = require('./routes/chapter.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());

// Routes
const profileRoutes = require('./routes/profile.routes');
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/chapters', chapterRoutes);


// Fallback 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// Central error handler — must be last
app.use(errorHandler);

module.exports = app;