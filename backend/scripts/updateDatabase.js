const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

const updateDatabase = async () => {
  const db = new sqlite3.Database(config.dbPath);

  try {
    console.log('开始更新数据库结构...');

    // 更新cases表，添加新字段
    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN summary TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加summary字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN industry TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加industry字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN language TEXT DEFAULT 'zh-CN'
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加language字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN case_type TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加case_type字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN subject TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加subject字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN knowledge_points TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加knowledge_points字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN target_audience TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加target_audience字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN teaching_points TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加teaching_points字段');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        ALTER TABLE cases ADD COLUMN tags TEXT
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          reject(err);
        } else {
          console.log('✓ 添加tags字段');
          resolve();
        }
      });
    });

    // 创建配置表来存储预定义选项
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS case_config (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          config_type TEXT NOT NULL,
          config_value TEXT NOT NULL,
          display_name TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✓ 创建case_config配置表');
          resolve();
        }
      });
    });

    // 插入默认配置数据
    const defaultConfigs = [
      // 行业
      { type: 'industry', value: 'technology', name: '科技行业', order: 1 },
      { type: 'industry', value: 'education', name: '教育行业', order: 2 },
      { type: 'industry', value: 'finance', name: '金融行业', order: 3 },
      { type: 'industry', value: 'healthcare', name: '医疗健康', order: 4 },
      { type: 'industry', value: 'retail', name: '零售电商', order: 5 },
      { type: 'industry', value: 'manufacturing', name: '制造业', order: 6 },
      
      // 语言
      { type: 'language', value: 'zh-CN', name: '中文', order: 1 },
      { type: 'language', value: 'en-US', name: 'English', order: 2 },
      
      // 案例类型
      { type: 'case_type', value: 'problem_solving', name: '问题解决', order: 1 },
      { type: 'case_type', value: 'decision_making', name: '决策分析', order: 2 },
      { type: 'case_type', value: 'process_analysis', name: '流程分析', order: 3 },
      { type: 'case_type', value: 'strategy_planning', name: '战略规划', order: 4 },
      { type: 'case_type', value: 'innovation', name: '创新管理', order: 5 },
      
      // 学科
      { type: 'subject', value: 'management', name: '管理学', order: 1 },
      { type: 'subject', value: 'marketing', name: '市场营销', order: 2 },
      { type: 'subject', value: 'finance', name: '财务管理', order: 3 },
      { type: 'subject', value: 'hr', name: '人力资源', order: 4 },
      { type: 'subject', value: 'operations', name: '运营管理', order: 5 },
      { type: 'subject', value: 'strategy', name: '战略管理', order: 6 },
      
      // 适用对象
      { type: 'target_audience', value: 'undergraduate', name: '本科生', order: 1 },
      { type: 'target_audience', value: 'graduate', name: '研究生', order: 2 },
      { type: 'target_audience', value: 'mba', name: 'MBA学员', order: 3 },
      { type: 'target_audience', value: 'executive', name: '高管培训', order: 4 },
      { type: 'target_audience', value: 'professional', name: '专业人士', order: 5 },
    ];

    for (const config of defaultConfigs) {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR IGNORE INTO case_config 
          (config_type, config_value, display_name, sort_order) 
          VALUES (?, ?, ?, ?)
        `, [config.type, config.value, config.name, config.order], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    console.log('✓ 插入默认配置数据');
    console.log('\n数据库更新完成！');

  } catch (error) {
    console.error('数据库更新失败:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('关闭数据库时出错:', err.message);
      } else {
        console.log('数据库连接已关闭');
      }
    });
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  updateDatabase();
}

module.exports = updateDatabase; 