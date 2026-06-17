const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Enable Gzip Compression for network efficiency
app.use(compression());

// Secure HTTP response headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://img.shields.io"],
      connectSrc: ["'self'", "*"]
    }
  }
}));

// Prevent NoSQL Injection attacks
app.use(mongoSanitize());

// Restrict CORS to secure endpoints
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ecotrace-carbon-app.onrender.com'] 
    : true,
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiting configurations (scaled up during tests to prevent flakes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: process.env.NODE_ENV === 'test' ? 10000 : 15,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limits
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/footprint', require('./routes/footprint'));

// Serve Frontend Static Files in Production
const frontendCandidates = [
  path.join(__dirname, '../frontend/dist'), // repo layout (backend/ & frontend/ siblings)
  path.join(__dirname, 'frontend', 'dist'), // when built into image at /usr/src/app/frontend/dist
];
let frontendBuildPath = frontendCandidates.find(p => fs.existsSync(path.join(p, 'index.html')));
if (frontendBuildPath) {
  app.use(express.static(frontendBuildPath));

  // Catch-all route for SPA routing in React
  app.get('*', (req, res, next) => {
    // If request is for an API path, pass it to 404 handler
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  console.warn('Frontend build not found. Static assets will not be served by the API.');
}

// 404 Route handler for APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect database and start server (except if in test mode)
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  });
}

module.exports = app; // Export for testing
