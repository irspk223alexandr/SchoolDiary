import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAuth: false,
  user: null,
  token: null,
  roles: [],
  loading: true
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuth = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.roles = action.payload.user?.roles || [];
      state.loading = false;
      // Сохраняем в localStorage для надёжности
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.isAuth = false;
      state.user = null;
      state.token = null;
      state.roles = [];
      state.loading = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    restoreSession: (state, action) => {
      const { user, token } = action.payload;
      state.isAuth = true;
      state.user = user;
      state.token = token;
      state.roles = user?.roles || [];
      state.loading = false;
    }
  }
});

export const { login, logout, updateUser, setLoading, restoreSession } = authSlice.actions;
export default authSlice.reducer;