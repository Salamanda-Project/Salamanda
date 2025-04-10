const AuthService = require('../../services/user-service/index');
const { successResponse, errorResponse } = require('../../utils/errors');

class AuthController {
  /**
   * User Registration
   * @route POST /api/auth/register
   */
  async register(req, res) {
    try {
      const userData = req.body;
      const result = await AuthService.register(userData);
      return successResponse(res, result, 201);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * User Login
   * @route POST /api/auth/login
   */
  async login(req, res) {
    try {
      const { login, password } = req.body;
      const result = await AuthService.login(login, password);
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Initiate Password Reset
   * @route POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.initiatePasswordReset(email);
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Reset Password
   * @route POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await AuthService.resetPassword(resetToken, newPassword);
      return successResponse(res, result);
    } catch (error) {
      return errorResponse(res, error);
    }
  }

  /**
   * Get Current User Profile
   * @route GET /api/auth/profile
   */
  async getCurrentUser(req, res) {
    try {
      // req.user is set by the authentication middleware
      return successResponse(res, req.user);
    } catch (error) {
      return errorResponse(res, error);
    }
  }
}

module.exports = new AuthController();