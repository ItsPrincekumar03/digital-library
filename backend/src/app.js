const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middleware/errorHandler');
const { buildCspConfig } = require('./config/csp.config');
const { isOriginAllowed } = require('./config/cors.config');
const { csrfProtection } = require('./middleware/csrf.middleware');

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

// Module 27 SEC-02: Custom CSP compatible with the reader stack (PDF.js worker,
// Web Speech API TTS, same-origin scripts and styles).
const cspConfig = buildCspConfig(isProduction);

app.use(
    helmet({
        strictTransportSecurity: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
        contentSecurityPolicy: cspConfig,
        crossOriginResourcePolicy: isProduction ? undefined : { policy: 'cross-origin' },
    })
);

// -----------------------------
// CORS
// -----------------------------
app.use(
    cors({
        origin: function (origin, callback) {
            // Requests without an Origin header (e.g. same-origin GETs, curl, health checks) are allowed.
            if (!origin) {
                return callback(null, true);
            }

            if (isOriginAllowed(origin)) {
                return callback(null, true);
            }

            const err = new Error('Not allowed by CORS');
            err.status = 403;
            err.code = 'CSRF_ORIGIN_FORBIDDEN';
            return callback(err);
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        exposedHeaders: ['X-CSRF-Token'],
    })
);

// -----------------------------
// Request parsing & CSRF guard
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Module 27 SEC-01: CSRF protection runs before route handlers and Multer uploads.
app.use(csrfProtection);

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
