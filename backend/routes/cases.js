const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const config = require('../config');

// 获取筛选选项 (公开)
router.get('/filter-options', async (req, res) => {
  try {
    // 获取所有可用的筛选选项
    const [
      industries,
      languages,
      caseTypes,
      subjects,
      targetAudiences
    ] = await Promise.all([
      db.all('SELECT DISTINCT industry FROM cases WHERE industry IS NOT NULL AND industry != ""'),
      db.all('SELECT DISTINCT language FROM cases WHERE language IS NOT NULL AND language != ""'),
      db.all('SELECT DISTINCT case_type FROM cases WHERE case_type IS NOT NULL AND case_type != ""'),
      db.all('SELECT DISTINCT subject FROM cases WHERE subject IS NOT NULL AND subject != ""'),
      db.all('SELECT DISTINCT target_audience FROM cases WHERE target_audience IS NOT NULL AND target_audience != ""')
    ]);

    // 获取所有知识点和标签
    const casesWithArrays = await db.all('SELECT knowledge_points, teaching_points, tags FROM cases WHERE knowledge_points IS NOT NULL OR teaching_points IS NOT NULL OR tags IS NOT NULL');
    
    const allKnowledgePoints = new Set();
    const allTeachingPoints = new Set();
    const allTags = new Set();

    casesWithArrays.forEach(caseItem => {
      // 解析知识点
      if (caseItem.knowledge_points) {
        try {
          const points = typeof caseItem.knowledge_points === 'string' ? 
            JSON.parse(caseItem.knowledge_points) : caseItem.knowledge_points;
          if (Array.isArray(points)) {
            points.forEach(point => allKnowledgePoints.add(point));
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      // 解析教学知识点
      if (caseItem.teaching_points) {
        try {
          const points = typeof caseItem.teaching_points === 'string' ? 
            JSON.parse(caseItem.teaching_points) : caseItem.teaching_points;
          if (Array.isArray(points)) {
            points.forEach(point => allTeachingPoints.add(point));
          }
        } catch (e) {
          // 忽略解析错误
        }
      }

      // 解析标签
      if (caseItem.tags) {
        try {
          const tags = typeof caseItem.tags === 'string' ? 
            JSON.parse(caseItem.tags) : caseItem.tags;
          if (Array.isArray(tags)) {
            tags.forEach(tag => allTags.add(tag));
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    });

    res.json({
      message: '获取筛选选项成功',
      options: {
        industries: industries.map(item => item.industry),
        languages: languages.map(item => item.language),
        caseTypes: caseTypes.map(item => item.case_type),
        subjects: subjects.map(item => item.subject),
        targetAudiences: targetAudiences.map(item => item.target_audience),
        knowledgePoints: Array.from(allKnowledgePoints),
        teachingPoints: Array.from(allTeachingPoints),
        tags: Array.from(allTags)
      }
    });

  } catch (error) {
    console.error('获取筛选选项错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

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
    fileSize: 20 * 1024 * 1024 // 限制文件大小为20MB（支持图片和其他大文件）
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      // 文档类型
      '.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx',
      // Markdown
      '.md', '.markdown',
      // 图片类型
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
      // 网页文件
      '.html', '.htm'
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。支持文档(PDF、Word、PowerPoint、TXT)、Markdown(MD)、图片(JPG、PNG、GIF、SVG等)和网页(HTML)文件。'));
    }
  }
});

// 获取所有案例 (公开，支持筛选)
router.get('/', async (req, res) => {
  try {
    const { 
      industry, 
      language, 
      case_type, 
      subject, 
      target_audience,
      knowledge_point,
      teaching_point,
      tag,
      search 
    } = req.query;

    // 构建WHERE条件
    let whereConditions = [];
    let params = [];

    if (industry) {
      whereConditions.push('c.industry = ?');
      params.push(industry);
    }

    if (language) {
      whereConditions.push('c.language = ?');
      params.push(language);
    }

    if (case_type) {
      whereConditions.push('c.case_type = ?');
      params.push(case_type);
    }

    if (subject) {
      whereConditions.push('c.subject = ?');
      params.push(subject);
    }

    if (target_audience) {
      whereConditions.push('c.target_audience = ?');
      params.push(target_audience);
    }

    if (knowledge_point) {
      whereConditions.push('(c.knowledge_points LIKE ? OR c.knowledge_points LIKE ? OR c.knowledge_points LIKE ?)');
      params.push(`%"${knowledge_point}"%`, `%[${knowledge_point}]%`, `%${knowledge_point}%`);
    }

    if (teaching_point) {
      whereConditions.push('(c.teaching_points LIKE ? OR c.teaching_points LIKE ? OR c.teaching_points LIKE ?)');
      params.push(`%"${teaching_point}"%`, `%[${teaching_point}]%`, `%${teaching_point}%`);
    }

    if (tag) {
      whereConditions.push('(c.tags LIKE ? OR c.tags LIKE ? OR c.tags LIKE ?)');
      params.push(`%"${tag}"%`, `%[${tag}]%`, `%${tag}%`);
    }

    if (search) {
      whereConditions.push('(c.title LIKE ? OR c.content LIKE ? OR c.summary LIKE ? OR u.username LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // 构建完整的SQL查询
    let sql = `
      SELECT 
        c.id, 
        c.title, 
        c.content,
        c.summary,
        c.industry,
        c.language,
        c.case_type,
        c.subject,
        c.knowledge_points,
        c.target_audience,
        c.teaching_points,
        c.tags,
        c.attachment_filename,
        c.attachment_path,
        c.created_at,
        c.updated_at,
        u.username as author_name
      FROM cases c
      LEFT JOIN users u ON c.author_id = u.id
    `;

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += ' ORDER BY c.created_at DESC';

    const cases = await db.all(sql, params);

    // 为每个案例获取附件信息
    const processedCases = [];
    for (const caseItem of cases) {
      const attachments = await db.all(`
        SELECT id, filename, original_name, file_size, mime_type, created_at
        FROM case_attachments 
        WHERE case_id = ?
        ORDER BY created_at ASC
      `, [caseItem.id]);

      processedCases.push({
        ...caseItem,
        knowledge_points: caseItem.knowledge_points ? 
          (typeof caseItem.knowledge_points === 'string' ? 
            JSON.parse(caseItem.knowledge_points) : caseItem.knowledge_points) : [],
        teaching_points: caseItem.teaching_points ? 
          (typeof caseItem.teaching_points === 'string' ? 
            JSON.parse(caseItem.teaching_points) : caseItem.teaching_points) : [],
        tags: caseItem.tags ? 
          (typeof caseItem.tags === 'string' ? 
            JSON.parse(caseItem.tags) : caseItem.tags) : [],
        attachments: attachments
      });
    }

    res.json({
      message: '获取案例列表成功',
      cases: processedCases
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

    // 获取案例的所有附件
    const attachments = await db.all(`
      SELECT id, filename, original_name, file_size, mime_type, created_at
      FROM case_attachments 
      WHERE case_id = ?
      ORDER BY created_at ASC
    `, [id]);

    // 解析JSON字段
    const processedCase = {
      ...caseItem,
      knowledge_points: caseItem.knowledge_points ? 
        (typeof caseItem.knowledge_points === 'string' ? 
          JSON.parse(caseItem.knowledge_points) : caseItem.knowledge_points) : [],
      teaching_points: caseItem.teaching_points ? 
        (typeof caseItem.teaching_points === 'string' ? 
          JSON.parse(caseItem.teaching_points) : caseItem.teaching_points) : [],
      tags: caseItem.tags ? 
        (typeof caseItem.tags === 'string' ? 
          JSON.parse(caseItem.tags) : caseItem.tags) : [],
      attachments: attachments
    };

    res.json({
      message: '获取案例详情成功',
      case: processedCase
    });

  } catch (error) {
    console.error('获取案例详情错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 创建新案例 (需要认证，教师和管理员可以创建)
router.post('/', authMiddleware, checkRole(['teacher', 'admin']), upload.array('attachments', 10), async (req, res) => {
  try {
    const { 
      title, 
      content,
      summary,
      industry,
      language,
      case_type,
      subject,
      knowledge_points,
      target_audience,
      teaching_points,
      tags
    } = req.body;
    const { userId } = req.user;

    // 验证输入
    if (!title || !content) {
      return res.status(400).json({ 
        error: '标题和内容不能为空' 
      });
    }

    // 验证字数限制
    if (content && content.length > 50000) {
      return res.status(400).json({ error: '案例正文不能超过50000字' });
    }

    if (summary && summary.length > 500) {
      return res.status(400).json({ error: '案例摘要不能超过500字' });
    }

    // 处理附件信息（向后兼容：如果只有一个附件，同时保存到老字段）
    let attachmentFilename = null;
    let attachmentPath = null;
    const attachments = req.files || [];

    if (attachments.length > 0) {
      // 保持向后兼容：第一个附件存储到原字段
      attachmentFilename = attachments[0].originalname;
      attachmentPath = attachments[0].filename;
    }

    // 处理数组字段
    const processKnowledgePoints = Array.isArray(knowledge_points) ? 
      JSON.stringify(knowledge_points) : 
      (knowledge_points || '[]');
    
    const processTeachingPoints = Array.isArray(teaching_points) ? 
      JSON.stringify(teaching_points) : 
      (teaching_points || '[]');
    
    const processTags = Array.isArray(tags) ? 
      JSON.stringify(tags) : 
      (tags || '[]');

    // 创建案例
    const result = await db.run(`
      INSERT INTO cases (
        title, content, summary, industry, language, case_type, subject, 
        knowledge_points, target_audience, teaching_points, tags,
        author_id, attachment_filename, attachment_path
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      title, 
      content, 
      summary || '', 
      industry || '', 
      language || 'zh-CN', 
      case_type || '', 
      subject || '',
      processKnowledgePoints,
      target_audience || '',
      processTeachingPoints,
      processTags,
      userId, 
      attachmentFilename, 
      attachmentPath
    ]);

    const caseId = result.id;
    
    // 确保案例ID有效
    if (!caseId) {
      throw new Error('案例创建失败：未能获取案例ID');
    }

    // 保存所有附件到新的附件表
    const savedAttachments = [];
    for (const file of attachments) {
      try {
        const stats = fs.existsSync(path.join(config.uploadPath, file.filename)) ? 
          fs.statSync(path.join(config.uploadPath, file.filename)) : null;
        
        await db.run(`
          INSERT INTO case_attachments 
          (case_id, filename, original_name, file_path, file_size, mime_type)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          caseId,
          file.filename,
          file.originalname,
          file.filename,
          stats?.size || null,
          file.mimetype
        ]);

        savedAttachments.push({
          filename: file.filename,
          original_name: file.originalname,
          file_size: stats?.size || null,
          mime_type: file.mimetype
        });
      } catch (attachmentError) {
        console.error('保存附件错误:', file.filename, attachmentError);
        // 删除已上传的文件（如果存在）
        const filePath = path.join(config.uploadPath, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        // 继续处理其他附件，不中断整个流程
      }
    }

    res.status(201).json({
      message: '案例创建成功',
      case: {
        id: caseId,
        title,
        content,
        summary: summary || '',
        industry: industry || '',
        language: language || 'zh-CN',
        case_type: case_type || '',
        subject: subject || '',
        knowledge_points: Array.isArray(knowledge_points) ? knowledge_points : [],
        target_audience: target_audience || '',
        teaching_points: Array.isArray(teaching_points) ? teaching_points : [],
        tags: Array.isArray(tags) ? tags : [],
        attachment_filename: attachmentFilename,
        attachment_path: attachmentPath,
        attachments: savedAttachments
      }
    });

  } catch (error) {
    console.error('创建案例错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 添加附件到现有案例
router.post('/:id/attachments', authMiddleware, upload.array('attachments', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const attachments = req.files || [];

    if (attachments.length === 0) {
      return res.status(400).json({ error: '请选择要上传的附件' });
    }

    // 检查案例是否存在
    const caseItem = await db.get('SELECT * FROM cases WHERE id = ?', [id]);
    if (!caseItem) {
      return res.status(404).json({ error: '案例不存在' });
    }

    // 检查权限：只有作者或管理员可以添加附件
    if (caseItem.author_id !== userId && role !== 'admin') {
      return res.status(403).json({ error: '权限不足，无法修改此案例' });
    }

    // 保存附件
    const savedAttachments = [];
    for (const file of attachments) {
      const stats = fs.existsSync(path.join(config.uploadPath, file.filename)) ? 
        fs.statSync(path.join(config.uploadPath, file.filename)) : null;
      
      const result = await db.run(`
        INSERT INTO case_attachments 
        (case_id, filename, original_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        id,
        file.filename,
        file.originalname,
        file.filename,
        stats?.size || null,
        file.mimetype
      ]);

      savedAttachments.push({
        id: result.id,
        filename: file.filename,
        original_name: file.originalname,
        file_size: stats?.size || null,
        mime_type: file.mimetype
      });
    }

    res.json({
      message: '附件添加成功',
      attachments: savedAttachments
    });

  } catch (error) {
    console.error('添加附件错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 删除案例附件
router.delete('/:id/attachments/:attachmentId', authMiddleware, async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const { userId, role } = req.user;

    // 检查案例是否存在
    const caseItem = await db.get('SELECT * FROM cases WHERE id = ?', [id]);
    if (!caseItem) {
      return res.status(404).json({ error: '案例不存在' });
    }

    // 检查权限：只有作者或管理员可以删除附件
    if (caseItem.author_id !== userId && role !== 'admin') {
      return res.status(403).json({ error: '权限不足，无法修改此案例' });
    }

    // 获取附件信息
    const attachment = await db.get(`
      SELECT * FROM case_attachments 
      WHERE id = ? AND case_id = ?
    `, [attachmentId, id]);

    if (!attachment) {
      return res.status(404).json({ error: '附件不存在' });
    }

    // 删除文件
    const filePath = path.join(config.uploadPath, attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await db.run('DELETE FROM case_attachments WHERE id = ?', [attachmentId]);

    res.json({ message: '附件删除成功' });

  } catch (error) {
    console.error('删除附件错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 更新案例 (需要认证，只有作者或管理员可以更新)
router.put('/:id', authMiddleware, upload.array('attachments', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      content,
      summary,
      industry,
      language,
      case_type,
      subject,
      knowledge_points,
      target_audience,
      teaching_points,
      tags
    } = req.body;
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

    // 验证字数限制
    if (content && content.length > 50000) {
      return res.status(400).json({ error: '案例正文不能超过50000字' });
    }

    if (summary && summary.length > 500) {
      return res.status(400).json({ error: '案例摘要不能超过500字' });
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

    // 处理数组字段
    const processKnowledgePoints = Array.isArray(knowledge_points) ? 
      JSON.stringify(knowledge_points) : 
      (knowledge_points || '[]');
    
    const processTeachingPoints = Array.isArray(teaching_points) ? 
      JSON.stringify(teaching_points) : 
      (teaching_points || '[]');
    
    const processTags = Array.isArray(tags) ? 
      JSON.stringify(tags) : 
      (tags || '[]');

    // 更新案例
    await db.run(`
      UPDATE cases 
      SET title = ?, content = ?, summary = ?, industry = ?, language = ?, 
          case_type = ?, subject = ?, knowledge_points = ?, target_audience = ?,
          teaching_points = ?, tags = ?, attachment_filename = ?, attachment_path = ?, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title, 
      content, 
      summary || '', 
      industry || '', 
      language || 'zh-CN', 
      case_type || '', 
      subject || '',
      processKnowledgePoints,
      target_audience || '',
      processTeachingPoints,
      processTags,
      attachmentFilename, 
      attachmentPath, 
      id
    ]);

    res.json({
      message: '案例更新成功',
      case: {
        id: parseInt(id),
        title,
        content,
        summary: summary || '',
        industry: industry || '',
        language: language || 'zh-CN',
        case_type: case_type || '',
        subject: subject || '',
        knowledge_points: Array.isArray(knowledge_points) ? knowledge_points : [],
        target_audience: target_audience || '',
        teaching_points: Array.isArray(teaching_points) ? teaching_points : [],
        tags: Array.isArray(tags) ? tags : [],
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