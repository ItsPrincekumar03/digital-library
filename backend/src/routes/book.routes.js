const express = require('express');

const router = express.Router();

const {
    create,
    getAll,
    getById,
    update,
    archive
} = require('../controllers/book.controller');

const { authenticateToken } = require('../middleware');

// Get all books
router.get('/', authenticateToken, getAll);

// Get a single book
router.get('/:id', authenticateToken, getById);

// Create a book
router.post('/', authenticateToken, create);

// Update a book
router.put('/:id', authenticateToken, update);

// Archive a book
router.delete('/:id', authenticateToken, archive);

module.exports = router;