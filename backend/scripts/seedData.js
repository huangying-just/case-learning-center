const bcrypt = require('bcryptjs');
const db = require('../database/db');

const seedData = async () => {
  try {
    console.log('开始添加演示数据...');

    // 创建演示用户
    const users = [
      {
        username: 'admin',
        password: 'password',
        role: 'admin'
      },
      {
        username: 'teacher',
        password: 'password',
        role: 'teacher'
      },
      {
        username: 'student',
        password: 'password',
        role: 'student'
      }
    ];

    const userIds = {};
    
    for (const user of users) {
      // 检查用户是否已存在
      const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [user.username]);
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const result = await db.run(
          'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
          [user.username, hashedPassword, user.role]
        );
        userIds[user.username] = result.id;
        console.log(`✓ 创建用户: ${user.username} (${user.role})`);
      } else {
        userIds[user.username] = existingUser.id;
        console.log(`- 用户已存在: ${user.username}`);
      }
    }

    // 创建演示案例
    const cases = [
      {
        title: '电商平台用户体验优化案例',
        content: `案例背景：
某大型电商平台发现用户转化率逐渐下降，用户投诉增加，需要进行用户体验优化。

问题分析：
1. 页面加载速度过慢
2. 购物流程复杂
3. 搜索功能不够智能
4. 移动端适配不完善

解决方案：
1. 优化前端代码，使用CDN加速
2. 简化购物车和结算流程
3. 引入智能搜索算法
4. 重新设计移动端界面

实施过程：
项目团队分为前端优化组、算法优化组和移动端优化组，历时3个月完成改进。

结果评估：
- 页面加载速度提升60%
- 用户转化率提高25%
- 用户满意度提升40%
- 移动端订单占比提高30%

学习要点：
1. 用户体验优化需要数据驱动
2. 跨团队协作的重要性
3. 持续监控和迭代优化
4. 移动优先的设计理念`,
        author: 'teacher'
      },
      {
        title: '初创公司团队管理挑战',
        content: `案例背景：
一家AI初创公司在快速发展过程中遇到团队管理难题，员工流失率高，项目进度延迟。

挑战描述：
1. 团队规模从10人快速扩张到50人
2. 缺乏完善的管理制度
3. 沟通效率低下
4. 技术债务积累严重
5. 工作与生活平衡问题

管理策略：
1. 建立扁平化组织结构
2. 引入敏捷开发流程
3. 实施OKR目标管理
4. 加强团队建设活动
5. 提供灵活的工作安排

实施效果：
经过6个月的管理改进：
- 员工流失率从30%降至8%
- 项目按时交付率提升至90%
- 员工满意度显著提高
- 公司获得新一轮融资

关键学习点：
1. 快速发展期的管理挑战
2. 制度建设与文化塑造并重
3. 员工参与感和归属感的重要性
4. 适应性管理的必要性`,
        author: 'teacher'
      },
      {
        title: '教育科技公司的数字化转型',
        content: `案例背景：
传统教育培训机构在疫情冲击下，被迫进行数字化转型，从线下转向线上教学。

转型挑战：
1. 技术基础设施薄弱
2. 教师缺乏在线教学经验
3. 学生适应性差异大
4. 家长对在线教育信任度低

转型策略：
1. 技术基础建设
   - 采购在线教学平台
   - 建设直播技术架构
   - 部署云端存储系统

2. 人员培训计划
   - 教师在线教学技能培训
   - 学生数字化学习指导
   - 家长使用指南制作

3. 教学模式创新
   - 互动式直播课程
   - 录播与直播结合
   - 个性化学习路径

转型成果：
- 在线学员数量增长300%
- 教学质量满意度保持85%以上
- 成功开拓全国市场
- 营收同比增长150%

经验总结：
1. 危机可以成为转型的契机
2. 技术与教育的深度融合
3. 用户体验是成功的关键
4. 持续创新的重要性`,
        author: 'admin'
      }
    ];

    for (const caseData of cases) {
      // 检查案例是否已存在
      const existingCase = await db.get('SELECT id FROM cases WHERE title = ?', [caseData.title]);
      
      if (!existingCase) {
        const authorId = userIds[caseData.author];
        await db.run(
          'INSERT INTO cases (title, content, author_id) VALUES (?, ?, ?)',
          [caseData.title, caseData.content, authorId]
        );
        console.log(`✓ 创建案例: ${caseData.title}`);
      } else {
        console.log(`- 案例已存在: ${caseData.title}`);
      }
    }

    console.log('\n演示数据添加完成！');
    console.log('\n可以使用以下账户登录测试：');
    console.log('管理员 - 用户名: admin, 密码: password');
    console.log('教师   - 用户名: teacher, 密码: password');
    console.log('学生   - 用户名: student, 密码: password');

  } catch (error) {
    console.error('添加演示数据时出错:', error);
  } finally {
    db.close();
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  seedData();
}

module.exports = seedData; 