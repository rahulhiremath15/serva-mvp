const fs = require('fs');
const path = require('path');

class ServiceUtils {
  constructor() {
    this.servicesFile = path.join(__dirname, '../data/services.json');
    this.pricingFile = path.join(__dirname, '../data/pricing.json');
    this.ensureDataFiles();
  }

  ensureDataFiles() {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(this.servicesFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Initialize services file if it doesn't exist
    if (!fs.existsSync(this.servicesFile)) {
      this.initializeServices();
    }

    // Initialize pricing file if it doesn't exist
    if (!fs.existsSync(this.pricingFile)) {
      this.initializePricing();
    }
  }

  initializeServices() {
    const services = {
      categories: [
        {
          id: 'electronics',
          name: 'Electronics & Appliances',
          icon: '🔌',
          description: 'Repair and maintenance for all electronic devices',
          subcategories: [
            {
              id: 'smartphones',
              name: 'Smartphones & Tablets',
              services: [
                {
                  id: 'screen-repair',
                  name: 'Screen Replacement',
                  description: 'Professional screen replacement with warranty',
                  duration: '30-45 minutes',
                  complexity: 'medium'
                },
                {
                  id: 'battery-replacement',
                  name: 'Battery Replacement',
                  description: 'Original battery replacement with 6-month warranty',
                  duration: '20-30 minutes',
                  complexity: 'easy'
                },
                {
                  id: 'water-damage',
                  name: 'Water Damage Repair',
                  description: 'Professional water damage treatment and repair',
                  duration: '2-3 hours',
                  complexity: 'hard'
                },
                {
                  id: 'software-issues',
                  name: 'Software Troubleshooting',
                  description: 'OS updates, app issues, performance optimization',
                  duration: '1-2 hours',
                  complexity: 'medium'
                },
                {
                  id: 'charging-port',
                  name: 'Charging Port Repair',
                  description: 'Charging port replacement and cleaning',
                  duration: '45-60 minutes',
                  complexity: 'medium'
                }
              ]
            },
            {
              id: 'laptops',
              name: 'Laptops & Computers',
              services: [
                {
                  id: 'laptop-screen-repair',
                  name: 'Screen Replacement',
                  description: 'LED/LCD screen replacement with warranty',
                  duration: '1-2 hours',
                  complexity: 'hard'
                },
                {
                  id: 'keyboard-replacement',
                  name: 'Keyboard Replacement',
                  description: 'Full keyboard replacement and cleaning',
                  duration: '45-60 minutes',
                  complexity: 'medium'
                },
                {
                  id: 'data-recovery',
                  name: 'Data Recovery',
                  description: 'Professional data recovery from damaged devices',
                  duration: '2-4 hours',
                  complexity: 'hard'
                },
                {
                  id: 'virus-removal',
                  name: 'Virus & Malware Removal',
                  description: 'Complete system cleaning and protection setup',
                  duration: '1-2 hours',
                  complexity: 'medium'
                },
                {
                  id: 'hardware-upgrade',
                  name: 'Hardware Upgrades',
                  description: 'RAM, SSD, graphics card upgrades',
                  duration: '1-3 hours',
                  complexity: 'medium'
                }
              ]
            }
          ]
        },
        {
          id: 'home-appliances',
          name: 'Home Appliances',
          icon: '🏠',
          description: 'Repair and installation for home appliances',
          subcategories: [
            {
              id: 'kitchen',
              name: 'Kitchen Appliances',
              services: [
                {
                  id: 'refrigerator-repair',
                  name: 'Refrigerator Repair',
                  description: 'Cooling issues, compressor repair, gas refilling',
                  duration: '2-4 hours',
                  complexity: 'hard'
                },
                {
                  id: 'washing-machine',
                  name: 'Washing Machine Repair',
                  description: 'Motor repair, drum issues, drainage problems',
                  duration: '1-3 hours',
                  complexity: 'medium'
                },
                {
                  id: 'microwave-repair',
                  name: 'Microwave Oven Repair',
                  description: 'Heating issues, turntable problems, control panel',
                  duration: '1-2 hours',
                  complexity: 'medium'
                },
                {
                  id: 'dishwasher-repair',
                  name: 'Dishwasher Repair',
                  description: 'Water leakage, drainage, cleaning issues',
                  duration: '1-2 hours',
                  complexity: 'medium'
                }
              ]
            },
            {
              id: 'ac-heating',
              name: 'AC & Heating',
              services: [
                {
                  id: 'ac-installation',
                  name: 'AC Installation',
                  description: 'Complete AC installation with gas filling',
                  duration: '3-4 hours',
                  complexity: 'hard'
                },
                {
                  id: 'ac-repair',
                  name: 'AC Repair & Service',
                  description: 'Cooling issues, gas refilling, cleaning',
                  duration: '1-2 hours',
                  complexity: 'medium'
                },
                {
                  id: 'heater-repair',
                  name: 'Water Heater Repair',
                  description: 'Heating element replacement, thermostat repair',
                  duration: '1-2 hours',
                  complexity: 'medium'
                }
              ]
            }
          ]
        },
        {
          id: 'home-services',
          name: 'Home Services',
          icon: '🏡',
          description: 'Professional home maintenance and repair services',
          subcategories: [
            {
              id: 'plumbing',
              name: 'Plumbing Services',
              services: [
                {
                  id: 'pipe-repair',
                  name: 'Pipe Repair & Installation',
                  description: 'Leak fixing, pipe installation, bathroom fittings',
                  duration: '1-3 hours',
                  complexity: 'medium'
                },
                {
                  id: 'drain-cleaning',
                  name: 'Drain Cleaning',
                  description: 'Complete drain cleaning and unclogging',
                  duration: '1-2 hours',
                  complexity: 'easy'
                },
                {
                  id: 'water-tank',
                  name: 'Water Tank Installation',
                  description: 'Water tank installation and plumbing setup',
                  duration: '2-3 hours',
                  complexity: 'medium'
                }
              ]
            },
            {
              id: 'electrical',
              name: 'Electrical Services',
              services: [
                {
                  id: 'wiring-repair',
                  name: 'Wiring & Panel Repair',
                  description: 'Complete electrical wiring and panel setup',
                  duration: '2-4 hours',
                  complexity: 'hard'
                },
                {
                  id: 'fan-installation',
                  name: 'Fan & Light Installation',
                  description: 'Ceiling fan, exhaust fan, light installation',
                  duration: '1-2 hours',
                  complexity: 'easy'
                },
                {
                  id: 'ups-inverter',
                  name: 'UPS & Inverter Setup',
                  description: 'UPS installation, inverter setup, battery connection',
                  duration: '2-3 hours',
                  complexity: 'medium'
                }
              ]
            }
          ]
        }
      ]
    };

    fs.writeFileSync(this.servicesFile, JSON.stringify(services, null, 2));
  }

  initializePricing() {
    const pricing = {
      baseCharges: {
        visitFee: 99,
        diagnosisFee: 149,
        emergencyFee: 299
      },
      services: {
        'screen-repair': {
          basePrice: 999,
          priceRange: '₹799-₹2,499',
          factors: {
            deviceType: {
              smartphone: { multiplier: 1.0 },
              tablet: { multiplier: 1.3 },
              laptop: { multiplier: 2.5 }
            },
            brand: {
              budget: { multiplier: 0.8 },
              midrange: { multiplier: 1.0 },
              premium: { multiplier: 1.5 }
            },
            warranty: {
              standard: { multiplier: 1.0 },
              extended: { multiplier: 1.2 }
            }
          }
        },
        'battery-replacement': {
          basePrice: 599,
          priceRange: '₹399-₹1,999',
          factors: {
            deviceType: {
              smartphone: { multiplier: 1.0 },
              tablet: { multiplier: 1.4 },
              laptop: { multiplier: 2.0 }
            },
            brand: {
              budget: { multiplier: 0.7 },
              midrange: { multiplier: 1.0 },
              premium: { multiplier: 1.6 }
            },
            batteryType: {
              standard: { multiplier: 1.0 },
              fastCharging: { multiplier: 1.3 },
              extended: { multiplier: 1.5 }
            }
          }
        },
        'water-damage': {
          basePrice: 1499,
          priceRange: '₹999-₹4,999',
          factors: {
            severity: {
              minor: { multiplier: 0.6 },
              moderate: { multiplier: 1.0 },
              severe: { multiplier: 1.8 }
            },
            deviceType: {
              smartphone: { multiplier: 1.0 },
              tablet: { multiplier: 1.2 },
              laptop: { multiplier: 1.8 }
            }
          }
        },
        'laptop-screen-repair': {
          basePrice: 2499,
          priceRange: '₹1,999-₹8,999',
          factors: {
            screenSize: {
              '13-14': { multiplier: 0.8 },
              '15-16': { multiplier: 1.0 },
              '17+': { multiplier: 1.4 }
            },
            screenType: {
              standard: { multiplier: 1.0 },
              touch: { multiplier: 1.3 },
              retina: { multiplier: 1.6 }
            },
            brand: {
              budget: { multiplier: 0.7 },
              midrange: { multiplier: 1.0 },
              premium: { multiplier: 1.8 }
            }
          }
        },
        'refrigerator-repair': {
          basePrice: 899,
          priceRange: '₹599-₹2,499',
          factors: {
            capacity: {
              '150-250L': { multiplier: 0.8 },
              '250-400L': { multiplier: 1.0 },
              '400L+': { multiplier: 1.3 }
            },
            issueType: {
              cooling: { multiplier: 1.2 },
              compressor: { multiplier: 1.8 },
              general: { multiplier: 1.0 }
            }
          }
        },
        'ac-installation': {
          basePrice: 1999,
          priceRange: '₹1,499-₹4,999',
          factors: {
            capacity: {
              '1-1.5T': { multiplier: 0.8 },
              '2T': { multiplier: 1.0 },
              '2.5T+': { multiplier: 1.3 }
            },
            type: {
              split: { multiplier: 1.0 },
              window: { multiplier: 0.7 },
              portable: { multiplier: 0.9 }
            },
            location: {
              ground: { multiplier: 1.0 },
              first: { multiplier: 1.2 },
              higher: { multiplier: 1.5 }
            }
          }
        }
      },
      additionalCharges: {
        emergencyService: 299,
        weekendService: 199,
        partsCost: 'Actual cost + 20% handling',
        warrantyExtension: 299,
        sameDayService: 499
      }
    };

    fs.writeFileSync(this.pricingFile, JSON.stringify(pricing, null, 2));
  }

  readServices() {
    try {
      return JSON.parse(fs.readFileSync(this.servicesFile, 'utf8'));
    } catch (error) {
      console.error('Error reading services:', error);
      return { categories: [] };
    }
  }

  readPricing() {
    try {
      return JSON.parse(fs.readFileSync(this.pricingFile, 'utf8'));
    } catch (error) {
      console.error('Error reading pricing:', error);
      return { services: {}, baseCharges: {}, additionalCharges: {} };
    }
  }

  getAllServices() {
    return this.readServices();
  }

  getServicesByCategory(categoryId) {
    const services = this.readServices();
    const category = services.categories.find(cat => cat.id === categoryId);
    return category ? category.subcategories : [];
  }

  getServiceById(categoryId, subcategoryId, serviceId) {
    const services = this.readServices();
    const category = services.categories.find(cat => cat.id === categoryId);
    if (!category) return null;

    const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
    if (!subcategory) return null;

    return subcategory.services.find(service => service.id === serviceId);
  }

  getServicePricing(categoryId, serviceId) {
    const pricing = this.readPricing();
    const servicePricing = pricing.services[serviceId];
    
    if (!servicePricing) return null;

    return {
      ...servicePricing,
      baseCharges: pricing.baseCharges,
      additionalCharges: pricing.additionalCharges
    };
  }

  calculatePrice(serviceId, factors = {}) {
    const pricing = this.readPricing();
    const servicePricing = pricing.services[serviceId];
    
    if (!servicePricing) return null;

    let finalPrice = servicePricing.basePrice;

    // Apply factor multipliers
    if (servicePricing.factors) {
      Object.keys(factors).forEach(factorType => {
        const factorValue = factors[factorType];
        if (servicePricing.factors[factorType] && servicePricing.factors[factorType][factorValue]) {
          finalPrice *= servicePricing.factors[factorType][factorValue].multiplier;
        }
      });
    }

    return {
      basePrice: servicePricing.basePrice,
      finalPrice: Math.round(finalPrice),
      priceRange: servicePricing.priceRange,
      factors: factors
    };
  }
}

const serviceUtils = new ServiceUtils();

module.exports = { serviceUtils, ServiceUtils };
