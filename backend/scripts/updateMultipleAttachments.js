const db = require('../database/db');
const fs = require('fs');
const path = require('path');

async function updateDatabaseForMultipleAttachments() {
  try {
    console.log('开始更新数据库以支持多个附件...');

    // 1. 创建新的附件表
    await db.run(`
      CREATE TABLE IF NOT EXISTS case_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ 创建 case_attachments 表成功');

    // 2. 迁移现有附件数据
    const existingCases = await db.all(`
      SELECT id, attachment_filename, attachment_path 
      FROM cases 
      WHERE attachment_filename IS NOT NULL AND attachment_path IS NOT NULL
    `);

    console.log(`📄 找到 ${existingCases.length} 个带附件的案例需要迁移`);

    for (const caseItem of existingCases) {
      // 检查文件是否存在
      const filePath = path.join(__dirname, '../../uploads', caseItem.attachment_path);
      let fileSize = null;
      let mimeType = null;

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
        
        // 根据文件扩展名判断MIME类型
        const ext = path.extname(caseItem.attachment_filename).toLowerCase();
        const mimeTypes = {
          '.pdf': 'application/pdf',
          '.doc': 'application/msword',
          '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          '.txt': 'text/plain',
          '.ppt': 'application/vnd.ms-powerpoint',
          '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          '.md': 'text/markdown',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp',
          '.svg': 'image/svg+xml',
          '.webp': 'image/webp',
          '.html': 'text/html',
          '.htm': 'text/html'
        };
        mimeType = mimeTypes[ext] || 'application/octet-stream';
      }

      // 插入到新的附件表
      await db.run(`
        INSERT INTO case_attachments 
        (case_id, filename, original_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        caseItem.id,
        caseItem.attachment_path,
        caseItem.attachment_filename,
        caseItem.attachment_path,
        fileSize,
        mimeType
      ]);

      console.log(`  ✅ 迁移案例 ${caseItem.id} 的附件: ${caseItem.attachment_filename}`);
    }

    console.log('🎉 数据库更新完成！');
    console.log('📝 注意：原来的 attachment_filename 和 attachment_path 字段保持不变，以保证向后兼容');

  } catch (error) {
    console.error('❌ 数据库更新失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateDatabaseForMultipleAttachments()
    .then(() => {
      console.log('数据库更新成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('数据库更新失败:', error);
      process.exit(1);
    });
}

module.exports = { updateDatabaseForMultipleAttachments }; 