'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authApi } from './api';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function authReducer(state, action) {
  switch (action.type) {
    case 'INIT':
      return { ...state, isLoading: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('pm3k_token');
        const userData = localStorage.getItem('pm3k_user');
        
        if (token && userData) {
          const response = await authApi.getMe();
          if (response.data?.success) {
            localStorage.setItem('pm3k_user', JSON.stringify(response.data.data.user));
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: { user: response.data.data.user, token }
            });
            return;
          }
        }
      } catch (error) {
        localStorage.removeItem('pm3k_token');
        localStorage.removeItem('pm3k_user');
      }
      dispatch({ type: 'INIT' });
    };

    initAuth();
  }, []);

  const loginWithTikTok = useCallback(async () => {
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const response = await authApi.getOAuthUrl();
      if (response.data?.success) {
        sessionStorage.setItem('oauth_state', response.data.data.state);
        return { success: true, oauthUrl: response.data.data.url, state: response.data.data.state };
      }
      throw new Error(response.data?.message || 'Failed to get OAuth URL');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const handleOAuthCallback = useCallback(async (code, state) => {
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const response = await authApi.tiktokCallback(code, state);
      if (response.data?.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('pm3k_token', token);
        localStorage.setItem('pm3k_user', JSON.stringify(user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        return { success: true };
      }
      throw new Error(response.data?.message || 'OAuth callback failed');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {}
    localStorage.removeItem('pm3k_token');
    localStorage.removeItem('pm3k_user');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = { ...state, loginWithTikTok, handleOAuthCallback, logout, clearError };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
