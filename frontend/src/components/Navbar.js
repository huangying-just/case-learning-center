import React from 'react';
import { Menu, Button, Avatar, Dropdown, Space } from 'antd';
import { 
  HomeOutlined, 
  BookOutlined, 
  PlusOutlined, 
  UserOutlined, 
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // 用户菜单
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: `${user?.username} (${user?.role === 'admin' ? '管理员' : user?.role === 'teacher' ? '教师' : '学生'})`,
        disabled: true,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  // 主菜单项
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/cases',
      icon: <BookOutlined />,
      label: <Link to="/cases">案例库</Link>,
    },
  ];

  // 如果用户是教师或管理员，添加创建案例菜单
  if (hasRole(['teacher', 'admin'])) {
    menuItems.push({
      key: '/create-case',
      icon: <PlusOutlined />,
      label: <Link to="/create-case">创建案例</Link>,
    });
  }

  // 如果用户是管理员，添加管理功能菜单
  if (hasRole(['admin'])) {
    menuItems.push({
      key: '/users',
      icon: <TeamOutlined />,
      label: <Link to="/users">用户管理</Link>,
    });
    menuItems.push({
      key: '/config',
      icon: <SettingOutlined />,
      label: <Link to="/config">配置管理</Link>,
    });
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '0 24px',
      height: '64px',
      backgroundColor: '#001529'
    }}>
      {/* Logo */}
      <div style={{ 
        color: 'white', 
        fontSize: '20px', 
        fontWeight: 'bold',
        marginRight: '32px'
      }}>
        案例学习中心
      </div>

      {/* 主菜单 */}
      <Menu
        theme="dark"
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ 
          flex: 1, 
          border: 'none',
          backgroundColor: 'transparent'
        }}
      />

      {/* 用户操作区域 */}
      <div>
        {isAuthenticated ? (
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer', color: 'white' }}>
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
              <span>{user?.username}</span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button 
              type="text" 
              style={{ color: 'white' }}
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button 
              type="primary"
              onClick={() => navigate('/register')}
            >
              注册
            </Button>
          </Space>
        )}
      </div>
    </div>
  );
};

export default Navbar; 