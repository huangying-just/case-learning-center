import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Spin, message, Input, Space, Tag } from 'antd';
import { 
  BookOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { casesAPI, attachmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

const CaseListPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await casesAPI.getAllCases();
      setCases(response.data.cases || []);
    } catch (error) {
      message.error('获取案例列表失败');
      console.error('获取案例错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤案例
  const filteredCases = cases.filter(caseItem =>
    caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseItem.author_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 截取内容预览
  const getContentPreview = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="加载案例列表中..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题和操作 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            案例库
          </Title>
          <Text type="secondary">
            共 {filteredCases.length} 个案例
          </Text>
        </div>
        
        {hasRole(['teacher', 'admin']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/create-case')}
          >
            创建案例
          </Button>
        )}
      </div>

      {/* 搜索栏 */}
      <Card style={{ marginBottom: '24px' }}>
        <Search
          placeholder="搜索案例标题、内容或作者..."
          allowClear
          size="large"
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '400px' }}
        />
      </Card>

      {/* 案例列表 */}
      {filteredCases.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <BookOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={3} style={{ color: '#999' }}>
            {searchTerm ? '未找到匹配的案例' : '还没有案例'}
          </Title>
          <Text type="secondary">
            {searchTerm ? '请尝试其他搜索词' : '开始创建第一个案例吧！'}
          </Text>
          {!searchTerm && hasRole(['teacher', 'admin']) && (
            <div style={{ marginTop: '16px' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/create-case')}
              >
                创建案例
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredCases.map((caseItem) => (
            <Col xs={24} sm={12} lg={8} key={caseItem.id}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                actions={[
                  <Link to={`/cases/${caseItem.id}`} key="view">
                    <EyeOutlined /> 查看详情
                  </Link>,
                  caseItem.attachment_filename ? (
                    <a 
                      href={attachmentAPI.getDownloadUrl(caseItem.attachment_path, caseItem.attachment_filename)}
                      target="_blank"
                      rel="noopener noreferrer"
                      key="download"
                    >
                      <DownloadOutlined /> 下载附件
                    </a>
                  ) : (
                    <span key="no-attachment" style={{ color: '#d9d9d9' }}>
                      <DownloadOutlined /> 无附件
                    </span>
                  )
                ]}
              >
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ marginBottom: '8px' }}>
                    {caseItem.title}
                  </Title>
                  
                  <Paragraph 
                    style={{ 
                      color: '#666', 
                      marginBottom: '16px',
                      minHeight: '60px'
                    }}
                  >
                    {getContentPreview(caseItem.content)}
                  </Paragraph>

                  <div style={{ marginBottom: '8px' }}>
                    <Space>
                      <Tag color="blue">
                        作者: {caseItem.author_name}
                      </Tag>
                      {caseItem.attachment_filename && (
                        <Tag color="green">
                          有附件
                        </Tag>
                      )}
                    </Space>
                  </div>

                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    创建时间: {formatDate(caseItem.created_at)}
                    {caseItem.updated_at !== caseItem.created_at && (
                      <span> · 更新时间: {formatDate(caseItem.updated_at)}</span>
                    )}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default CaseListPage; 