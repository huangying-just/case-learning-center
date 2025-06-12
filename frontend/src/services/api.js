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
  getAllCases: () => api.get('/cases'),
  
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
};

// 附件API
export const attachmentAPI = {
  // 获取附件下载URL
  getDownloadUrl: (filename, originalName) => {
    const params = originalName ? `?name=${encodeURIComponent(originalName)}` : '';
    return `/attachments/${filename}${params}`;
  },
};

export default api; 