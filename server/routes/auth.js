const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { userUtils } = require('../utils/dataManager');
const { generateToken, rateLimit } = require('../middleware/auth');

const router = express.Router();

// Validation middleware for registration
const validateRegistrationInput = (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
  const errors = [];

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Password strength validation (only for registration)
  if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  // Name validation
  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters long');
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters long');
  }

  // Phone validation (optional)
  if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
    errors.push('Phone number is invalid');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validation middleware for login (simpler validation)
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  // Password validation (just check it's not empty for login)
  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// POST /api/auth/register - User registration
router.post('/register', rateLimit(5, 15 * 60 * 1000), validateRegistrationInput, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    console.log('Registration request received:', { email, firstName, lastName, phone: phone || 'none' });

    // Check if user already exists
    const existingUser = userUtils.findUserByEmail(email);
    console.log('Existing user check:', !!existingUser);
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create user
    const result = userUtils.createUser({
      email,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : ''
    });
    
    console.log('User creation result:', result);

    if (!result.success) {
      console.error('User creation failed:', result.message);
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to create user'
      });
    }

    // Generate token
    const token = generateToken(result.user);
    console.log('Token generated successfully');

    // Return success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', rateLimit(10, 15 * 60 * 1000), validateLoginInput, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Find user by email
    const user = userUtils.findUserByEmail(email);
    console.log('User found:', !!user, 'Email searched:', email);
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('User found:', user.id, 'Active:', user.isActive);

    // Check if user is active
    if (!user.isActive) {
      console.log('User account deactivated:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', user.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Login successful for user:', user.id);

    // Generate token
    const token = generateToken(user);

    // Update last login
    userUtils.updateUser(user.id, { lastLoginAt: new Date().toISOString() });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// POST /api/auth/logout - User logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, (req, res) => {
  // The middleware will add req.user
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        role: req.user.role,
        createdAt: req.user.createdAt
      }
    }
  });
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const errors = [];

    if (firstName && firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (lastName && lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (phone && !validator.isMobilePhone(phone)) {
      errors.push('Valid phone number is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();

    const result = userUtils.updateUser(userId, updateData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to update profile'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: result.user
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const errors = [];

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword || newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long');
    }

    if (newPassword && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Get current user
    const user = userUtils.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = userUtils.updateUser(userId, { password: hashedNewPassword });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    });
  }
});

module.exports = router;
