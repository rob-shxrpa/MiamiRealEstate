const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Apply API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});

// Start server
const PORT = config.port || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API routes available at: http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Permit routes: 
   - GET /api/permits
   - GET /api/permits/types/all
   - GET /api/permits/statuses/all
   - GET /api/permits/folio/:folioNumber
   - GET /api/permits/:id`);
});

module.exports = app; 