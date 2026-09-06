const bcrypt = require('bcrypt');
const userRepository = require('../repositories/user.repository');

const SALT_ROUNDS = 10;

async function getProfile(userId) {
    const user = await userRepository.findById(userId); // already excludes password_hash
    if (!user) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
    }
    return user;
}

async function updateProfile(userId, { fullName, email }) {
    const existing = await userRepository.findByEmailExcludingUser(email, userId);
    if (existing) {
        const err = new Error('This email is already in use by another account.');
        err.status = 409;
        throw err;
    }

    await userRepository.updateProfile(userId, { fullName, email });
    return userRepository.findById(userId); // fresh, safe copy
}

async function changePassword(userId, { currentPassword, newPassword }) {
    const currentHash = await userRepository.findPasswordHashById(userId);
    if (!currentHash) {
        const err = new Error('User not found.');
        err.status = 404;
        throw err;
    }

    const matches = await bcrypt.compare(currentPassword, currentHash);
    if (!matches) {
        const err = new Error('Current password is incorrect.');
        err.status = 401;
        throw err;
    }

    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userRepository.updatePassword(userId, newHash);
}

module.exports = { getProfile, updateProfile, changePassword };