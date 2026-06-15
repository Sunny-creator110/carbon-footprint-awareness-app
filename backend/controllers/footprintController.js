const footprintService = require('../services/footprintService');

/**
 * @desc    Log a new activity and calculate carbon footprint
 * @route   POST /api/footprint
 * @access  Private
 */
const logActivity = async (req, res) => {
  const { activityType, parameters, date } = req.body;

  try {
    const footprint = await footprintService.logFootprint(
      req.user.id,
      activityType,
      parameters,
      date
    );

    res.status(201).json({
      success: true,
      data: footprint,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user footprint log history
 * @route   GET /api/footprint
 * @access  Private
 */
const getHistory = async (req, res) => {
  try {
    const footprints = await footprintService.getUserFootprints(req.user.id);
    res.status(200).json({
      success: true,
      count: footprints ? footprints.length : 0,
      data: footprints || [],
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: 'Safely caught database query error: ' + error.message,
    });
  }
};

/**
 * @desc    Get user emissions analytics and category breakdown
 * @route   GET /api/footprint/analytics
 * @access  Private
 */
const getAnalytics = async (req, res) => {
  try {
    const analytics = await footprintService.getUserAnalytics(req.user.id);
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: {
        totalEmissions: 0,
        breakdown: { utility: 0, transportation: 0, consumption: 0 }
      },
      message: 'Safely caught database query error: ' + error.message,
    });
  }
};

/**
 * @desc    Delete a footprint entry
 * @route   DELETE /api/footprint/:id
 * @access  Private
 */
const deleteLog = async (req, res) => {
  try {
    await footprintService.deleteFootprint(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Footprint entry successfully removed',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  logActivity,
  getHistory,
  getAnalytics,
  deleteLog,
};
