const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const config = require('../config');

// 配置multer进行文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 确保上传目录存在
    if (!fs.existsSync(config.uploadPath)) {
      fs.mkdirSync(config.uploadPath, { recursive: true });
    }
    cb(null, config.uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1000);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${randomNum}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。仅支持PDF、Word、PowerPoint和文本文件。'));
    }
  }
});

// 获取所有案例 (公开)
router.get('/', async (req, res) => {
  try {
    const cases = await db.all(`
      SELECT 
        c.id, 
        c.title, 
        c.content, 
        c.attachment_filename,
        c.created_at,
        c.updated_at,
        u.username as author_name
      FROM cases c
      LEFT JOIN users u ON c.author_id = u.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      message: '获取案例列表成功',
      cases
    });

  } catch (error) {
    console.error('获取案例列表错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 获取单个案例 (公开)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const caseItem = await db.get(`
      SELECT 
        c.*, 
        u.username as author_name
      FROM cases c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!caseItem) {
      return res.status(404).json({ 
        error: '案例不存在' 
      });
    }

    res.json({
      message: '获取案例详情成功',
      case: caseItem
    });

  } catch (error) {
    console.error('获取案例详情错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 创建新案例 (需要认证，教师和管理员可以创建)
router.post('/', authMiddleware, checkRole(['teacher', 'admin']), upload.single('attachment'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const { userId } = req.user;

    // 验证输入
    if (!title || !content) {
      return res.status(400).json({ 
        error: '标题和内容不能为空' 
      });
    }

    // 处理附件信息
    let attachmentFilename = null;
    let attachmentPath = null;

    if (req.file) {
      attachmentFilename = req.file.originalname;
      attachmentPath = req.file.filename; // 存储服务器上的文件名
    }

    // 创建案例
    const result = await db.run(`
      INSERT INTO cases (title, content, author_id, attachment_filename, attachment_path) 
      VALUES (?, ?, ?, ?, ?)
    `, [title, content, userId, attachmentFilename, attachmentPath]);

    res.status(201).json({
      message: '案例创建成功',
      case: {
        id: result.id,
        title,
        content,
        attachment_filename: attachmentFilename,
        attachment_path: attachmentPath
      }
    });

  } catch (error) {
    console.error('创建案例错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 更新案例 (需要认证，只有作者或管理员可以更新)
router.put('/:id', authMiddleware, upload.single('attachment'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const { userId, role } = req.user;

    // 检查案例是否存在
    const existingCase = await db.get('SELECT * FROM cases WHERE id = ?', [id]);

    if (!existingCase) {
      return res.status(404).json({ 
        error: '案例不存在' 
      });
    }

    // 检查权限：只有作者或管理员可以更新
    if (existingCase.author_id !== userId && role !== 'admin') {
      return res.status(403).json({ 
        error: '权限不足，无法修改此案例' 
      });
    }

    // 验证输入
    if (!title || !content) {
      return res.status(400).json({ 
        error: '标题和内容不能为空' 
      });
    }

    // 处理新附件
    let attachmentFilename = existingCase.attachment_filename;
    let attachmentPath = existingCase.attachment_path;

    if (req.file) {
      // 删除旧附件
      if (existingCase.attachment_path) {
        const oldFilePath = path.join(config.uploadPath, existingCase.attachment_path);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      attachmentFilename = req.file.originalname;
      attachmentPath = req.file.filename;
    }

    // 更新案例
    await db.run(`
      UPDATE cases 
      SET title = ?, content = ?, attachment_filename = ?, attachment_path = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content, attachmentFilename, attachmentPath, id]);

    res.json({
      message: '案例更新成功',
      case: {
        id: parseInt(id),
        title,
        content,
        attachment_filename: attachmentFilename,
        attachment_path: attachmentPath
      }
    });

  } catch (error) {
    console.error('更新案例错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 删除案例 (需要认证，只有作者或管理员可以删除)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    // 检查案例是否存在
    const existingCase = await db.get('SELECT * FROM cases WHERE id = ?', [id]);

    if (!existingCase) {
      return res.status(404).json({ 
        error: '案例不存在' 
      });
    }

    // 检查权限：只有作者或管理员可以删除
    if (existingCase.author_id !== userId && role !== 'admin') {
      return res.status(403).json({ 
        error: '权限不足，无法删除此案例' 
      });
    }

    // 删除关联的附件文件
    if (existingCase.attachment_path) {
      const filePath = path.join(config.uploadPath, existingCase.attachment_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // 删除案例记录
    await db.run('DELETE FROM cases WHERE id = ?', [id]);

    res.json({
      message: '案例删除成功'
    });

  } catch (error) {
    console.error('删除案例错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

module.exports = router; 