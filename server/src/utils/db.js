const { Pool } = require('pg');
const config = require('../config');

// Log detailed database configuration (sanitizing password)
console.log('Database configuration:', {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password ? '******' : 'not set',
  database: config.db.database,
});

// Create a new pool with configuration from environment variables
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  // Automatically parse date/time types
  parseInputDatesAsUTC: true,
  // Connection timeout
  connectionTimeoutMillis: 10000,
});

// Handle connection events
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  
  // Provide more helpful error messages based on the error type
  if (err.code === 'ECONNREFUSED') {
    console.error(`
=================================================================
DATABASE CONNECTION FAILED: PostgreSQL server is not running
=================================================================
Please ensure that:
1. PostgreSQL is installed on your system
2. The PostgreSQL service is running
3. Your database connection settings are correct:
   - Host: ${config.db.host}
   - Port: ${config.db.port}
   - User: ${config.db.user}
   - Database: ${config.db.database}

To install PostgreSQL: https://www.postgresql.org/download/
To start PostgreSQL service: Start-Service postgresql*
=================================================================`);
  } else if (err.code === 'ENOTFOUND') {
    console.error(`
=================================================================
DATABASE CONNECTION FAILED: Host not found
=================================================================
The database host "${config.db.host}" could not be resolved.
Please check your network connection and DNS settings.
=================================================================`);
  } else if (err.code === '28P01') {
    console.error(`
=================================================================
DATABASE CONNECTION FAILED: Authentication failed
=================================================================
Invalid username or password.
=================================================================`);
  } else if (err.code === '3D000') {
    console.error(`
=================================================================
DATABASE CONNECTION FAILED: Database does not exist
=================================================================
Database "${config.db.database}" does not exist.
Please create the database or update your configuration.
=================================================================`);
  }
  
  // Don't exit the process, let the application continue with limited functionality
  // process.exit(-1);
});

/**
 * Execute a SQL query with optional parameters
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
const query = async (text, params) => {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (config.nodeEnv === 'development') {
      console.log('Executed query', {
        text,
        duration,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
};

/**
 * Get a client from the connection pool
 * @returns {Promise} - Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Override query method to log queries in development
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  // Override release method to log on release
  client.release = () => {
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

module.exports = {
  query,
  getClient,
  pool
}; 