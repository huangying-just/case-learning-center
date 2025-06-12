import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 如果已经登录，重定向到主页或目标页面
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onFinish = async (values) => {
    setLoading(true);
    const result = await login(values);
    setLoading(false);

    if (result.success) {
      message.success('登录成功！');
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      message.error(result.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: '400px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            用户登录
          </Title>
          <Text type="secondary">
            登录到案例学习中心
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名！' },
              { min: 3, message: '用户名至少3个字符！' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码！' },
              { min: 6, message: '密码至少6个字符！' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div style={{ textAlign: 'center' }}>
          <Text>
            还没有账户？{' '}
            <Link to="/register" style={{ fontWeight: 'bold' }}>
              立即注册
            </Link>
          </Text>
        </div>

        {/* 演示账户提示 */}
        <Card 
          size="small" 
          style={{ 
            marginTop: '20px', 
            backgroundColor: '#f6ffed',
            border: '1px solid #b7eb8f'
          }}
        >
          <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
            演示账户
          </Title>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            <div>管理员: admin / password</div>
            <div>教师: teacher / password</div>
            <div>学生: student / password</div>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default LoginPage; 