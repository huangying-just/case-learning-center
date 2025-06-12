import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, hasRole, user } = useAuth();
  const location = useLocation();

  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 如果指定了角色要求，检查用户权限
  if (roles.length > 0 && !hasRole(roles)) {
    return (
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问此页面。"
        extra={
          <div>
            <p>
              当前身份：
              {user?.role === 'admin' ? '管理员' : 
               user?.role === 'teacher' ? '教师' : '学生'}
            </p>
            <p>
              需要权限：
              {roles.map(role => 
                role === 'admin' ? '管理员' : 
                role === 'teacher' ? '教师' : '学生'
              ).join(' 或 ')}
            </p>
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          </div>
        }
      />
    );
  }

  // 权限验证通过，渲染子组件
  return children;
};

export default PrivateRoute; 