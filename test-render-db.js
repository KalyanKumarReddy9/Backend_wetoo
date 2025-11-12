const { Client } = require('pg');

async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'backend_wetoo_user',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'backend_wetoo',
  });

  try {
    console.log('Testing database connection...');
    console.log('Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'backend_wetoo_user',
      database: process.env.DB_NAME || 'backend_wetoo',
    });
    
    await client.connect();
    console.log('Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Query result:', result.rows[0]);
    
    await client.end();
    console.log('Connection test completed successfully!');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Error details:', err);
  }
}

testConnection();