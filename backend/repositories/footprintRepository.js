const mongoose = require('mongoose');
const Footprint = require('../models/Footprint');

class FootprintRepository {
  /**
   * Create a new footprint record
   * @param {Object} footprintData 
   * @returns {Promise<Object>}
   */
  async create(footprintData) {
    const footprint = new Footprint(footprintData);
    return await footprint.save();
  }

  /**
   * Find footprints by user ID sorted by date descending
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    return await Footprint.find({ userId }).sort({ date: -1 }).lean();
  }

  /**
   * Aggregate emissions by activityType for a user
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async getAggregateEmissions(userId) {
    return await Footprint.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$activityType',
          totalEmissions: { $sum: '$carbonEmissionsKg' },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  /**
   * Delete a footprint record by ID and user ID (security check)
   * @param {string} id 
   * @param {string} userId 
   * @returns {Promise<Object>}
   */
  async deleteById(id, userId) {
    return await Footprint.findOneAndDelete({ _id: id, userId });
  }
}

module.exports = new FootprintRepository();
