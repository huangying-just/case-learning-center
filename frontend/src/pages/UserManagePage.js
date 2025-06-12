import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
  Statistic,
  Avatar,
  Divider,
  Search,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserAddOutlined,
  TeamOutlined,
  CrownOutlined,
  BookOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const UserManagePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [stats, setStats] = useState(null);
  const { hasRole } = useAuth();

  useEffect(() => {
    if (hasRole(['admin'])) {
      fetchUsers();
      fetchStats();
    }
  }, [hasRole, pagination.current, pagination.pageSize, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm,
        role: roleFilter
      };
      
      const response = await usersAPI.getAllUsers(params);
      setUsers(response.data.users);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      message.error('获取用户列表失败');
      console.error('获取用户列表错误:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await usersAPI.getUserStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('获取用户统计错误:', error);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    setModalVisible(true);
    form.resetFields();
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalVisible(true);
    form.setFieldsValue({
      username: user.username,
      role: user.role
    });
  };

  const handleDelete = async (userId) => {
    try {
      await usersAPI.deleteUser(userId);
      message.success('用户删除成功');
      fetchUsers();
      fetchStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error || '删除用户失败';
      message.error(errorMessage);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        await usersAPI.updateUser(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        await usersAPI.createUser(values);
        message.success('用户创建成功');
      }
      
      setModalVisible(false);
      form.resetFields();
      fetchUsers();
      fetchStats();
    } catch (error) {
      const errorMessage = error.response?.data?.error || '操作失败';
      message.error(errorMessage);
    }
  };

  const handleTableChange = (paginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize
    }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'teacher':
        return 'blue';
      case 'student':
        return 'green';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <CrownOutlined />;
      case 'teacher':
        return <BookOutlined />;
      case 'student':
        return <UserOutlined />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'teacher':
        return '教师';
      case 'student':
        return '学生';
      default:
        return role;
    }
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_, record) => (
        <Space>
          <Avatar 
            size={40} 
            icon={<UserOutlined />}
            style={{ backgroundColor: getRoleColor(record.role) }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ID: {record.id}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={getRoleColor(role)} icon={getRoleIcon(role)}>
          {getRoleName(role)}
        </Tag>
      ),
      filters: [
        { text: '管理员', value: 'admin' },
        { text: '教师', value: 'teacher' },
        { text: '学生', value: 'student' },
      ],
    },
    {
      title: '案例数量',
      dataIndex: 'case_count',
      key: 'case_count',
      render: (count) => (
        <Statistic 
          value={count} 
          suffix="个"
          valueStyle={{ fontSize: '14px' }}
        />
      ),
      sorter: (a, b) => a.case_count - b.case_count,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('zh-CN'),
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑用户">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="删除用户"
            description={`确定要删除用户 "${record.username}" 吗？`}
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除用户">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!hasRole(['admin'])) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Title level={3}>权限不足</Title>
        <Text>只有管理员可以访问用户管理页面</Text>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        <TeamOutlined /> 用户管理
      </Title>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.total_users}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="管理员"
                value={stats.admin_count}
                prefix={<CrownOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="教师"
                value={stats.teacher_count}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="学生"
                value={stats.student_count}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space size="middle">
              <Input.Search
                placeholder="搜索用户名..."
                allowClear
                style={{ width: 250 }}
                onSearch={setSearchTerm}
                onChange={(e) => {
                  if (!e.target.value) {
                    setSearchTerm('');
                  }
                }}
              />
              <Select
                placeholder="筛选角色"
                allowClear
                style={{ width: 120 }}
                value={roleFilter}
                onChange={setRoleFilter}
              >
                <Option value="admin">管理员</Option>
                <Option value="teacher">教师</Option>
                <Option value="student">学生</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchUsers();
                  fetchStats();
                }}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                添加用户
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 用户表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={
          <Space>
            <UserAddOutlined />
            {editingUser ? '编辑用户' : '添加用户'}
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                placeholder="请输入密码"
              />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item
              name="password"
              label="新密码（留空表示不修改）"
              rules={[
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password
                placeholder="留空表示不修改密码"
              />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="用户角色"
            rules={[{ required: true, message: '请选择用户角色' }]}
            initialValue="student"
          >
            <Select placeholder="请选择用户角色">
              <Option value="admin">
                <Space>
                  <CrownOutlined style={{ color: '#f5222d' }} />
                  管理员
                </Space>
              </Option>
              <Option value="teacher">
                <Space>
                  <BookOutlined style={{ color: '#1890ff' }} />
                  教师
                </Space>
              </Option>
              <Option value="student">
                <Space>
                  <UserOutlined style={{ color: '#52c41a' }} />
                  学生
                </Space>
              </Option>
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagePage; 