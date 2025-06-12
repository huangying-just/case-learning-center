import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 请求拦截器 - 自动添加认证令牌
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 令牌过期或无效，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证API
export const authAPI = {
  // 用户注册
  register: (userData) => api.post('/auth/register', userData),
  
  // 用户登录
  login: (credentials) => api.post('/auth/login', credentials),
};

// 案例API
export const casesAPI = {
  // 获取所有案例
  getAllCases: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    });
    const queryString = params.toString();
    return api.get(`/cases${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取筛选选项
  getFilterOptions: () => api.get('/cases/filter-options'),
  
  // 获取单个案例
  getCaseById: (id) => api.get(`/cases/${id}`),
  
  // 创建案例
  createCase: (formData) => api.post('/cases', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // 更新案例
  updateCase: (id, formData) => api.put(`/cases/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // 删除案例
  deleteCase: (id) => api.delete(`/cases/${id}`),
  
  // 添加附件到案例
  addAttachments: (caseId, formData) => api.post(`/cases/${caseId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  // 删除案例附件
  deleteAttachment: (caseId, attachmentId) => api.delete(`/cases/${caseId}/attachments/${attachmentId}`),
};

// 附件API
export const attachmentAPI = {
  // 获取附件下载URL
  getDownloadUrl: (filename, originalName) => {
    const params = originalName ? `?name=${encodeURIComponent(originalName)}` : '';
    // 在开发环境下使用后端端口，生产环境使用相对路径
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:9999' : '';
    return `${baseUrl}/attachments/${filename}${params}`;
  },
  
  // 直接下载附件的方法
  downloadAttachment: (filename, originalName) => {
    const url = attachmentAPI.getDownloadUrl(filename, originalName);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// 配置API
export const configAPI = {
  // 获取所有配置选项
  getAllConfigs: () => api.get('/config'),
  
  // 获取指定类型的配置选项
  getConfigByType: (type) => api.get(`/config/${type}`),
  
  // 管理员获取所有配置
  getAdminConfigs: () => api.get('/config/admin/all'),
  
  // 添加配置选项
  createConfig: (configData) => api.post('/config', configData),
  
  // 更新配置选项
  updateConfig: (id, configData) => api.put(`/config/${id}`, configData),
  
  // 删除配置选项
  deleteConfig: (id) => api.delete(`/config/${id}`),
};

// 用户管理API (仅管理员)
export const usersAPI = {
  // 获取用户列表
  getAllUsers: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    return api.get(`/users${queryString ? `?${queryString}` : ''}`);
  },
  
  // 获取用户详情
  getUserById: (id) => api.get(`/users/${id}`),
  
  // 创建用户
  createUser: (userData) => api.post('/users', userData),
  
  // 更新用户
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  
  // 删除用户
  deleteUser: (id) => api.delete(`/users/${id}`),
  
  // 获取用户统计
  getUserStats: () => api.get('/users/stats/overview'),
};

export default api; 