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
const privateLibraryRoutes = require('./routes/privateLibrary.routes');

const app = express();

// -----------------------------
// Security middleware
// -----------------------------
const isProduction = process.env.NODE_ENV === 'production';

app.use(
    helmet({
        strictTransportSecurity: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
        contentSecurityPolicy: isProduction ? undefined : false,
        crossOriginResourcePolicy: isProduction ? undefined : { policy: "cross-origin" },
    })
);

// -----------------------------
// CORS
// -----------------------------
const allowedOrigins = isProduction
    ? []
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];

if (process.env.CORS_ORIGIN) {
    const configuredOrigin = process.env.CORS_ORIGIN.trim();

    if (
        configuredOrigin &&
        !allowedOrigins.includes(configuredOrigin)
    ) {
        allowedOrigins.push(configuredOrigin);
    }
}

app.use(
    cors({
        origin: function (origin, callback) {
            // Requests without an Origin header are allowed.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Development may use other localhost ports.
            if (!isProduction) {
                try {
                    const url = new URL(origin);

                    if (
                        url.hostname === 'localhost' ||
                        url.hostname === '127.0.0.1'
                    ) {
                        return callback(null, true);
                    }
                } catch (_) {
                    // Invalid origins are rejected below.
                }
            }

            return callback(new Error('Not allowed by CORS'));
        },
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
app.use('/api/private-library', privateLibraryRoutes);

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
