const authRepository = require('../repositories/auth.repository');
const bcrypt = require('bcrypt');

async function findByEmail(email) {
    return authRepository.findByEmail(email);
}

async function findById(id) {
    return authRepository.findById(id);
}

async function saveRefreshToken(userId, refreshToken) {
    await authRepository.saveRefreshToken(userId, refreshToken);
}

async function generateHashedPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

module.exports = {
    findByEmail,
    findById,
    saveRefreshToken,
    generateHashedPassword
};
