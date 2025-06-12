require('dotenv').config();
const path = require('path');

module.exports = {
  port: process.env.PORT || 9999,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  dbPath: process.env.DB_PATH || path.join(__dirname, 'database', 'case.db'),
  uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, 'uploads')
}; 