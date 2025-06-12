import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { useAuth } from './context/AuthContext';

// 组件导入
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CaseListPage from './pages/CaseListPage';
import CaseDetailPage from './pages/CaseDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CaseFormPage from './pages/CaseFormPage';
import PrivateRoute from './components/PrivateRoute';

const { Header, Content, Footer } = Layout;

function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'fixed', zIndex: 1, width: '100%', padding: 0 }}>
        <Navbar />
      </Header>
      
      <Content style={{ 
        marginTop: 64, 
        padding: '24px',
        minHeight: 'calc(100vh - 134px)' 
      }}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/cases" element={<CaseListPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* 受保护的路由 */}
          <Route path="/create-case" element={
            <PrivateRoute roles={['teacher', 'admin']}>
              <CaseFormPage />
            </PrivateRoute>
          } />
          <Route path="/edit-case/:id" element={
            <PrivateRoute roles={['teacher', 'admin']}>
              <CaseFormPage isEdit />
            </PrivateRoute>
          } />
          
          {/* 重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
      
      <Footer style={{ textAlign: 'center', backgroundColor: '#f0f2f5' }}>
        案例学习中心 ©{new Date().getFullYear()} Created with ❤️
      </Footer>
    </Layout>
  );
}

export default App; 