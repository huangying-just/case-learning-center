const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../database/db');
const config = require('../config');

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'student' } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ 
        error: '用户名和密码不能为空' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: '密码长度至少6位' 
      });
    }

    // 检查用户是否已存在
    const existingUser = await db.get(
      'SELECT id FROM users WHERE username = ?', 
      [username]
    );

    if (existingUser) {
      return res.status(400).json({ 
        error: '用户名已存在' 
      });
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 创建用户
    const result = await db.run(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: result.id, 
        username: username, 
        role: role 
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '用户注册成功',
      token,
      user: {
        id: result.id,
        username,
        role
      }
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ 
        error: '用户名和密码不能为空' 
      });
    }

    // 查找用户
    const user = await db.get(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    if (!user) {
      return res.status(401).json({ 
        error: '用户名或密码错误' 
      });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: '用户名或密码错误' 
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

module.exports = router; 