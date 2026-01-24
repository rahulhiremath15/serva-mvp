const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { serviceUtils } = require('../utils/serviceManager');

const router = express.Router();

// GET /api/services - Get all service categories
router.get('/', (req, res) => {
  try {
    const services = serviceUtils.getAllServices();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
});

// GET /api/services/:category - Get services by category
router.get('/:category', (req, res) => {
  try {
    const { category } = req.params;
    const services = serviceUtils.getServicesByCategory(category);
    
    if (!services || services.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No services found for this category'
      });
    }

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching category services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category services'
    });
  }
});

// GET /api/services/:category/:serviceId/pricing - Get pricing for specific service
router.get('/:category/:serviceId/pricing', (req, res) => {
  try {
    const { category, serviceId } = req.params;
    const pricing = serviceUtils.getServicePricing(category, serviceId);
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'Pricing not found for this service'
      });
    }

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error fetching service pricing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service pricing'
    });
  }
});

module.exports = router;
