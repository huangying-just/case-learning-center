import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Space,
  Breadcrumb,
  Row,
  Col,
  InputNumber,
  Switch,
  Tag
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { configAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const ConfigManagePage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  // 配置类型选项
  const configTypes = [
    { value: 'industry', label: '行业' },
    { value: 'language', label: '语言' },
    { value: 'case_type', label: '案例类型' },
    { value: 'subject', label: '学科领域' },
    { value: 'target_audience', label: '适用对象' },
  ];

  useEffect(() => {
    if (user?.role !== 'admin') {
      message.error('只有管理员可以访问此页面');
      return;
    }
    fetchConfigs();
  }, [user]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await configAPI.getAdminConfigs();
      setConfigs(response.data.configs);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingConfig(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await configAPI.deleteConfig(id);
      message.success('删除成功');
      fetchConfigs();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingConfig) {
        await configAPI.updateConfig(editingConfig.id, values);
        message.success('更新成功');
      } else {
        await configAPI.createConfig(values);
        message.success('添加成功');
      }
      setModalVisible(false);
      fetchConfigs();
    } catch (error) {
      const errorMsg = error.response?.data?.error || (editingConfig ? '更新失败' : '添加失败');
      message.error(errorMsg);
    }
  };

  const columns = [
    {
      title: '配置类型',
      dataIndex: 'config_type',
      key: 'config_type',
      render: (type) => {
        const typeInfo = configTypes.find(t => t.value === type);
        return typeInfo ? typeInfo.label : type;
      },
      filters: configTypes.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.config_type === value,
    },
    {
      title: '配置值',
      dataIndex: 'config_value',
      key: 'config_value',
    },
    {
      title: '显示名称',
      dataIndex: 'display_name',
      key: 'display_name',
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      key: 'sort_order',
      sorter: (a, b) => a.sort_order - b.sort_order,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckOutlined /> : <CloseOutlined />}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      ),
      filters: [
        { text: '启用', value: 1 },
        { text: '禁用', value: 0 },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个配置项吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Title level={3}>访问权限不足</Title>
        <p>只有管理员可以访问配置管理页面</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 面包屑导航 */}
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item>
          <Link to="/">首页</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>系统配置</Breadcrumb.Item>
      </Breadcrumb>

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={2}>
              <SettingOutlined /> 配置管理
            </Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加配置
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 添加/编辑配置模态框 */}
      <Modal
        title={editingConfig ? '编辑配置' : '添加配置'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="config_type"
            label="配置类型"
            rules={[{ required: true, message: '请选择配置类型' }]}
          >
            <Select placeholder="请选择配置类型">
              {configTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="config_value"
            label="配置值"
            rules={[
              { required: true, message: '请输入配置值' },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: '配置值只能包含字母、数字、下划线和横线' }
            ]}
          >
            <Input placeholder="请输入配置值（英文标识）" />
          </Form.Item>

          <Form.Item
            name="display_name"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="请输入显示名称（中文名称）" />
          </Form.Item>

          <Form.Item
            name="sort_order"
            label="排序"
            initialValue={0}
          >
            <InputNumber
              min={0}
              max={999}
              placeholder="排序值，数字越小越靠前"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ConfigManagePage; 