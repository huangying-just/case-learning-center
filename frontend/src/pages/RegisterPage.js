import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Select, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
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
    const result = await register(values);
    setLoading(false);

    if (result.success) {
      message.success('注册成功！欢迎加入案例学习中心！');
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
            用户注册
          </Title>
          <Text type="secondary">
            创建您的案例学习中心账户
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: '请输入用户名！' },
              { min: 3, message: '用户名至少3个字符！' },
              { max: 20, message: '用户名最多20个字符！' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线！' }
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

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认您的密码！' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致！'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
            />
          </Form.Item>

          <Form.Item
            name="role"
            initialValue="student"
            rules={[{ required: true, message: '请选择用户角色！' }]}
          >
            <Select 
              prefix={<TeamOutlined />} 
              placeholder="选择角色"
            >
              <Option value="student">学生</Option>
              <Option value="teacher">教师</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <div style={{ textAlign: 'center' }}>
          <Text>
            已有账户？{' '}
            <Link to="/login" style={{ fontWeight: 'bold' }}>
              立即登录
            </Link>
          </Text>
        </div>

        {/* 角色说明 */}
        <Card 
          size="small" 
          style={{ 
            marginTop: '20px', 
            backgroundColor: '#f0f9ff',
            border: '1px solid #91d5ff'
          }}
        >
          <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
            角色说明
          </Title>
          <div style={{ fontSize: '12px', marginTop: '8px' }}>
            <div><strong>学生:</strong> 可以浏览和学习所有案例</div>
            <div><strong>教师:</strong> 可以创建、编辑和管理案例</div>
          </div>
        </Card>
      </Card>
    </div>
  );
};

export default RegisterPage; 