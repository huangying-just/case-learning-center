import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// 初始状态
const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  INITIALIZE_AUTH: 'INITIALIZE_AUTH',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case AUTH_ACTIONS.INITIALIZE_AUTH:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false,
      };
    
    default:
      return state;
  }
};

// 创建Context
const AuthContext = createContext();

// AuthProvider组件
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化认证状态（从localStorage恢复）
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    let user = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('user');
      }
    }

    dispatch({
      type: AUTH_ACTIONS.INITIALIZE_AUTH,
      payload: { user, token },
    });
  }, []);

  // 登录
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.login(credentials);
      const { token, user } = response.data;

      // 存储到localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      const errorMessage = error.response?.data?.error || '登录失败';
      return { success: false, error: errorMessage };
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const response = await authAPI.register(userData);
      const { token, user } = response.data;

      // 存储到localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      const errorMessage = error.response?.data?.error || '注册失败';
      return { success: false, error: errorMessage };
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // 检查用户权限
  const hasRole = (roles) => {
    if (!state.user) return false;
    return roles.includes(state.user.role);
  };

  const contextValue = {
    ...state,
    login,
    register,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }
  return context;
};

export default AuthContext; 