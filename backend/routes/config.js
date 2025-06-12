const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// 获取所有配置选项 (公开接口，用于表单选项)
router.get('/', async (req, res) => {
  try {
    const configs = await db.all(`
      SELECT config_type, config_value, display_name, sort_order
      FROM case_config 
      WHERE is_active = 1
      ORDER BY config_type, sort_order
    `);

    // 按配置类型分组
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.config_type]) {
        acc[config.config_type] = [];
      }
      acc[config.config_type].push({
        value: config.config_value,
        label: config.display_name,
        order: config.sort_order
      });
      return acc;
    }, {});

    res.json({
      message: '获取配置选项成功',
      configs: groupedConfigs
    });

  } catch (error) {
    console.error('获取配置选项错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 获取指定类型的配置选项
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    const configs = await db.all(`
      SELECT config_value, display_name, sort_order
      FROM case_config 
      WHERE config_type = ? AND is_active = 1
      ORDER BY sort_order
    `, [type]);

    const options = configs.map(config => ({
      value: config.config_value,
      label: config.display_name,
      order: config.sort_order
    }));

    res.json({
      message: '获取配置选项成功',
      options
    });

  } catch (error) {
    console.error('获取配置选项错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 管理员专用接口 - 获取所有配置（包括管理字段）
router.get('/admin/all', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const configs = await db.all(`
      SELECT * FROM case_config 
      ORDER BY config_type, sort_order
    `);

    res.json({
      message: '获取所有配置成功',
      configs
    });

  } catch (error) {
    console.error('获取配置错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 添加新配置选项 (仅管理员)
router.post('/', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { config_type, config_value, display_name, sort_order } = req.body;

    if (!config_type || !config_value || !display_name) {
      return res.status(400).json({ 
        error: '配置类型、值和显示名称不能为空' 
      });
    }

    // 检查是否已存在相同的配置
    const existing = await db.get(`
      SELECT id FROM case_config 
      WHERE config_type = ? AND config_value = ?
    `, [config_type, config_value]);

    if (existing) {
      return res.status(400).json({ 
        error: '该配置选项已存在' 
      });
    }

    const result = await db.run(`
      INSERT INTO case_config (config_type, config_value, display_name, sort_order)
      VALUES (?, ?, ?, ?)
    `, [config_type, config_value, display_name, sort_order || 0]);

    res.status(201).json({
      message: '配置选项添加成功',
      config: {
        id: result.id,
        config_type,
        config_value,
        display_name,
        sort_order: sort_order || 0
      }
    });

  } catch (error) {
    console.error('添加配置错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 更新配置选项 (仅管理员)
router.put('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { config_type, config_value, display_name, sort_order, is_active } = req.body;

    const existing = await db.get('SELECT * FROM case_config WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ 
        error: '配置项不存在' 
      });
    }

    await db.run(`
      UPDATE case_config 
      SET config_type = ?, config_value = ?, display_name = ?, 
          sort_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      config_type || existing.config_type,
      config_value || existing.config_value,
      display_name || existing.display_name,
      sort_order !== undefined ? sort_order : existing.sort_order,
      is_active !== undefined ? is_active : existing.is_active,
      id
    ]);

    res.json({
      message: '配置选项更新成功'
    });

  } catch (error) {
    console.error('更新配置错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

// 删除配置选项 (仅管理员)
router.delete('/:id', authMiddleware, checkRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.get('SELECT * FROM case_config WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ 
        error: '配置项不存在' 
      });
    }

    await db.run('DELETE FROM case_config WHERE id = ?', [id]);

    res.json({
      message: '配置选项删除成功'
    });

  } catch (error) {
    console.error('删除配置错误:', error);
    res.status(500).json({ 
      error: '服务器内部错误' 
    });
  }
});

module.exports = router; 