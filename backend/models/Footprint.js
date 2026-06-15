const mongoose = require('mongoose');

const FootprintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  date: {
    type: Date,
    default: Date.now,
    index: true,
  },
  activityType: {
    type: String,
    enum: ['utility', 'transportation', 'consumption'],
    required: true,
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  carbonEmissionsKg: {
    type: Number,
    required: true,
    index: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Footprint', FootprintSchema);
