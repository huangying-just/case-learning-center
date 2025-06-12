const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

// 确保数据库目录存在
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 确保上传目录存在
if (!fs.existsSync(config.uploadPath)) {
  fs.mkdirSync(config.uploadPath, { recursive: true });
}

const db = new sqlite3.Database(config.dbPath);

db.serialize(() => {
  // 创建 users 表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'student' CHECK(role IN ('admin', 'teacher', 'student')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建 cases 表
  db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      attachment_filename TEXT,
      attachment_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES users(id)
    )
  `);

  console.log('数据库表创建成功！');
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库时出错:', err.message);
  } else {
    console.log('数据库初始化完成。');
  }
}); 