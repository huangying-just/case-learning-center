import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Spin, 
  message, 
  Input, 
  Space, 
  Tag,
  Select,
  Divider,
  Collapse,
  Form,
  Modal
} from 'antd';
import { 
  BookOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  SearchOutlined,
  PlusOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { casesAPI, attachmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

const CaseListPage = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [filterLoading, setFilterLoading] = useState(false);
  const { user, hasRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const searchFilters = { ...filters };
      if (searchTerm) {
        searchFilters.search = searchTerm;
      }
      const response = await casesAPI.getAllCases(searchFilters);
      setCases(response.data.cases || []);
    } catch (error) {
      message.error('获取案例列表失败');
      console.error('获取案例错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      setFilterLoading(true);
      const response = await casesAPI.getFilterOptions();
      setFilterOptions(response.data.options || {});
    } catch (error) {
      message.error('获取筛选选项失败');
      console.error('获取筛选选项错误:', error);
    } finally {
      setFilterLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchTerm(value);
    const searchFilters = { ...filters };
    if (value) {
      searchFilters.search = value;
    } else {
      delete searchFilters.search;
    }
    
    // 立即执行搜索
    casesAPI.getAllCases(searchFilters).then(response => {
      setCases(response.data.cases || []);
    }).catch(error => {
      message.error('搜索失败');
      console.error('搜索错误:', error);
    });
  };

  // 处理筛选器变化
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    message.success('已清除所有筛选条件');
  };

  // 显示的案例就是当前的cases（已经通过API筛选过的）
  const displayedCases = cases;

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

  // 处理查看详情点击
  const handleViewDetail = (caseId) => {
    if (!isAuthenticated) {
      Modal.confirm({
        title: '需要登录',
        content: '查看案例详情需要登录，请选择登录或注册。',
        okText: '去登录',
        cancelText: '去注册',
        onOk: () => {
          navigate('/login', { state: { from: `/cases/${caseId}` } });
        },
        onCancel: () => {
          navigate('/register', { state: { from: `/cases/${caseId}` } });
        },
      });
    } else {
      navigate(`/cases/${caseId}`);
    }
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
            共 {displayedCases.length} 个案例
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

      {/* 搜索和筛选栏 */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Space size="large" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Search
              placeholder="搜索案例标题、内容、摘要或作者..."
              allowClear
              size="large"
              onSearch={handleSearch}
              onChange={(e) => {
                if (!e.target.value) {
                  handleSearch('');
                }
              }}
              value={searchTerm}
              style={{ width: '400px' }}
            />
            <Button 
              type="text" 
              icon={<ClearOutlined />} 
              onClick={clearAllFilters}
              disabled={Object.keys(filters).length === 0 && !searchTerm}
            >
              清除筛选
            </Button>
          </Space>
        </div>

        {/* 筛选器 */}
        <Collapse ghost>
          <Panel 
            header={
              <Space>
                <FilterOutlined />
                高级筛选
                {Object.keys(filters).length > 0 && (
                  <Tag color="blue">{Object.keys(filters).length} 个筛选条件</Tag>
                )}
              </Space>
            } 
            key="1"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>所属行业</Text>
                </div>
                <Select
                  placeholder="选择行业"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.industry}
                  onChange={(value) => handleFilterChange('industry', value)}
                  loading={filterLoading}
                >
                  {filterOptions.industries?.map(industry => (
                    <Option key={industry} value={industry}>{industry}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>语言</Text>
                </div>
                <Select
                  placeholder="选择语言"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.language}
                  onChange={(value) => handleFilterChange('language', value)}
                  loading={filterLoading}
                >
                  {filterOptions.languages?.map(language => (
                    <Option key={language} value={language}>
                      {language === 'zh-CN' ? '中文' : language === 'en' ? '英文' : language}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>案例类型</Text>
                </div>
                <Select
                  placeholder="选择案例类型"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.case_type}
                  onChange={(value) => handleFilterChange('case_type', value)}
                  loading={filterLoading}
                >
                  {filterOptions.caseTypes?.map(type => (
                    <Option key={type} value={type}>{type}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>学科领域</Text>
                </div>
                <Select
                  placeholder="选择学科"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.subject}
                  onChange={(value) => handleFilterChange('subject', value)}
                  loading={filterLoading}
                >
                  {filterOptions.subjects?.map(subject => (
                    <Option key={subject} value={subject}>{subject}</Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={12} md={8} lg={6}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>适用对象</Text>
                </div>
                <Select
                  placeholder="选择适用对象"
                  allowClear
                  style={{ width: '100%' }}
                  value={filters.target_audience}
                  onChange={(value) => handleFilterChange('target_audience', value)}
                  loading={filterLoading}
                >
                  {filterOptions.targetAudiences?.map(audience => (
                    <Option key={audience} value={audience}>{audience}</Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {/* 标签筛选区域 */}
            <Divider orientation="left">标签筛选</Divider>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>知识点</Text>
                </div>
                <div style={{ marginBottom: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {filterOptions.knowledgePoints?.map(point => (
                    <Tag.CheckableTag
                      key={point}
                      checked={filters.knowledge_point === point}
                      onChange={(checked) => handleFilterChange('knowledge_point', checked ? point : null)}
                      style={{ marginBottom: '4px' }}
                    >
                      {point}
                    </Tag.CheckableTag>
                  ))}
                </div>
              </Col>

              <Col span={24}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>教学知识点</Text>
                </div>
                <div style={{ marginBottom: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {filterOptions.teachingPoints?.map(point => (
                    <Tag.CheckableTag
                      key={point}
                      checked={filters.teaching_point === point}
                      onChange={(checked) => handleFilterChange('teaching_point', checked ? point : null)}
                      style={{ marginBottom: '4px' }}
                    >
                      {point}
                    </Tag.CheckableTag>
                  ))}
                </div>
              </Col>

              <Col span={24}>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong>标签</Text>
                </div>
                <div style={{ marginBottom: '8px', maxHeight: '120px', overflowY: 'auto' }}>
                  {filterOptions.tags?.map(tag => (
                    <Tag.CheckableTag
                      key={tag}
                      checked={filters.tag === tag}
                      onChange={(checked) => handleFilterChange('tag', checked ? tag : null)}
                      style={{ marginBottom: '4px' }}
                    >
                      {tag}
                    </Tag.CheckableTag>
                  ))}
                </div>
              </Col>
            </Row>
          </Panel>
        </Collapse>
      </Card>

      {/* 案例列表 */}
      {displayedCases.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <BookOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
          <Title level={3} style={{ color: '#999' }}>
            {searchTerm || Object.keys(filters).length > 0 ? '未找到匹配的案例' : '还没有案例'}
          </Title>
          <Text type="secondary">
                          {searchTerm || Object.keys(filters).length > 0 ? '请尝试其他搜索词或调整筛选条件' : '开始创建第一个案例吧！'}
          </Text>
                      {!searchTerm && Object.keys(filters).length === 0 && hasRole(['teacher', 'admin']) && (
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
          {displayedCases.map((caseItem) => (
            <Col xs={24} sm={12} lg={8} key={caseItem.id}>
              <Card
                hoverable
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                actions={[
                  <span 
                    key="view"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetail(caseItem.id)}
                  >
                    <EyeOutlined /> 查看详情
                  </span>
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
                    <Space wrap>
                      <Tag color="blue">
                        作者: {caseItem.author_name}
                      </Tag>
                      {caseItem.industry && (
                        <Tag color="green">{caseItem.industry}</Tag>
                      )}
                      {caseItem.case_type && (
                        <Tag color="orange">{caseItem.case_type}</Tag>
                      )}
                      {caseItem.subject && (
                        <Tag color="purple">{caseItem.subject}</Tag>
                      )}
                      {caseItem.target_audience && (
                        <Tag color="cyan">{caseItem.target_audience}</Tag>
                      )}
                    </Space>
                  </div>

                  {/* 显示知识点和标签 */}
                  {(caseItem.knowledge_points?.length > 0 || caseItem.teaching_points?.length > 0 || caseItem.tags?.length > 0) && (
                    <div style={{ marginBottom: '8px' }}>
                      <Space wrap size="small">
                        {caseItem.knowledge_points?.slice(0, 3).map(point => (
                          <Tag key={point} size="small" color="geekblue">
                            {point}
                          </Tag>
                        ))}
                        {caseItem.knowledge_points?.length > 3 && (
                          <Tag size="small" color="geekblue">
                            +{caseItem.knowledge_points.length - 3}
                          </Tag>
                        )}
                        {caseItem.teaching_points?.slice(0, 2).map(point => (
                          <Tag key={point} size="small" color="volcano">
                            {point}
                          </Tag>
                        ))}
                        {caseItem.teaching_points?.length > 2 && (
                          <Tag size="small" color="volcano">
                            +{caseItem.teaching_points.length - 2}
                          </Tag>
                        )}
                        {caseItem.tags?.slice(0, 2).map(tag => (
                          <Tag key={tag} size="small" color="gold">
                            #{tag}
                          </Tag>
                        ))}
                        {caseItem.tags?.length > 2 && (
                          <Tag size="small" color="gold">
                            +{caseItem.tags.length - 2}
                          </Tag>
                        )}
                      </Space>
                    </div>
                  )}

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