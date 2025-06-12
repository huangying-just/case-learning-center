import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Upload, 
  Typography, 
  message,
  Breadcrumb,
  Space,
  Spin
} from 'antd';
import { 
  ArrowLeftOutlined,
  UploadOutlined,
  SaveOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { casesAPI } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CaseFormPage = ({ isEdit = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [fileList, setFileList] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEdit && id) {
      fetchCaseData();
    }
  }, [isEdit, id]);

  const fetchCaseData = async () => {
    try {
      setInitialLoading(true);
      const response = await casesAPI.getCaseById(id);
      const caseData = response.data.case;
      
      // 填充表单
      form.setFieldsValue({
        title: caseData.title,
        content: caseData.content,
      });

      // 如果有附件，显示当前附件信息
      if (caseData.attachment_filename) {
        setFileList([{
          uid: '-1',
          name: caseData.attachment_filename,
          status: 'done',
          url: `/attachments/${caseData.attachment_path}?name=${encodeURIComponent(caseData.attachment_filename)}`,
        }]);
      }
    } catch (error) {
      message.error('获取案例数据失败');
      navigate('/cases');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      
      // 处理文件上传
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('attachment', fileList[0].originFileObj);
      }

      let response;
      if (isEdit) {
        response = await casesAPI.updateCase(id, formData);
        message.success('案例更新成功！');
      } else {
        response = await casesAPI.createCase(formData);
        message.success('案例创建成功！');
      }

      // 跳转到案例详情页
      const caseId = isEdit ? id : response.data.case.id;
      navigate(`/cases/${caseId}`);

    } catch (error) {
      const errorMessage = error.response?.data?.error || 
        (isEdit ? '更新案例失败' : '创建案例失败');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 文件上传配置
  const uploadProps = {
    name: 'attachment',
    fileList,
    beforeUpload: (file) => {
      // 检查文件类型
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        message.error('只支持PDF、Word、PowerPoint和文本文件！');
        return false;
      }

      // 检查文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        message.error('文件大小不能超过10MB！');
        return false;
      }

      return false; // 阻止自动上传
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList.slice(-1)); // 只保留最新的一个文件
    },
    onRemove: () => {
      setFileList([]);
    },
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="加载案例数据中..." />
      </div>
    );
  }

  const pageTitle = isEdit ? '编辑案例' : '创建案例';

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
        {isEdit && (
          <Breadcrumb.Item>
            <Link to={`/cases/${id}`}>案例详情</Link>
          </Breadcrumb.Item>
        )}
        <Breadcrumb.Item>{pageTitle}</Breadcrumb.Item>
      </Breadcrumb>

      {/* 返回按钮 */}
      <Button 
        type="text" 
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(isEdit ? `/cases/${id}` : '/cases')}
        style={{ marginBottom: '16px' }}
      >
        返回{isEdit ? '案例详情' : '案例库'}
      </Button>

      {/* 表单卡片 */}
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
          {pageTitle}
        </Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="title"
            label="案例标题"
            rules={[
              { required: true, message: '请输入案例标题！' },
              { min: 5, message: '标题至少5个字符！' },
              { max: 100, message: '标题最多100个字符！' }
            ]}
          >
            <Input 
              placeholder="请输入案例标题，简洁明了地概括案例内容"
              showCount
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="案例内容"
            rules={[
              { required: true, message: '请输入案例内容！' },
              { min: 50, message: '内容至少50个字符！' },
              { max: 5000, message: '内容最多5000个字符！' }
            ]}
          >
            <TextArea
              placeholder="请详细描述案例的背景、过程、分析和结论..."
              rows={12}
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item
            label="附件文件"
            extra="支持PDF、Word、PowerPoint和文本文件，文件大小不超过10MB"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>
                选择文件
              </Button>
            </Upload>
          </Form.Item>

          {/* 提示信息 */}
          <Card size="small" style={{ backgroundColor: '#f0f9ff', marginBottom: '24px' }}>
            <Space direction="vertical" size="small">
              <Text strong style={{ color: '#1890ff' }}>
                <FileTextOutlined /> 案例编写提示：
              </Text>
              <Text>• 标题要简洁明了，准确概括案例主题</Text>
              <Text>• 内容应包含案例背景、具体情况、分析过程和学习要点</Text>
              <Text>• 可以上传相关的PDF、Word或PPT文档作为补充材料</Text>
              <Text>• 建议内容结构清晰，便于学习者理解和学习</Text>
            </Space>
          </Card>

          <Form.Item style={{ textAlign: 'center' }}>
            <Space size="large">
              <Button 
                size="large"
                onClick={() => navigate(isEdit ? `/cases/${id}` : '/cases')}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                icon={<SaveOutlined />}
              >
                {isEdit ? '更新案例' : '创建案例'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CaseFormPage; 