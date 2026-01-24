const fs = require('fs');
const path = require('path');

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
    const users = this.readUsers();
    
    // Check if user already exists
    if (this.findUserByEmail(userData.email)) {
      return { success: false, message: 'User already exists with this email' };
    }

    const newUser = {
      id: this.generateUserId(),
      email: userData.email.toLowerCase(),
      password: userData.password, // Should be hashed
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      role: 'user'
    };

    users.push(newUser);
    
    if (this.writeUsers(users)) {
      return { success: true, user: { ...newUser, password: undefined } };
    } else {
      return { success: false, message: 'Failed to create user' };
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
    const bookings = this.readBookings();
    
    const newBooking = {
      bookingId: this.generateBookingId(),
      userId,
      deviceType: bookingData.deviceType,
      issue: bookingData.issue,
      customIssueDescription: bookingData.issue === 'other' ? bookingData.customIssueDescription : undefined,
      preferredTime: bookingData.preferredTime,
      address: bookingData.address,
      photo: bookingData.photo || null,
      createdAt: new Date().toISOString(),
      status: 'pending',
      warrantyToken: this.generateWarrantyToken(),
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      technician: 'John Smith',
      cost: Math.floor(Math.random() * 200) + 50,
      deviceModel: `${bookingData.deviceType} Model`
    };

    bookings.push(newBooking);
    
    if (this.writeBookings(bookings)) {
      return { success: true, booking: newBooking };
    } else {
      return { success: false, message: 'Failed to create booking' };
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
