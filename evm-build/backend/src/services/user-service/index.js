const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../../models/user-model');
const { ValidationError } = require('../utils/responseHandler');

class AuthService {
  /**
   * Generate JWT Token
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { 
        expiresIn: process.env.JWT_EXPIRATION || '7d' 
      }
    );
  }

  /**
   * User registration
   * @param {Object} userData - User registration data
   * @returns {Object} Created user and token
   */
  async register(userData) {
    // Validate unique constraints
    const { username, email, address } = userData;

    // Check if username already exists
    let existingUser = await User.findOne({ 
      $or: [
        { username }, 
        { email },
        { address }
      ] 
    });

    if (existingUser) {
      if (existingUser.username === username) {
        throw new ValidationError('Username already exists');
      }
      if (existingUser.email === email) {
        throw new ValidationError('Email already exists');
      }
      if (existingUser.address === address) {
        throw new ValidationError('Wallet address already registered');
      }
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    return { 
      user: user.toJSON(), 
      token 
    };
  }

  /**
   * User login
   * @param {string} login - Email or username
   * @param {string} password - User password
   * @returns {Object} User and token
   */
  async login(login, password) {
    // Find user by email or username
    const user = await User.findByLogin(login);

    // Validate user and password
    if (!user) {
      throw new ValidationError('Invalid login credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ValidationError('Invalid login credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = this.generateToken(user);

    return { 
      user: user.toJSON(), 
      token 
    };
  }

  /**
   * Initiate password reset
   * @param {string} email - User email
   * @returns {Object} Reset token details
   */
  async initiatePasswordReset(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new ValidationError('No account found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set reset token and expiration
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    return {
      resetToken,
      email: user.email
    };
  }

  /**
   * Reset user password
   * @param {string} resetToken - Password reset token
   * @param {string} newPassword - New password
   * @returns {Object} Updated user
   */
  async resetPassword(resetToken, newPassword) {
    // Hash the reset token
    const resetTokenHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user.toJSON();
  }
}

module.exports = new AuthService();