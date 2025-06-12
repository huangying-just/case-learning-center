import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Space, 
  Spin, 
  message, 
  Tag, 
  Divider,
  Modal,
  Breadcrumb 
} from 'antd';
import { 
  ArrowLeftOutlined,
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { casesAPI, attachmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const CaseDetailPage = () => {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const fetchCaseDetail = async () => {
    try {
      setLoading(true);
      const response = await casesAPI.getCaseById(id);
      setCaseData(response.data.case);
    } catch (error) {
      message.error('获取案例详情失败');
      console.error('获取案例详情错误:', error);
      navigate('/cases');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    confirm({
      title: '确认删除',
      content: '您确定要删除这个案例吗？此操作不可撤销。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          setDeleteLoading(true);
          await casesAPI.deleteCase(id);
          message.success('案例删除成功');
          navigate('/cases');
        } catch (error) {
          message.error('删除案例失败');
          console.error('删除案例错误:', error);
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 判断是否可以编辑/删除
  const canModify = user && (
    user.role === 'admin' || 
    caseData?.author_id === user.id
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="加载案例详情中..." />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Title level={3}>案例不存在</Title>
        <Button type="primary" onClick={() => navigate('/cases')}>
          返回案例库
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/cases">案例库</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{caseData.title}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 返回按钮 */}
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/cases')}
        style={{ marginBottom: '16px' }}
      >
        返回案例库
      </Button>

      {/* 案例详情卡片 */}
      <Card>
        {/* 标题和操作按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <Title level={1} style={{ margin: 0, flex: 1 }}>
            {caseData.title}
          </Title>
          
          {canModify && (
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />}
                onClick={() => navigate(`/edit-case/${id}`)}
              >
                编辑
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                loading={deleteLoading}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Space>
          )}
        </div>

        {/* 元信息 */}
        <div style={{ marginBottom: '24px' }}>
          <Space size="large" wrap>
            <span>
              <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <Text strong>作者：</Text>
              <Text>{caseData.author_name}</Text>
            </span>
            
            <span>
              <CalendarOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
              <Text strong>创建时间：</Text>
              <Text>{formatDate(caseData.created_at)}</Text>
            </span>

            {caseData.updated_at !== caseData.created_at && (
              <span>
                <CalendarOutlined style={{ marginRight: '8px', color: '#faad14' }} />
                <Text strong>更新时间：</Text>
                <Text>{formatDate(caseData.updated_at)}</Text>
              </span>
            )}
          </Space>
        </div>

        {/* 附件信息 */}
        {caseData.attachment_filename && (
          <div style={{ marginBottom: '24px' }}>
            <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Space>
                <FileTextOutlined style={{ color: '#52c41a' }} />
                <Text strong>附件：</Text>
                <Text>{caseData.attachment_filename}</Text>
                <Button 
                  type="link" 
                  icon={<DownloadOutlined />}
                  href={attachmentAPI.getDownloadUrl(caseData.attachment_path, caseData.attachment_filename)}
                  target="_blank"
                >
                  下载
                </Button>
              </Space>
            </Card>
          </div>
        )}

        <Divider />

        {/* 案例内容 */}
        <div>
          <Title level={3} style={{ marginBottom: '16px' }}>
            案例内容
          </Title>
          <Card style={{ backgroundColor: '#fafafa' }}>
            <Paragraph 
              style={{ 
                fontSize: '16px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                margin: 0
              }}
            >
              {caseData.content}
            </Paragraph>
          </Card>
        </div>

        {/* 底部操作 */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Space size="large">
            <Button onClick={() => navigate('/cases')}>
              返回案例库
            </Button>
            
            {hasRole(['teacher', 'admin']) && !canModify && (
              <Button type="primary" onClick={() => navigate('/create-case')}>
                创建新案例
              </Button>
            )}

            {caseData.attachment_filename && (
              <Button 
                type="primary"
                icon={<DownloadOutlined />}
                href={attachmentAPI.getDownloadUrl(caseData.attachment_path, caseData.attachment_filename)}
                target="_blank"
              >
                下载附件
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default CaseDetailPage; 