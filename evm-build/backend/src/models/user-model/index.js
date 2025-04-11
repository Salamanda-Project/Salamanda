const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const UserSchema = new mongoose.Schema({
  id: { 
    type: String, 
    default: uuidv4, 
    unique: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    minlength: 3,
    maxlength: 30
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'creator'],
    default: 'user'
  },
  address: {
    type: String,
    unique: true,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  methods: {
    /**
     * Compare password for authentication
     * @param {string} candidatePassword - Password to compare
     * @returns {Promise<boolean>} Password match result
     */
    async comparePassword(candidatePassword) {
      return await bcrypt.compare(candidatePassword, this.password);
    },

    /**
     * Prepare user object for JSON response (hide sensitive fields)
     * @returns {Object} Sanitized user object
     */
    toJSON() {
      const obj = this.toObject();
      delete obj.password;
      delete obj.resetPasswordToken;
      delete obj.resetPasswordExpires;
      return obj;
    }
  }
});

// Pre-save hook to hash password
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with our new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    return next(error);
  }
});

const User = mongoose.model('User', UserSchema);

const UserModel = {
  /**
   * Create a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Created user
   */
  create: async (userData) => {
    const user = new User({
      ...userData,
      id: uuidv4(),
      createdAt: new Date()
    });
    return await user.save();
  },

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  findById: async (id) => {
    return await User.findById(id);
  },

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User or null
   */
  findByUsername: async (username) => {
    return await User.findOne({ username: username.toLowerCase() });
  },

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User or null
   */
  findByEmail: async (email) => {
    return await User.findOne({ email: email.toLowerCase() });
  },

  /**
   * Update user profile
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  updateProfile: async (id, updateData) => {
    // Remove password from update to prevent accidental password changes
    const { password, ...safeUpdateData } = updateData;
    
    return await User.findByIdAndUpdate(
      id, 
      safeUpdateData, 
      { new: true, runValidators: true }
    );
  },

  /**
   * Change user password
   * @param {string} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<Object|null>} Updated user or null
   */
  changePassword: async (id, newPassword) => {
    const user = await User.findById(id);
    if (!user) return null;

    user.password = newPassword;
    return await user.save();
  },

  /**
   * Verify user email
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} Updated user or null
   */
  verifyEmail: async (id) => {
    return await User.findByIdAndUpdate(
      id, 
      { isVerified: true }, 
      { new: true }
    );
  },

  /**
   * Authenticate user
   * @param {string} login - Username or email
   * @param {string} password - User password
   * @returns {Promise<Object|null>} Authenticated user or null
   */
  authenticate: async (login, password) => {
    // Try to find user by username or email
    const user = await User.findOne({
      $or: [
        { username: login.toLowerCase() },
        { email: login.toLowerCase() }
      ]
    });

    if (!user) return null;

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return null;

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return user;
  },

  /**
   * Delete a user
   * @param {string} id - User ID
   * @returns {Promise<void>}
   */
  deleteById: async (id) => {
    await User.findByIdAndDelete(id);
  },

  /**
   * Find users by multiple criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Array>} Array of matching users
   */
  findByCriteria: async (criteria) => {
    return await User.find(criteria);
  }
};

module.exports = {
    User,
    UserModel,
    UserSchema
}