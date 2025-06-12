const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// 获取所有用户 (仅管理员)
router.get('/', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    // 构建WHERE条件
    let whereConditions = [];
    let params = [];
    
    if (search) {
      whereConditions.push('username LIKE ?');
      params.push(`%${search}%`);
    }
    
    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }
    
    // 构建查询
    let whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await db.get(countSql, params);
    const total = countResult.total;
    
    // 计算分页
    const offset = (page - 1) * limit;
    
    // 获取用户列表
    const usersSql = `
      SELECT id, username, role, created_at 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const users = await db.all(usersSql, [...params, parseInt(limit), offset]);
    
    // 为每个用户添加案例统计
    const usersWithStats = [];
    for (const user of users) {
      const caseCount = await db.get(
        'SELECT COUNT(*) as count FROM cases WHERE author_id = ?',
        [user.id]
      );
      
      usersWithStats.push({
        ...user,
        case_count: caseCount.count
      });
    }
    
    res.json({
      message: '获取用户列表成功',
      users: usersWithStats,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 获取单个用户详情 (仅管理员)
router.get('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await db.get(`
      SELECT id, username, role, created_at 
      FROM users 
      WHERE id = ?
    `, [id]);
    
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在' 
      });
    }
    
    // 获取用户的案例统计
    const caseStats = await db.get(`
      SELECT 
        COUNT(*) as total_cases,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_cases,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as week_cases,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as month_cases
      FROM cases 
      WHERE author_id = ?
    `, [id]);
    
    res.json({
      message: '获取用户详情成功',
      user: {
        ...user,
        stats: caseStats
      }
    });
    
  } catch (error) {
    console.error('获取用户详情错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 创建新用户 (仅管理员)
router.post('/', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { username, password, role = 'student' } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ 
        error: '用户名和密码不能为空' 
      });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ 
        error: '用户名至少3个字符' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: '密码至少6个字符' 
      });
    }
    
    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({ 
        error: '无效的用户角色' 
      });
    }
    
    // 检查用户名是否已存在
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
    const result = await db.run(`
      INSERT INTO users (username, password, role)
      VALUES (?, ?, ?)
    `, [username, hashedPassword, role]);
    
    // 获取新创建的用户信息
    const newUser = await db.get(`
      SELECT id, username, role, created_at 
      FROM users 
      WHERE id = ?
    `, [result.lastID]);
    
    res.status(201).json({
      message: '用户创建成功',
      user: newUser
    });
    
  } catch (error) {
    console.error('创建用户错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 更新用户信息 (仅管理员)
router.put('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    // 检查用户是否存在
    const existingUser = await db.get(
      'SELECT id, username, role FROM users WHERE id = ?',
      [id]
    );
    
    if (!existingUser) {
      return res.status(404).json({ 
        error: '用户不存在' 
      });
    }
    
    // 防止删除最后一个管理员
    if (existingUser.role === 'admin' && role !== 'admin') {
      const adminCount = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ 
          error: '不能修改最后一个管理员的角色' 
        });
      }
    }
    
    // 构建更新字段
    const updateFields = [];
    const updateParams = [];
    
    if (username && username !== existingUser.username) {
      // 检查新用户名是否已被使用
      const duplicateUser = await db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, id]
      );
      
      if (duplicateUser) {
        return res.status(400).json({ 
          error: '用户名已存在' 
        });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ 
          error: '用户名至少3个字符' 
        });
      }
      
      updateFields.push('username = ?');
      updateParams.push(username);
    }
    
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ 
          error: '密码至少6个字符' 
        });
      }
      
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateFields.push('password = ?');
      updateParams.push(hashedPassword);
    }
    
    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      updateFields.push('role = ?');
      updateParams.push(role);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: '没有需要更新的字段' 
      });
    }
    
    // 执行更新
    updateParams.push(id);
    await db.run(`
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, updateParams);
    
    // 获取更新后的用户信息
    const updatedUser = await db.get(`
      SELECT id, username, role, created_at 
      FROM users 
      WHERE id = ?
    `, [id]);
    
    res.json({
      message: '用户信息更新成功',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 删除用户 (仅管理员)
router.delete('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: currentUserId } = req.user;
    
    // 检查用户是否存在
    const user = await db.get(
      'SELECT id, username, role FROM users WHERE id = ?',
      [id]
    );
    
    if (!user) {
      return res.status(404).json({ 
        error: '用户不存在' 
      });
    }
    
    // 防止删除自己
    if (parseInt(id) === currentUserId) {
      return res.status(400).json({ 
        error: '不能删除自己的账户' 
      });
    }
    
    // 防止删除最后一个管理员
    if (user.role === 'admin') {
      const adminCount = await db.get(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin"'
      );
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ 
          error: '不能删除最后一个管理员账户' 
        });
      }
    }
    
    // 检查用户是否有关联的案例
    const caseCount = await db.get(
      'SELECT COUNT(*) as count FROM cases WHERE author_id = ?',
      [id]
    );
    
    if (caseCount.count > 0) {
      return res.status(400).json({ 
        error: `该用户有 ${caseCount.count} 个案例，请先处理相关案例后再删除用户` 
      });
    }
    
    // 删除用户
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({
      message: '用户删除成功',
      deletedUser: {
        id: user.id,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 获取用户统计信息 (仅管理员)
router.get('/stats/overview', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teacher_count,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_users,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as week_users,
        COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as month_users
      FROM users
    `);
    
    // 获取最近注册的用户
    const recentUsers = await db.all(`
      SELECT id, username, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    res.json({
      message: '获取用户统计成功',
      stats: {
        ...stats,
        recent_users: recentUsers
      }
    });
    
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

module.exports = router; 