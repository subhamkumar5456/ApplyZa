const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compileRouter = require('./routes/compile');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Security Headers
app.use(helmet());

// 2. CORS setup
// In production, restrict this to the specific frontend origin (e.g., 'https://applyza.com')
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
}));

// 3. Rate limiting (e.g., max 10 requests per minute per IP for compilation)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many compilation requests from this IP, please try again later.',
});

// Since compilation is heavy, apply the rate limiter globally or on specific routes
app.use('/compile', limiter);

// 4. Body parser
// We need to allow large JSON payloads if LaTeX documents get big
app.use(express.json({ limit: '5mb' }));

// 5. Routes
app.use('/compile', compileRouter);

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'latex-compiler' });
});

// 6. Global Error Handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`LaTeX Compiler Service is running on port ${PORT}`);
});
