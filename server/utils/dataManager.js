const validator = require('validator');
const User = require('../models/User');
const Booking = require('../models/Booking');

// Helper functions for user data management
const userUtils = {
  // Create new user
  async createUser(userData) {
    try {
      if (!userData || typeof userData !== 'object') {
        return { success: false, message: 'Invalid user data provided' };
      }

      // Validate user data
      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        return { success: false, message: 'Validation failed', errors: validation.errors };
      }

      const newUser = await User.create({
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password, // Should be hashed
        phone: userData.phone ? userData.phone.trim() : ''
      });

      return { success: true, user: newUser.toObject() };
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === 11000) {
        return { success: false, message: 'User already exists with this email' };
      }
      return { success: false, message: 'Failed to create user' };
    }
  },

  // Find user by email
  async findUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  // Find user by ID
  async findUserById(userId) {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  // Update user
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },

  // Validate user data
  validateUserData(userData) {
    const errors = [];

    if (!userData.email || !validator.isEmail(userData.email)) {
      errors.push('Valid email is required');
    }

    if (!userData.password || userData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!userData.firstName || userData.firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (!userData.lastName || userData.lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (userData.phone && !validator.isMobilePhone(userData.phone)) {
      errors.push('Valid phone number is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Helper functions for booking data management
const bookingUtils = {
  // Find user by ID (needed for booking validation)
  async findUserById(userId) {
    try {
      const user = await User.findById(userId);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  // Create booking with user association
  async createBooking(bookingData, userId) {
    try {
      console.log('createBooking called with:', { bookingData, userId });
      
      // Defensive checks
      if (!userId) {
        throw new Error('User ID is required for booking');
      }

      if (!bookingData || typeof bookingData !== 'object') {
        console.log('Invalid booking data provided');
        return { success: false, message: 'Invalid booking data provided' };
      }

      // Verify user exists
      console.log('Looking for user with ID:', userId);
      const user = await this.findUserById(userId);
      console.log('User found:', !!user);
      
      if (!user) {
        console.log('User not found for ID:', userId);
        return { success: false, message: 'User not found' };
      }

      console.log('User data:', { id: user._id, email: user.email, isActive: user.isActive });

      if (!user.isActive) {
        console.log('User account is not active');
        return { success: false, message: 'User account is not active' };
      }

      console.log('Creating booking...');
      
      // Construct booking object safely
      const newBooking = await Booking.create({
        user: userId,
        deviceType: (bookingData.deviceType || '').trim(),
        issue: (bookingData.issue || '').trim(),
        customIssueDescription: bookingData.issue === 'other' ? (bookingData.customIssueDescription || '').trim() : undefined,
        preferredTime: (bookingData.preferredTime || '').trim(),
        address: (bookingData.address || '').trim(),
        photo: bookingData.photo || null,
        technician: 'John Smith',
        cost: Math.floor(Math.random() * 200) + 50,
        deviceModel: `${bookingData.deviceType || 'unknown'} Model`
      });

      console.log('Booking created successfully:', newBooking);
      return { success: true, booking: newBooking.toObject() };
    } catch (error) {
      console.error('Error in createBooking:', error);
      return { success: false, message: error.message || 'Internal error while creating booking' };
    }
  },

  // Get bookings by user ID
  async getBookingsByUserId(userId) {
    try {
      const bookings = await Booking.find({ user: userId })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });
      
      return bookings.map(booking => booking.toObject());
    } catch (error) {
      console.error('Error retrieving bookings:', error);
      return [];
    }
  },

  // Read all bookings (for admin purposes)
  async readBookings() {
    try {
      const bookings = await Booking.find()
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });
      
      return bookings.map(booking => booking.toObject());
    } catch (error) {
      console.error('Error reading bookings:', error);
      return [];
    }
  },

  // Write bookings (not needed for MongoDB but keeping for compatibility)
  async writeBookings(bookings) {
    // This method is not needed for MongoDB
    return true;
  }
};

module.exports = {
  userUtils,
  bookingUtils
};
