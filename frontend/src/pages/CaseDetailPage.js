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
  Breadcrumb,
  Image 
} from 'antd';
import { 
  ArrowLeftOutlined,
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileMarkdownOutlined,
  GlobalOutlined
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
  const { user, hasRole, isAuthenticated } = useAuth();

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

  // 获取文件类型图标和判断是否为图片
  const getFileIcon = (filename) => {
    if (!filename) return <FileTextOutlined />;
    
    const ext = filename.toLowerCase().split('.').pop();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const markdownTypes = ['md', 'markdown'];
    const htmlTypes = ['html', 'htm'];
    
    if (imageTypes.includes(ext)) {
      return <FileImageOutlined style={{ color: '#722ed1' }} />;
    } else if (markdownTypes.includes(ext)) {
      return <FileMarkdownOutlined style={{ color: '#13c2c2' }} />;
    } else if (htmlTypes.includes(ext)) {
      return <GlobalOutlined style={{ color: '#fa8c16' }} />;
    } else {
      return <FileTextOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const isImageFile = (filename) => {
    if (!filename) return false;
    const ext = filename.toLowerCase().split('.').pop();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageTypes.includes(ext);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="加载案例详情中..." />
      </div>
    );
  }

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
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
          <Breadcrumb.Item>案例详情</Breadcrumb.Item>
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

        {/* 登录提示卡片 */}
        <Card style={{ textAlign: 'center', padding: '60px 0' }}>
          <Title level={3} style={{ color: '#1890ff', marginBottom: '16px' }}>
            查看案例详情需要登录
          </Title>
          <Text type="secondary" style={{ fontSize: '16px', marginBottom: '24px', display: 'block' }}>
            登录后即可查看完整的案例内容、下载附件等更多功能
          </Text>
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={() => navigate('/login', { state: { from: `/cases/${id}` } })}
            >
              立即登录
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/register', { state: { from: `/cases/${id}` } })}
            >
              注册账号
            </Button>
          </Space>
        </Card>
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
        {((caseData.attachment_filename && caseData.attachment_path) || (caseData.attachments && caseData.attachments.length > 0)) && (
          <div style={{ marginBottom: '24px' }}>
            <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <Title level={4} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <FileTextOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                附件列表
              </Title>
              
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* 兼容老格式的单个附件 */}
                {caseData.attachment_filename && caseData.attachment_path && (
                  <Card size="small" style={{ backgroundColor: '#fff' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        {getFileIcon(caseData.attachment_filename)}
                        <div>
                          <Text strong>{caseData.attachment_filename}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              老版本附件
                            </Text>
                          </div>
                        </div>
                      </Space>
                      <Button 
                        type="link" 
                        icon={<DownloadOutlined />}
                        onClick={() => attachmentAPI.downloadAttachment(caseData.attachment_path, caseData.attachment_filename)}
                      >
                        下载
                      </Button>
                    </Space>
                    
                    {/* 图片预览 */}
                    {isImageFile(caseData.attachment_filename) && (
                      <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <Image
                          width={200}
                          src={attachmentAPI.getDownloadUrl(caseData.attachment_path, caseData.attachment_filename)}
                          alt={caseData.attachment_filename}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                          style={{ borderRadius: '6px' }}
                        />
                      </div>
                    )}
                  </Card>
                )}
                
                {/* 新格式的多个附件 */}
                {caseData.attachments && caseData.attachments.map((attachment, index) => (
                  <Card key={attachment.id} size="small" style={{ backgroundColor: '#fff' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Space>
                        {getFileIcon(attachment.original_name)}
                        <div>
                          <Text strong>{attachment.original_name}</Text>
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {attachment.file_size && `大小: ${(attachment.file_size / 1024).toFixed(1)} KB`}
                              {attachment.mime_type && ` • 类型: ${attachment.mime_type.split('/')[1]?.toUpperCase()}`}
                            </Text>
                          </div>
                        </div>
                      </Space>
                      <Button 
                        type="link" 
                        icon={<DownloadOutlined />}
                        onClick={() => attachmentAPI.downloadAttachment(attachment.filename, attachment.original_name)}
                      >
                        下载
                      </Button>
                    </Space>
                    
                    {/* 图片预览 */}
                    {isImageFile(attachment.original_name) && (
                      <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <Image
                          width={200}
                          src={attachmentAPI.getDownloadUrl(attachment.filename, attachment.original_name)}
                          alt={attachment.original_name}
                          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                          style={{ borderRadius: '6px' }}
                        />
                      </div>
                    )}
                  </Card>
                ))}
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

            {caseData.attachment_filename && caseData.attachment_path && (
              <Button 
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() => attachmentAPI.downloadAttachment(caseData.attachment_path, caseData.attachment_filename)}
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