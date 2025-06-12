require('dotenv').config();

module.exports = {
  port: process.env.PORT || 9999,
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  dbPath: process.env.DB_PATH || './database/case.db',
  uploadPath: process.env.UPLOAD_PATH || './uploads'
}; 