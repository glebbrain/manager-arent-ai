const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/user-management.log' })
  ]
});

class UserManagementService {
  constructor() {
    this.users = new Map(); // In-memory storage
    this.userSessions = new Map(); // Active sessions
    this.userOrganizations = new Map(); // User-organization mappings
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  async createUser(userData) {
    try {
      const userId = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = {
        id: userId,
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || 'user',
        status: 'active',
        emailVerified: false,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          timezone: userData.timezone || 'UTC',
          language: userData.language || 'en',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          theme: 'light'
        },
        security: {
          mfaEnabled: false,
          mfaSecret: null,
          lastPasswordChange: new Date().toISOString(),
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      };

      this.users.set(userId, user);
      logger.info('User created successfully', { userId, email: user.email });
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Object|null} User object or null
   */
  async getUser(userId) {
    try {
      return this.users.get(userId) || null;
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Object|null} User object or null
   */
  async getUserByEmail(email) {
    try {
      for (const [userId, user] of this.users) {
        if (user.email === email) {
          return user;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated user
   */
  async updateUser(userId, updateData) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash password if provided
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
        updateData.security = {
          ...user.security,
          lastPasswordChange: new Date().toISOString()
        };
      }

      const updatedUser = {
        ...user,
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      this.users.set(userId, updatedUser);
      logger.info('User updated successfully', { userId });
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async deleteUser(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete - mark as inactive
      user.status = 'inactive';
      user.deletedAt = new Date().toISOString();
      
      this.users.set(userId, user);
      logger.info('User deleted (soft delete)', { userId });
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Object|null} User object or null
   */
  async authenticateUser(email, password) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }

      // Check if account is locked
      if (user.security.lockedUntil && new Date() < new Date(user.security.lockedUntil)) {
        throw new Error('Account is temporarily locked due to too many failed login attempts');
      }

      // Check if account is active
      if (user.status !== 'active') {
        throw new Error('Account is not active');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        // Increment failed login attempts
        await this.incrementFailedLoginAttempts(user.id);
        return null;
      }

      // Reset failed login attempts on successful login
      await this.resetFailedLoginAttempts(user.id);

      // Update last login
      await this.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

      logger.info('User authenticated successfully', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Increment failed login attempts
   * @param {string} userId - User ID
   */
  async incrementFailedLoginAttempts(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) return;

      const failedAttempts = user.security.failedLoginAttempts + 1;
      const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null; // Lock for 30 minutes

      await this.updateUser(userId, {
        security: {
          ...user.security,
          failedLoginAttempts: failedAttempts,
          lockedUntil: lockedUntil
        }
      });
    } catch (error) {
      logger.error('Error incrementing failed login attempts:', error);
    }
  }

  /**
   * Reset failed login attempts
   * @param {string} userId - User ID
   */
  async resetFailedLoginAttempts(userId) {
    try {
      const user = await this.getUser(userId);
      if (!user) return;

      await this.updateUser(userId, {
        security: {
          ...user.security,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
    } catch (error) {
      logger.error('Error resetting failed login attempts:', error);
    }
  }

  /**
   * Create user session
   * @param {string} userId - User ID
   * @param {Object} sessionData - Session data
   * @returns {Object} Session object
   */
  async createSession(userId, sessionData = {}) {
    try {
      const sessionId = uuidv4();
      const session = {
        id: sessionId,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent,
        isActive: true
      };

      this.userSessions.set(sessionId, session);
      logger.info('User session created', { sessionId, userId });
      return session;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get user session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session object or null
   */
  async getSession(sessionId) {
    try {
      const session = this.userSessions.get(sessionId);
      
      if (!session || !session.isActive) {
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.invalidateSession(sessionId);
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Error getting session:', error);
      return null;
    }
  }

  /**
   * Invalidate user session
   * @param {string} sessionId - Session ID
   * @returns {boolean} Success status
   */
  async invalidateSession(sessionId) {
    try {
      const session = this.userSessions.get(sessionId);
      if (session) {
        session.isActive = false;
        session.invalidatedAt = new Date().toISOString();
        this.userSessions.set(sessionId, session);
      }
      logger.info('Session invalidated', { sessionId });
      return true;
    } catch (error) {
      logger.error('Error invalidating session:', error);
      return false;
    }
  }

  /**
   * Invalidate all user sessions
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  async invalidateAllUserSessions(userId) {
    try {
      for (const [sessionId, session] of this.userSessions) {
        if (session.userId === userId && session.isActive) {
          await this.invalidateSession(sessionId);
        }
      }
      logger.info('All user sessions invalidated', { userId });
      return true;
    } catch (error) {
      logger.error('Error invalidating all user sessions:', error);
      return false;
    }
  }

  /**
   * List users with filters
   * @param {Object} filters - Filter options
   * @returns {Object} Paginated list of users
   */
  async listUsers(filters = {}) {
    try {
      let users = Array.from(this.users.values());

      // Apply filters
      if (filters.status) {
        users = users.filter(user => user.status === filters.status);
      }
      if (filters.role) {
        users = users.filter(user => user.role === filters.role);
      }
      if (filters.emailVerified !== undefined) {
        users = users.filter(user => user.emailVerified === filters.emailVerified);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        users: users.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: users.length,
          pages: Math.ceil(users.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error listing users:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Object} User statistics
   */
  async getUserStats() {
    try {
      const users = Array.from(this.users.values());
      const activeUsers = users.filter(user => user.status === 'active');
      const verifiedUsers = users.filter(user => user.emailVerified);
      const adminUsers = users.filter(user => user.role === 'admin');

      return {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        verifiedUsers: verifiedUsers.length,
        adminUsers: adminUsers.length,
        inactiveUsers: users.length - activeUsers.length
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await this.updateUser(userId, { password: newPassword });

      // Invalidate all sessions for security
      await this.invalidateAllUserSessions(userId);

      logger.info('Password changed successfully', { userId });
      return true;
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Reset user password
   * @param {string} email - User email
   * @returns {Object} Password reset token
   */
  async resetPassword(email) {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token (in real implementation, this would be stored in database)
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires.toISOString();
      
      await this.updateUser(user.id, user);

      logger.info('Password reset token generated', { userId: user.id, email });
      return {
        resetToken,
        expiresAt: resetExpires.toISOString()
      };
    } catch (error) {
      logger.error('Error resetting password:', error);
      throw error;
    }
  }

  /**
   * Verify password reset token
   * @param {string} token - Reset token
   * @returns {Object|null} User object or null
   */
  async verifyPasswordResetToken(token) {
    try {
      for (const [userId, user] of this.users) {
        if (user.passwordResetToken === token && 
            user.passwordResetExpires && 
            new Date() < new Date(user.passwordResetExpires)) {
          return user;
        }
      }
      return null;
    } catch (error) {
      logger.error('Error verifying password reset token:', error);
      return null;
    }
  }

  /**
   * Set new password with reset token
   * @param {string} token - Reset token
   * @param {string} newPassword - New password
   * @returns {boolean} Success status
   */
  async setPasswordWithToken(token, newPassword) {
    try {
      const user = await this.verifyPasswordResetToken(token);
      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      // Update password and clear reset token
      await this.updateUser(user.id, {
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      });

      // Invalidate all sessions for security
      await this.invalidateAllUserSessions(user.id);

      logger.info('Password set with reset token', { userId: user.id });
      return true;
    } catch (error) {
      logger.error('Error setting password with token:', error);
      throw error;
    }
  }
}

module.exports = new UserManagementService();
