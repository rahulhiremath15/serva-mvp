const fs = require('fs');
const path = require('path');
const validator = require('validator');

const USERS_FILE = path.join(__dirname, 'users.json');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Helper functions for user data management
const userUtils = {
  // Read users from file
  readUsers() {
    try {
      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  },

  // Write users to file
  writeUsers(users) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing users:', error);
      return false;
    }
  },

  // Find user by email
  findUserByEmail(email) {
    const users = this.readUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  // Find user by ID
  findUserById(userId) {
    const users = this.readUsers();
    return users.find(user => user.id === userId);
  },

  // Create new user
  createUser(userData) {
    try {
      if (!userData || typeof userData !== 'object') {
        return { success: false, message: 'Invalid user data provided' };
      }

      const users = this.readUsers();
      
      // Check if user already exists
      if (this.findUserByEmail(userData.email)) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Validate user data
      const validation = this.validateUserData(userData);
      if (!validation.isValid) {
        return { success: false, message: 'Validation failed', errors: validation.errors };
      }

      const newUser = {
        id: this.generateUserId(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password, // Should be hashed
        firstName: userData.firstName?.trim() || '',
        lastName: userData.lastName?.trim() || '',
        phone: userData.phone?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        role: userData.role || 'user'
      };

      users.push(newUser);
      
      if (this.writeUsers(users)) {
        return { success: true, user: { ...newUser, password: undefined } };
      } else {
        return { success: false, message: 'Failed to save user data' };
      }
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, message: 'Internal error while creating user' };
    }
  },

  // Update user
  updateUser(userId, updateData) {
    const users = this.readUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      return { success: false, message: 'User not found' };
    }

    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    if (this.writeUsers(users)) {
      return { success: true, user: { ...users[userIndex], password: undefined } };
    } else {
      return { success: false, message: 'Failed to update user' };
    }
  },

  // Generate unique user ID
  generateUserId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `USR${timestamp}${random}`.toUpperCase();
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
  // Read bookings from file
  readBookings() {
    try {
      if (fs.existsSync(BOOKINGS_FILE)) {
        const data = fs.readFileSync(BOOKINGS_FILE, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Error reading bookings:', error);
      return [];
    }
  },

  // Write bookings to file
  writeBookings(bookings) {
    try {
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing bookings:', error);
      return false;
    }
  },

  // Get bookings by user ID
  getBookingsByUserId(userId) {
    const bookings = this.readBookings();
    return bookings.filter(booking => booking.userId === userId);
  },

  // Create booking with user association
  createBooking(bookingData, userId) {
    try {
      console.log('createBooking called with:', { bookingData, userId });
      
      if (!bookingData || typeof bookingData !== 'object') {
        console.log('Invalid booking data provided');
        return { success: false, message: 'Invalid booking data provided' };
      }

      if (!userId || typeof userId !== 'string') {
        console.log('Invalid user ID:', userId);
        return { success: false, message: 'Valid user ID is required' };
      }

      // Verify user exists
      console.log('Looking for user with ID:', userId);
      const user = this.findUserById(userId);
      console.log('User found:', !!user);
      
      if (!user) {
        console.log('User not found for ID:', userId);
        return { success: false, message: 'User not found' };
      }

      console.log('User data:', { id: user.id, email: user.email, isActive: user.isActive });

      if (!user.isActive) {
        console.log('User account is not active');
        return { success: false, message: 'User account is not active' };
      }

      console.log('Reading existing bookings...');
      const bookings = this.readBookings();
      console.log('Current bookings count:', bookings.length);
      
      const newBooking = {
        bookingId: this.generateBookingId(),
        userId,
        deviceType: bookingData.deviceType?.trim() || '',
        issue: bookingData.issue?.trim() || '',
        customIssueDescription: bookingData.issue === 'other' ? (bookingData.customIssueDescription?.trim() || '') : undefined,
        preferredTime: bookingData.preferredTime?.trim() || '',
        address: bookingData.address?.trim() || '',
        photo: bookingData.photo || null,
        createdAt: new Date().toISOString(),
        status: 'pending',
        warrantyToken: this.generateWarrantyToken(),
        warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        technician: 'John Smith',
        cost: Math.floor(Math.random() * 200) + 50,
        deviceModel: `${bookingData.deviceType || 'unknown'} Model`
      };

      console.log('New booking created:', newBooking);

      // Validate required fields
      if (!newBooking.deviceType || !newBooking.issue || !newBooking.preferredTime || !newBooking.address) {
        console.log('Missing required fields:', {
          deviceType: !newBooking.deviceType,
          issue: !newBooking.issue,
          preferredTime: !newBooking.preferredTime,
          address: !newBooking.address
        });
        return { success: false, message: 'Missing required booking fields' };
      }

      console.log('Adding booking to array...');
      bookings.push(newBooking);
      
      console.log('Writing bookings to file...');
      if (this.writeBookings(bookings)) {
        console.log('Booking saved successfully');
        return { success: true, booking: newBooking };
      } else {
        console.log('Failed to save booking data');
        return { success: false, message: 'Failed to save booking data' };
      }
    } catch (error) {
      console.error('Error in createBooking:', error);
      return { success: false, message: 'Internal error while creating booking' };
    }
  },

  // Generate unique booking ID
  generateBookingId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `BK${timestamp}${random}`.toUpperCase();
  },

  // Generate warranty token
  generateWarrantyToken() {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(Date.now().toString() + Math.random().toString());
    return hash.digest('hex').toUpperCase();
  }
};

module.exports = {
  userUtils,
  bookingUtils
};
