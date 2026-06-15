const { body, validationResult } = require('express-validator');

// Error formatter middleware
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validateResult
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateResult
];

const validateFootprint = [
  body('activityType')
    .trim()
    .notEmpty()
    .withMessage('Activity type is required')
    .isIn(['utility', 'transportation', 'consumption'])
    .withMessage('Activity type must be utility, transportation, or consumption'),
  
  body('parameters')
    .notEmpty()
    .withMessage('Parameters are required')
    .isObject()
    .withMessage('Parameters must be an object'),

  // Conditional validation based on activityType
  body('parameters.kwh')
    .if(body('activityType').equals('utility'))
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('kwh must be a number')
    .custom(value => value >= 0)
    .withMessage('kwh cannot be negative'),

  body('parameters.gasTherms')
    .if(body('activityType').equals('utility'))
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('gasTherms must be a number')
    .custom(value => value >= 0)
    .withMessage('gasTherms cannot be negative'),

  body('parameters.miles')
    .if(body('activityType').equals('transportation'))
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('miles must be a number')
    .custom(value => value >= 0)
    .withMessage('miles cannot be negative'),

  body('parameters.flightMiles')
    .if(body('activityType').equals('transportation'))
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('flightMiles must be a number')
    .custom(value => value >= 0)
    .withMessage('flightMiles cannot be negative'),

  body('parameters.meatServings')
    .if(body('activityType').equals('consumption'))
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('meatServings must be a number')
    .custom(value => value >= 0)
    .withMessage('meatServings cannot be negative'),

  body('parameters.wasteKg')
    .if(body('activityType').equals('consumption'))
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage('wasteKg must be a number')
    .custom(value => value >= 0)
    .withMessage('wasteKg cannot be negative'),
  
  validateResult
];

module.exports = {
  validateRegister,
  validateLogin,
  validateFootprint
};
