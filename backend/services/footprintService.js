const footprintRepository = require('../repositories/footprintRepository');
const { calculateEmissions } = require('./estimationEngine');

const analyticsCache = new Map();

class FootprintService {
  /**
   * Log an activity and calculate its carbon footprint
   * @param {string} userId 
   * @param {string} activityType 
   * @param {Object} parameters 
   * @param {Date} [date] 
   * @returns {Promise<Object>}
   */
  async logFootprint(userId, activityType, parameters, date) {
    // Calculate emissions via the estimation engine
    const emissions = calculateEmissions(activityType, parameters);

    const footprintData = {
      userId,
      activityType,
      parameters,
      carbonEmissionsKg: emissions,
    };

    if (date) {
      footprintData.date = new Date(date);
    }

    const created = await footprintRepository.create(footprintData);
    
    // Invalidate analytics cache for the user
    if (userId) {
      analyticsCache.delete(userId.toString());
    }

    return created;
  }

  /**
   * Get user footprint history
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async getUserFootprints(userId) {
    return await footprintRepository.findByUserId(userId);
  }

  /**
   * Get total and categorical breakdown of emissions for a user
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async getUserAnalytics(userId) {
    const cacheKey = userId ? userId.toString() : '';
    if (cacheKey && analyticsCache.has(cacheKey)) {
      return analyticsCache.get(cacheKey);
    }

    const rawAggregates = await footprintRepository.getAggregateEmissions(userId);
    
    const breakdown = {
      utility: 0,
      transportation: 0,
      consumption: 0,
    };

    let totalEmissions = 0;

    rawAggregates.forEach(item => {
      if (breakdown.hasOwnProperty(item._id)) {
        breakdown[item._id] = parseFloat(item.totalEmissions.toFixed(3));
        totalEmissions += item.totalEmissions;
      }
    });

    const result = {
      totalEmissions: parseFloat(totalEmissions.toFixed(3)),
      breakdown,
      raw: rawAggregates,
    };

    if (cacheKey) {
      analyticsCache.set(cacheKey, result);
    }
    return result;
  }

  /**
   * Delete a footprint log
   * @param {string} id 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async deleteFootprint(id, userId) {
    const deleted = await footprintRepository.deleteById(id, userId);
    if (!deleted) {
      throw new Error('Footprint log not found or unauthorized');
    }
    
    // Invalidate analytics cache for the user
    if (userId) {
      analyticsCache.delete(userId.toString());
    }

    return deleted;
  }
}

module.exports = new FootprintService();
