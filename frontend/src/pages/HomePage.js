import React from 'react';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { 
  BookOutlined, 
  TeamOutlined, 
  SafetyOutlined,
  RightOutlined 
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: <BookOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      title: '丰富的案例库',
      description: '汇集各领域的优质教学案例，为学习者提供实践经验和理论知识的完美结合。'
    },
    {
      icon: <TeamOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      title: '角色化管理',
      description: '支持管理员、教师、学生等不同角色，实现精细化权限管理和个性化学习体验。'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
      title: '安全可靠',
      description: '采用JWT认证机制，确保用户数据安全，提供稳定可靠的学习环境。'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 欢迎横幅 */}
      <Card 
        style={{ 
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
      >
        <div style={{ textAlign: 'center', color: 'white', padding: '40px 0' }}>
          <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
            欢迎来到案例学习中心
          </Title>
          <Paragraph style={{ fontSize: '18px', color: 'white', marginBottom: '32px' }}>
            探索知识，分享经验，在实践中成长
          </Paragraph>
          
          {isAuthenticated ? (
            <div>
              <Title level={3} style={{ color: 'white', marginBottom: '24px' }}>
                欢迎回来，{user?.username}！
              </Title>
              <Space size="large">
                <Link to="/cases">
                  <Button type="primary" size="large" icon={<BookOutlined />}>
                    浏览案例库
                  </Button>
                </Link>
                {(user?.role === 'teacher' || user?.role === 'admin') && (
                  <Link to="/create-case">
                    <Button size="large" style={{ 
                      background: 'rgba(255,255,255,0.2)', 
                      borderColor: 'white',
                      color: 'white'
                    }}>
                      创建新案例
                    </Button>
                  </Link>
                )}
              </Space>
            </div>
          ) : (
            <Space size="large">
              <Link to="/cases">
                <Button type="primary" size="large" icon={<BookOutlined />}>
                  开始探索
                </Button>
              </Link>
              <Link to="/register">
                <Button size="large" style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  borderColor: 'white',
                  color: 'white'
                }}>
                  立即注册
                </Button>
              </Link>
            </Space>
          )}
        </div>
      </Card>

      {/* 平台特色 */}
      <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
        平台特色
      </Title>
      
      <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
        {features.map((feature, index) => (
          <Col xs={24} md={8} key={index}>
            <Card 
              style={{ 
                height: '100%', 
                textAlign: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              hoverable
            >
              <div style={{ marginBottom: '16px' }}>
                {feature.icon}
              </div>
              <Title level={4} style={{ marginBottom: '16px' }}>
                {feature.title}
              </Title>
              <Paragraph style={{ color: '#666' }}>
                {feature.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 快速开始 */}
      <Card style={{ textAlign: 'center' }}>
        <Title level={3} style={{ marginBottom: '16px' }}>
          准备好开始学习了吗？
        </Title>
        <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>
          立即加入我们的学习社区，获取优质教学案例资源
        </Paragraph>
        <Link to="/cases">
          <Button type="primary" size="large" icon={<RightOutlined />}>
            进入案例库
          </Button>
        </Link>
      </Card>
    </div>
  );
};

export default HomePage; 