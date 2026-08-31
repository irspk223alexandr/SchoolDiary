import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import { login, logout, setLoading, restoreSession } from './authSlice';

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { dispatch }) => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (!token) {
      dispatch(setLoading(false));
      return;
    }

    try {
      // Пытаемся восстановить из localStorage
      if (savedUser) {
        const user = JSON.parse(savedUser);
        // Проверяем, что токен ещё валидный
        const res = await api.get('/user/profile');
        if (res.data) {
          dispatch(restoreSession({ user: { ...res.data, roles: user.roles || [] }, token }));
          return;
        }
      }

      // Если не получилось — проверяем через API
      const res = await api.get('/user/profile');
      const user = res.data;
      
      // Получаем роли
      const rolesRes = await api.get('/auth/roles'); // нужен новый маршрут
      user.roles = rolesRes.data || [];
      
      dispatch(login({ token, user }));
    } catch (error) {
      console.error('Ошибка восстановления сессии:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch(logout());
      dispatch(setLoading(false));
    }
  }
);