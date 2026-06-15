/**
 * Carbon Footprint Estimation Engine
 * Calculates CO2 emissions in kilograms based on activity parameters.
 */

const FACTORS = {
  // Utility factors
  ELECTRICITY_KG_PER_KWH: 0.385,
  GAS_KG_PER_THERM: 5.3,

  // Transportation factors
  VEHICLE_KG_PER_MILE: 0.404,
  FLIGHT_KG_PER_MILE: 0.25,

  // Consumption factors
  MEAT_KG_PER_SERVING: 2.5,
  WASTE_KG_PER_KG: 0.5,
};

/**
 * Calculates carbon footprint emissions in kg.
 * @param {string} activityType - 'utility' | 'transportation' | 'consumption'
 * @param {object} parameters - Input values for factors
 * @returns {number} calculated emissions in kg CO2
 */
const calculateEmissions = (activityType, parameters) => {
  if (!activityType) {
    throw new Error('Activity type is required');
  }

  if (!parameters || typeof parameters !== 'object') {
    throw new Error('Parameters must be a valid object');
  }

  let emissions = 0;

  switch (activityType) {
    case 'utility': {
      const kwh = Number(parameters.kwh) || 0;
      const gasTherms = Number(parameters.gasTherms) || 0;

      if (kwh < 0 || gasTherms < 0) {
        throw new Error('Utility parameters must be non-negative numbers');
      }

      emissions = (kwh * FACTORS.ELECTRICITY_KG_PER_KWH) + (gasTherms * FACTORS.GAS_KG_PER_THERM);
      break;
    }

    case 'transportation': {
      const miles = Number(parameters.miles) || 0;
      const flightMiles = Number(parameters.flightMiles) || 0;

      if (miles < 0 || flightMiles < 0) {
        throw new Error('Transportation parameters must be non-negative numbers');
      }

      emissions = (miles * FACTORS.VEHICLE_KG_PER_MILE) + (flightMiles * FACTORS.FLIGHT_KG_PER_MILE);
      break;
    }

    case 'consumption': {
      const meatServings = Number(parameters.meatServings) || 0;
      const wasteKg = Number(parameters.wasteKg) || 0;

      if (meatServings < 0 || wasteKg < 0) {
        throw new Error('Consumption parameters must be non-negative numbers');
      }

      emissions = (meatServings * FACTORS.MEAT_KG_PER_SERVING) + (wasteKg * FACTORS.WASTE_KG_PER_KG);
      break;
    }

    default:
      throw new Error(`Unsupported activity type: ${activityType}`);
  }

  // Return formatted float with 3 decimal precision
  return parseFloat(emissions.toFixed(3));
};

module.exports = {
  FACTORS,
  calculateEmissions,
};
