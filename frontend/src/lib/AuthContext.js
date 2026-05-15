'use client';

import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authApi, profileApi } from './api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  tiktokConnected: false,
  tokenValid: false
};

// Action types
const AUTH_ACTIONS = {
  INIT: 'INIT',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  SET_TIKTOK_STATUS: 'SET_TIKTOK_STATUS'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.INIT:
      return {
        ...state,
        isLoading: false
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        tiktokConnected: action.payload.user?.tokens?.access_token ? true : false,
        tokenValid: action.payload.user?.tokens?.access_token ? true : false
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.SET_TIKTOK_STATUS:
      return {
        ...state,
        tiktokConnected: action.payload.connected,
        tokenValid: action.payload.valid
      };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(null);

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('pm3k_token');
        const userData = localStorage.getItem('pm3k_user');
        
        if (token && userData) {
          const user = JSON.parse(userData);
          
          // Verify token is still valid
          try {
            const response = await authApi.getMe();
            if (response.data?.success) {
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user: response.data.data.user,
                  token
                }
              });
              
              // Update localStorage with fresh user data
              localStorage.setItem('pm3k_user', JSON.stringify(response.data.data.user));
              return;
            }
          } catch (error) {
            // Token invalid, clear storage
            console.log('Token verification failed, clearing auth');
            localStorage.removeItem('pm3k_token');
            localStorage.removeItem('pm3k_user');
          }
        }
        
        dispatch({ type: AUTH_ACTIONS.INIT });
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: AUTH_ACTIONS.INIT });
      }
    };

    initAuth();
  }, []);

  // Login with TikTok
  const loginWithTikTok = useCallback(async () => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    
    try {
      // Get OAuth URL from backend
      const response = await authApi.getOAuthUrl();
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to get OAuth URL');
      }
      
      return {
        success: true,
        oauthUrl: response.data.data.url,
        state: response.data.data.state
      };
    } catch (error) {
      console.error('TikTok login error:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || error.message || 'Login failed'
      });
      return { success: false, error: error.message };
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (code, state) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
    
    try {
      const response = await authApi.tiktokCallback(code, state);
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'OAuth callback failed');
      }
      
      const { token, user } = response.data.data;
      
      // Store in localStorage
      localStorage.setItem('pm3k_token', token);
      localStorage.setItem('pm3k_user', JSON.stringify(user));
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      console.error('OAuth callback error:', error);
      dispatch({
        type: AUTH_ACTIONS.SET_ERROR,
        payload: error.response?.data?.message || error.message || 'Authentication failed'
      });
      return { success: false, error: error.message };
    }
  }, []);

  // Logout
  const logout = useCallback(async (revokeTikTok = false) => {
    try {
      if (revokeTikTok) {
        await authApi.logout({ revoke_tiktok: true });
      }
    } catch (error) {
      console.log('Logout API error (continuing anyway):', error);
    }
    
    // Clear localStorage
    localStorage.removeItem('pm3k_token');
    localStorage.removeItem('pm3k_user');
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await authApi.refreshToken();
      
      if (response.data?.success) {
        dispatch({
          type: AUTH_ACTIONS.SET_TIKTOK_STATUS,
          payload: { connected: true, valid: true }
        });
        return { success: true };
      }
      
      return { success: false };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    localStorage.setItem('pm3k_user', JSON.stringify({ ...state.user, ...userData }));
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  }, [state.user]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    ...state,
    loginWithTikTok,
    handleOAuthCallback,
    logout,
    refreshToken,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default AuthContext;
