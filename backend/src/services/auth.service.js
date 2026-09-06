const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt.config');
const userRepository = require('../repositories/user.repository');

const SALT_ROUNDS = 10;

async function register({ fullName, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.status = 409;
    throw err;
  }

  const defaultRoleId = await userRepository.findRoleIdByName('USER');
  if (!defaultRoleId) {
    const err = new Error('Default USER role is not configured.');
    err.status = 500;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userId = await userRepository.createUser({
    fullName,
    email,
    passwordHash,
    roleId: defaultRoleId,
  });

  return userRepository.findById(userId);
}

async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);

  const invalidCredentialsError = () => {
    const err = new Error('Invalid email or password.');
    err.status = 401;
    return err;
  };

  if (!user) throw invalidCredentialsError();
  if (!user.is_active) {
    const err = new Error('This account has been disabled.');
    err.status = 403;
    throw err;
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) throw invalidCredentialsError();

  const safeUser = await userRepository.findById(user.user_id);

  const token = jwt.sign(
    { userId: user.user_id, role: safeUser.role_name },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  return { user: safeUser, token };
}

module.exports = { register, login };