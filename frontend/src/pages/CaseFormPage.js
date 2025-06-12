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
  Spin,
  Select,
  Row,
  Col,
  Divider,
  Tag
} from 'antd';
import { 
  ArrowLeftOutlined,
  UploadOutlined,
  SaveOutlined,
  FileTextOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { casesAPI, configAPI, attachmentAPI } from '../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CaseFormPage = ({ isEdit = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [configLoading, setConfigLoading] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [configs, setConfigs] = useState({});
  const [customKnowledgePoints, setCustomKnowledgePoints] = useState([]);
  const [customTeachingPoints, setCustomTeachingPoints] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchConfigs();
    if (isEdit && id) {
      fetchCaseData();
    }
  }, [isEdit, id]);

  const fetchConfigs = async () => {
    try {
      setConfigLoading(true);
      const response = await configAPI.getAllConfigs();
      setConfigs(response.data.configs);
    } catch (error) {
      message.error('获取配置选项失败');
    } finally {
      setConfigLoading(false);
    }
  };

  const fetchCaseData = async () => {
    try {
      setInitialLoading(true);
      const response = await casesAPI.getCaseById(id);
      const caseData = response.data.case;
      
      // 解析数组字段
      const knowledgePoints = Array.isArray(caseData.knowledge_points) 
        ? caseData.knowledge_points 
        : (caseData.knowledge_points ? JSON.parse(caseData.knowledge_points) : []);
      
      const teachingPoints = Array.isArray(caseData.teaching_points) 
        ? caseData.teaching_points 
        : (caseData.teaching_points ? JSON.parse(caseData.teaching_points) : []);
      
      const tags = Array.isArray(caseData.tags) 
        ? caseData.tags 
        : (caseData.tags ? JSON.parse(caseData.tags) : []);

      // 填充表单
      form.setFieldsValue({
        title: caseData.title,
        content: caseData.content,
        summary: caseData.summary,
        industry: caseData.industry,
        language: caseData.language || 'zh-CN',
        case_type: caseData.case_type,
        subject: caseData.subject,
        knowledge_points: knowledgePoints,
        target_audience: caseData.target_audience,
        teaching_points: teachingPoints,
        tags: tags,
      });

      setCustomKnowledgePoints(knowledgePoints);
      setCustomTeachingPoints(teachingPoints);
      setCustomTags(tags);

      // 加载现有附件信息
      const existingFiles = [];
      
      // 兼容老的单附件格式
      if (caseData.attachment_filename && caseData.attachment_path) {
        existingFiles.push({
          uid: 'legacy-attachment',
          name: caseData.attachment_filename,
          status: 'done',
          url: attachmentAPI.getDownloadUrl(caseData.attachment_path, caseData.attachment_filename),
        });
      }
      
      // 加载新的多附件格式
      if (caseData.attachments && caseData.attachments.length > 0) {
        caseData.attachments.forEach((attachment, index) => {
          existingFiles.push({
            uid: `attachment-${attachment.id}`,
            name: attachment.original_name,
            status: 'done',
            url: attachmentAPI.getDownloadUrl(attachment.filename, attachment.original_name),
            size: attachment.file_size,
            type: attachment.mime_type,
            attachmentId: attachment.id, // 用于删除时识别
          });
        });
      }
      
      setFileList(existingFiles);
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
      formData.append('summary', values.summary || '');
      formData.append('industry', values.industry || '');
      formData.append('language', values.language || 'zh-CN');
      formData.append('case_type', values.case_type || '');
      formData.append('subject', values.subject || '');
      formData.append('target_audience', values.target_audience || '');
      
      // 处理数组字段
      formData.append('knowledge_points', JSON.stringify(values.knowledge_points || []));
      formData.append('teaching_points', JSON.stringify(values.teaching_points || []));
      formData.append('tags', JSON.stringify(values.tags || []));
      
      // 处理多文件上传
      const attachmentFiles = fileList.filter(file => file.originFileObj);
      attachmentFiles.forEach(file => {
        formData.append('attachments', file.originFileObj);
      });

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
    name: 'attachments',
    fileList,
    multiple: true,
    beforeUpload: (file) => {
      // 检查文件类型
      const allowedTypes = [
        // 文档类型
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Markdown
        'text/markdown',
        'text/x-markdown',
        // 图片类型
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/bmp',
        'image/svg+xml',
        'image/webp',
        // 网页文件
        'text/html'
      ];
      
      // 获取文件扩展名进行额外检查
      const fileName = file.name.toLowerCase();
      const allowedExtensions = [
        '.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx',
        '.md', '.markdown',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp',
        '.html', '.htm'
      ];
      
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!allowedTypes.includes(file.type) && !hasValidExtension) {
        message.error('不支持的文件类型！支持文档(PDF、Word、PowerPoint、TXT)、Markdown(MD)、图片(JPG、PNG、GIF、SVG等)和网页(HTML)文件。');
        return false;
      }

      // 检查文件大小（20MB）
      if (file.size > 20 * 1024 * 1024) {
        message.error('文件大小不能超过20MB！');
        return false;
      }

      return false; // 阻止自动上传
    },
    onChange: ({ fileList: newFileList }) => {
      // 限制最多10个文件
      if (newFileList.length > 10) {
        message.warning('最多只能上传10个附件！');
        return;
      }
      setFileList(newFileList);
    },
    onRemove: (file) => {
      const newFileList = fileList.filter(item => item.uid !== file.uid);
      setFileList(newFileList);
    },
  };

  // 自定义标签输入
  const handleCustomInput = (value, type) => {
    if (!value || !value.trim()) {
      return; // 防止添加空白标签
    }
    
    const trimmedValue = value.trim();
    let currentList;
    let updatedList;
    let fieldName;
    let typeName;
    
    switch (type) {
      case 'knowledge':
        currentList = customKnowledgePoints;
        fieldName = 'knowledge_points';
        typeName = '知识点';
        break;
      case 'teaching':
        currentList = customTeachingPoints;
        fieldName = 'teaching_points';
        typeName = '教学知识点';
        break;
      case 'tags':
        currentList = customTags;
        fieldName = 'tags';
        typeName = '标签';
        break;
      default:
        return;
    }
    
    // 检查是否重复
    if (currentList.includes(trimmedValue)) {
      message.warning(`${typeName} "${trimmedValue}" 已存在`);
      return;
    }
    
    // 添加新标签
    updatedList = [...currentList, trimmedValue];
    
    switch (type) {
      case 'knowledge':
        setCustomKnowledgePoints(updatedList);
        break;
      case 'teaching':
        setCustomTeachingPoints(updatedList);
        break;
      case 'tags':
        setCustomTags(updatedList);
        break;
    }
    
    form.setFieldsValue({ [fieldName]: updatedList });
    message.success(`${typeName} "${trimmedValue}" 添加成功`);
  };

  const removeCustomItem = (item, type) => {
    let updatedList;
    let fieldName;
    
    switch (type) {
      case 'knowledge':
        updatedList = customKnowledgePoints.filter(point => point !== item);
        setCustomKnowledgePoints(updatedList);
        fieldName = 'knowledge_points';
        break;
      case 'teaching':
        updatedList = customTeachingPoints.filter(point => point !== item);
        setCustomTeachingPoints(updatedList);
        fieldName = 'teaching_points';
        break;
      case 'tags':
        updatedList = customTags.filter(tag => tag !== item);
        setCustomTags(updatedList);
        fieldName = 'tags';
        break;
      default:
        return;
    }
    
    form.setFieldsValue({ [fieldName]: updatedList });
  };

  if (initialLoading || configLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  const pageTitle = isEdit ? '编辑案例' : '创建案例';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
          {/* 基本信息 */}
          <Divider orientation="left">基本信息</Divider>
          
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
            name="summary"
            label="案例摘要"
            rules={[
              { max: 500, message: '摘要最多500个字符！' }
            ]}
          >
            <TextArea
              placeholder="请简要概述案例的核心内容和主要学习要点（选填）"
              rows={4}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="案例正文"
            rules={[
              { required: true, message: '请输入案例内容！' },
              { min: 50, message: '内容至少50个字符！' },
              { max: 50000, message: '内容最多50000个字符！' }
            ]}
          >
            <TextArea
              placeholder="请详细描述案例的背景、过程、分析和结论..."
              rows={12}
              showCount
              maxLength={50000}
            />
          </Form.Item>

          {/* 分类信息 */}
          <Divider orientation="left">分类信息</Divider>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="industry"
                label="所属行业"
              >
                <Select placeholder="请选择所属行业" allowClear>
                  {configs.industry?.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="language"
                label="语言"
                initialValue="zh-CN"
              >
                <Select placeholder="请选择语言">
                  {configs.language?.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="case_type"
                label="案例类型"
              >
                <Select placeholder="请选择案例类型" allowClear>
                  {configs.case_type?.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subject"
                label="学科领域"
              >
                <Select placeholder="请选择学科领域" allowClear>
                  {configs.subject?.map(item => (
                    <Option key={item.value} value={item.value}>
                      {item.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="target_audience"
            label="适用对象"
          >
            <Select placeholder="请选择适用对象" allowClear>
              {configs.target_audience?.map(item => (
                <Option key={item.value} value={item.value}>
                  {item.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 教学标签 */}
          <Divider orientation="left">教学标签</Divider>
          
          <Form.Item
            name="knowledge_points"
            label="知识点"
          >
            <div>
              <Input
                placeholder="输入知识点后按回车添加"
                onPressEnter={(e) => {
                  e.preventDefault(); // 阻止表单提交
                  const value = e.target.value;
                  if (value.trim()) {
                    handleCustomInput(value, 'knowledge');
                    e.target.value = '';
                  }
                }}
                suffix={
                  <PlusOutlined 
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="输入知识点后按回车添加"]');
                      if (input && input.value.trim()) {
                        handleCustomInput(input.value, 'knowledge');
                        input.value = '';
                        input.focus();
                      }
                    }}
                  />
                }
              />
              <div style={{ marginTop: '8px' }}>
                {customKnowledgePoints.map(point => (
                  <Tag 
                    key={point} 
                    closable 
                    onClose={() => removeCustomItem(point, 'knowledge')}
                    style={{ marginBottom: '4px' }}
                  >
                    {point}
                  </Tag>
                ))}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="teaching_points"
            label="教学知识点"
          >
            <div>
              <Input
                placeholder="输入教学知识点后按回车添加"
                onPressEnter={(e) => {
                  e.preventDefault(); // 阻止表单提交
                  const value = e.target.value;
                  if (value.trim()) {
                    handleCustomInput(value, 'teaching');
                    e.target.value = '';
                  }
                }}
                suffix={
                  <PlusOutlined 
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="输入教学知识点后按回车添加"]');
                      if (input && input.value.trim()) {
                        handleCustomInput(input.value, 'teaching');
                        input.value = '';
                        input.focus();
                      }
                    }}
                  />
                }
              />
              <div style={{ marginTop: '8px' }}>
                {customTeachingPoints.map(point => (
                  <Tag 
                    key={point} 
                    closable 
                    onClose={() => removeCustomItem(point, 'teaching')}
                    style={{ marginBottom: '4px' }}
                  >
                    {point}
                  </Tag>
                ))}
              </div>
            </div>
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <div>
              <Input
                placeholder="输入标签后按回车添加"
                onPressEnter={(e) => {
                  e.preventDefault(); // 阻止表单提交
                  const value = e.target.value;
                  if (value.trim()) {
                    handleCustomInput(value, 'tags');
                    e.target.value = '';
                  }
                }}
                suffix={
                  <PlusOutlined 
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="输入标签后按回车添加"]');
                      if (input && input.value.trim()) {
                        handleCustomInput(input.value, 'tags');
                        input.value = '';
                        input.focus();
                      }
                    }}
                  />
                }
              />
              <div style={{ marginTop: '8px' }}>
                {customTags.map(tag => (
                  <Tag 
                    key={tag} 
                    closable 
                    onClose={() => removeCustomItem(tag, 'tags')}
                    style={{ marginBottom: '4px' }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </Form.Item>

          {/* 附件上传 */}
          <Divider orientation="left">附件文件</Divider>
          
          <Form.Item
            label="附件文件"
            extra="支持文档(PDF、Word、PowerPoint、TXT)、Markdown(MD)、图片(JPG、PNG、GIF、SVG等)和网页(HTML)文件，文件大小不超过20MB"
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
              <Text>• 摘要简要概述核心内容，正文详细描述案例情况</Text>
              <Text>• 选择合适的分类信息有助于其他用户快速找到相关案例</Text>
              <Text>• 教学标签帮助明确学习目标和知识点</Text>
              <Text>• 可以上传文档、图片、Markdown或HTML文件作为补充材料</Text>
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